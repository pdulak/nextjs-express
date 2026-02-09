"use client";

import { useEffect, useRef, useState } from "react";
import { useABCJS } from "@/hooks/use-abcjs";
import type { MusicContents } from "@/lib/types";

interface MusicPlayerProps {
  contents: MusicContents;
  title: string;
}

interface Voice {
  lineIndex: number;
  midiLineIndex: number;
  name: string;
  program: number;
  originalProgram: number;
  enabled: boolean;
}

// CursorController class (ported from source)
class CursorController {
  elementId: string;
  cursor: SVGLineElement | null;
  lastCursorMiddle: number | null;
  followCursor: boolean;

  constructor(elementId: string) {
    this.elementId = elementId;
    this.cursor = null;
    this.lastCursorMiddle = null;
    this.followCursor = true;
  }

  setFollowCursor(state: boolean) {
    this.followCursor = state;
  }

  onReady() {
    console.log(`Cursor for ${this.elementId} is ready`);
  }

  onStart() {
    console.log(`Starting cursor for ${this.elementId}`);
    const svg = document.querySelector(`#${this.elementId} svg`);
    if (!svg) {
      console.error(`No SVG found in ${this.elementId}`);
      return;
    }

    // Remove existing cursor if any
    const oldCursor = svg.querySelector("line.abcjs-cursor");
    if (oldCursor) oldCursor.remove();

    // Create new cursor
    this.cursor = document.createElementNS("http://www.w3.org/2000/svg", "line") as SVGLineElement;
    this.cursor.setAttribute("class", "abcjs-cursor");
    this.cursor.setAttribute("id", `cursor-${this.elementId}`);
    this.cursor.style.stroke = "red";
    this.cursor.style.strokeWidth = "2px";
    this.cursor.setAttributeNS(null, 'x1', '0');
    this.cursor.setAttributeNS(null, 'y1', '0');
    this.cursor.setAttributeNS(null, 'x2', '0');
    this.cursor.setAttributeNS(null, 'y2', '0');
    svg.appendChild(this.cursor);
    console.log(`Created cursor for ${this.elementId}`);
  }

  onEvent(ev: any) {
    if (this.cursor) {
      this.cursor.setAttributeNS(null, 'x1', String(ev.left - 2));
      this.cursor.setAttributeNS(null, 'x2', String(ev.left - 2));
      this.cursor.setAttributeNS(null, 'y1', String(ev.top));
      this.cursor.setAttributeNS(null, 'y2', String(ev.top + ev.height));

      // Keep cursor in the middle of the viewport vertically
      this.scrollToCursor(ev.top, ev.height);
    }
  }

  scrollToCursor(cursorTop: number, cursorHeight: number) {
    // Skip if follow cursor is disabled
    if (!this.followCursor) return;

    const svgElement = document.querySelector(`#${this.elementId} svg`) as SVGSVGElement;
    if (!svgElement) return;

    // Calculate the middle of the cursor in SVG coordinates
    const cursorMiddle = cursorTop + (cursorHeight / 2);

    // Skip if position hasn't changed
    if (this.lastCursorMiddle === cursorMiddle) return;
    this.lastCursorMiddle = cursorMiddle;

    // Get the SVG element's viewport information
    const svgRect = svgElement.getBoundingClientRect();

    // Find the top offset of the SVG element
    const svgTopOffset = svgRect.top + window.scrollY;

    // Get the exact cursor position in page coordinates
    let cursorPagePosition: number;

    try {
      // Convert SVG coordinates to page coordinates
      const pt = svgElement.createSVGPoint();
      pt.x = 0;  // x position doesn't matter for vertical scrolling
      pt.y = cursorMiddle;

      // Get SVG's transformation matrix and apply it to our point
      const svgCTM = svgElement.getScreenCTM();
      if (svgCTM) {
        const transformedPt = pt.matrixTransform(svgCTM);
        cursorPagePosition = transformedPt.y + window.scrollY;
      } else {
        // Fallback if getScreenCTM is not available
        cursorPagePosition = svgTopOffset + cursorMiddle;
      }
    } catch (e) {
      // Fallback if any error occurs with SVG transformations
      cursorPagePosition = svgTopOffset + cursorMiddle;
    }

    // Calculate target scroll position to center cursor in viewport
    const targetScrollY = cursorPagePosition - (window.innerHeight / 2);

    // Perform the scroll if adjustment is significant
    if (Math.abs(targetScrollY - window.scrollY) > 20) {
      // Custom smooth scroll animation with 200ms duration
      this.smoothScrollTo(targetScrollY, 200);
    }
  }

  smoothScrollTo(targetY: number, duration: number) {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    // Easing function for smooth animation
    function easeInOutQuad(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutQuad(progress);

      window.scrollTo(0, startY + difference * easeProgress);

      if (elapsed < duration) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  onFinished() {
    if (this.cursor) {
      this.cursor.setAttributeNS(null, 'x1', '0');
      this.cursor.setAttributeNS(null, 'x2', '0');
      this.cursor.setAttributeNS(null, 'y1', '0');
      this.cursor.setAttributeNS(null, 'y2', '0');
      this.lastCursorMiddle = null;
    }
  }
}

export function MusicPlayer({ contents, title }: MusicPlayerProps) {
  const { isLoaded, ABCJS } = useABCJS();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const cursorControlRef = useRef<CursorController | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [currentAbcString, setCurrentAbcString] = useState("");

  // Parse voice definitions from ABC string
  const parseVoiceDefinitions = (abcString: string): Voice[] => {
    const voiceList: Voice[] = [];
    const lines = abcString.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('V:') && line.includes('nm="')) {
        // Extract voice name from nm="Voice Name"
        const nameMatch = line.match(/nm="([^"]+)"/);
        const voiceName = nameMatch ? nameMatch[1] : `Voice ${voiceList.length + 1}`;

        // Check for MIDI program in the next line
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

        if (nextLine.startsWith('%%MIDI program')) {
          const midiProgram = parseInt(nextLine.split('%%MIDI program')[1].trim(), 10);

          voiceList.push({
            lineIndex: i,
            midiLineIndex: i + 1,
            name: voiceName,
            program: midiProgram,
            originalProgram: midiProgram,
            enabled: true
          });
        }
      }
    }

    return voiceList;
  };

  // Update ABC string with new MIDI program values based on voice toggle states
  const updateVoiceMidiPrograms = (abcString: string, voiceList: Voice[]): string => {
    const lines = abcString.split('\n');

    voiceList.forEach(voice => {
      if (voice.midiLineIndex < lines.length) {
        // Set program to 200 (mute) if disabled, or original value if enabled
        const programValue = voice.enabled ? voice.originalProgram : 200;
        lines[voice.midiLineIndex] = `%%MIDI program ${programValue}`;
      }
    });

    return lines.join('\n');
  };

  // Parse voices when contents change
  useEffect(() => {
    const abcString = contents.allVoices || "";
    setCurrentAbcString(abcString);
    const parsedVoices = parseVoiceDefinitions(abcString);
    setVoices(parsedVoices);
  }, [contents]);

  // Render ABC notation and setup audio
  useEffect(() => {
    if (!isLoaded || !ABCJS || !containerRef.current || !audioRef.current) return;

    const abcString = currentAbcString;
    if (!abcString || !abcString.trim()) {
      containerRef.current.innerHTML = "";
      return;
    }

    try {
      // Cleanup previous synth
      if (synthRef.current) {
        try {
          synthRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Create cursor controller (always enabled)
      const cursorControl = new CursorController("music-viewer");
      cursorControl.setFollowCursor(true);
      cursorControlRef.current = cursorControl;

      // Render the score
      const visObj = ABCJS.renderAbc("music-viewer", abcString, {
        responsive: "resize",
        add_classes: true,
      })[0];

      // Setup audio if supported
      if (window.AudioContext || (window as any).webkitAudioContext) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const createSynth = new ABCJS.synth.CreateSynth();
        synthRef.current = createSynth;

        createSynth.init({
          visualObj: visObj,
          audioContext: audioContext,
          millisecondsPerMeasure: visObj.millisecondsPerMeasure(),
          options: {
            multiChannel: true,
          },
        }).then(() => {
          // Create synth controller
          const synthControl = new ABCJS.synth.SynthController();
          synthControl.load("#audio-controls", cursorControl, {
            displayLoop: true,
            displayRestart: true,
            displayPlay: true,
            displayProgress: true,
            displayWarp: true,
          });

          synthControl.setTune(visObj, true, {
            voicesOff: false,
            chordsOff: false,
          }).then(() => {
            console.log("Successfully initialized audio");
          }).catch((error: any) => {
            console.error("Error setting tune:", error);
          });
        }).catch((error: any) => {
          console.error("Error initializing synth:", error);
        });
      }
    } catch (error) {
      console.error("Error rendering ABC:", error);
      containerRef.current.innerHTML = '<p class="text-red-500 p-4">Error rendering music notation</p>';
    }
  }, [isLoaded, ABCJS, currentAbcString]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        try {
          synthRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const handleVoiceToggle = (voiceIndex: number) => {
    const updatedVoices = voices.map((v, idx) =>
      idx === voiceIndex ? { ...v, enabled: !v.enabled } : v
    );
    setVoices(updatedVoices);

    // Update ABC string with new MIDI programs
    const updatedAbcString = updateVoiceMidiPrograms(contents.allVoices || "", updatedVoices);
    setCurrentAbcString(updatedAbcString);
  };

  if (!isLoaded) {
    return <div className="p-4 text-muted-foreground">Loading music notation library...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      <div className="space-y-3 border-b pb-4">
        <div id="audio-controls" ref={audioRef} />

        {voices.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2 border-t">
            {voices.map((voice, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={voice.enabled}
                  onChange={() => handleVoiceToggle(idx)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span>{voice.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div id="music-viewer" ref={containerRef} className="music-notation" />
    </div>
  );
}
