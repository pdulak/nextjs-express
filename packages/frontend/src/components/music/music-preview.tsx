"use client";

import { useEffect, useRef, useState } from "react";
import { useABCJS } from "@/hooks/use-abcjs";
import type { MusicContents } from "@/lib/types";

interface MusicPreviewProps {
  contents: MusicContents;
}

interface Voice {
  lineIndex: number;
  midiLineIndex: number;
  name: string;
  program: number;
  originalProgram: number;
  enabled: boolean;
}

// Cursor Controller class
class CursorControl {
  elementId: string;
  cursor: SVGLineElement | null = null;

  constructor(elementId: string) {
    this.elementId = elementId;
  }

  onStart() {
    const svg = document.querySelector(`#${this.elementId} svg`);
    if (!svg) return;

    // Remove existing cursor if any
    const oldCursor = svg.querySelector("line.abcjs-cursor");
    if (oldCursor) oldCursor.remove();

    // Create new cursor
    this.cursor = document.createElementNS("http://www.w3.org/2000/svg", "line");
    this.cursor.setAttribute("class", "abcjs-cursor");
    this.cursor.style.stroke = "red";
    this.cursor.style.strokeWidth = "2px";
    this.cursor.setAttributeNS(null, "x1", "0");
    this.cursor.setAttributeNS(null, "y1", "0");
    this.cursor.setAttributeNS(null, "x2", "0");
    this.cursor.setAttributeNS(null, "y2", "0");
    svg.appendChild(this.cursor);
  }

  onEvent(ev: any) {
    if (this.cursor) {
      this.cursor.setAttributeNS(null, "x1", String(ev.left - 2));
      this.cursor.setAttributeNS(null, "x2", String(ev.left - 2));
      this.cursor.setAttributeNS(null, "y1", String(ev.top));
      this.cursor.setAttributeNS(null, "y2", String(ev.top + ev.height));
    }
  }

  onFinished() {
    if (this.cursor) {
      this.cursor.setAttributeNS(null, "x1", "0");
      this.cursor.setAttributeNS(null, "x2", "0");
      this.cursor.setAttributeNS(null, "y1", "0");
      this.cursor.setAttributeNS(null, "y2", "0");
    }
  }
}

export function MusicPreview({ contents }: MusicPreviewProps) {
  const { isLoaded, ABCJS } = useABCJS();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const cursorControlRef = useRef<CursorControl | null>(null);
  const [debouncedContents, setDebouncedContents] = useState(contents);
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

  // Debounce contents updates (1000ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContents(contents);
    }, 1000);

    return () => clearTimeout(timer);
  }, [contents]);

  // Parse voices when ABC content changes
  useEffect(() => {
    const abcString = debouncedContents.allVoices || "";
    setCurrentAbcString(abcString);
    const parsedVoices = parseVoiceDefinitions(abcString);
    setVoices(parsedVoices);
  }, [debouncedContents]);

  // Render ABC notation
  useEffect(() => {
    if (!isLoaded || !ABCJS || !containerRef.current) return;

    const abcString = currentAbcString;
    if (!abcString || !abcString.trim()) {
      containerRef.current.innerHTML = "";
      return;
    }

    try {
      ABCJS.renderAbc(containerRef.current, abcString, {
        responsive: "resize",
        add_classes: true,
      });
    } catch (error) {
      console.error("Error rendering ABC:", error);
      containerRef.current.innerHTML = '<p class="text-red-500 p-4">Error rendering music notation</p>';
    }
  }, [isLoaded, ABCJS, currentAbcString]);

  // Setup audio controls
  useEffect(() => {
    if (!isLoaded || !ABCJS || !audioRef.current || !containerRef.current || !currentAbcString?.trim()) return;

    const abcString = currentAbcString;

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

      // Clear and setup audio controls
      audioRef.current.innerHTML = "";

      // Create cursor control
      const cursorControl = new CursorControl("music-notation-container");
      cursorControlRef.current = cursorControl;

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create SynthController and load controls with cursor
      const audioControl = new ABCJS.synth.SynthController();
      audioControl.load("#audio-controls", cursorControl, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true,
      });

      // Render ABC and get visualObj
      const visualObj = ABCJS.renderAbc("*", abcString, { add_classes: true })[0];

      // Create and initialize synth
      const createSynth = new ABCJS.synth.CreateSynth();
      createSynth.init({
        visualObj: visualObj,
        audioContext: audioContext,
        millisecondsPerMeasure: visualObj.millisecondsPerMeasure(),
        options: {
          multiChannel: true
        }
      }).then(() => {
        audioControl.setTune(visualObj, true, {
          voicesOff: false,
          chordsOff: false
        }).catch((error: any) => {
          console.error("Error setting tune:", error);
        });
      }).catch((error: any) => {
        console.error("Error initializing synth:", error);
      });

      // Store for cleanup
      synthRef.current = audioControl;
    } catch (error) {
      console.error("Error setting up audio:", error);
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
    const updatedAbcString = updateVoiceMidiPrograms(debouncedContents.allVoices || "", updatedVoices);
    setCurrentAbcString(updatedAbcString);
  };

  if (!isLoaded) {
    return <div className="p-4 text-muted-foreground">Loading music notation library...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-2">
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
      <div className="flex-1 p-4">
        <div id="music-notation-container" ref={containerRef} className="music-notation pr-4" />
      </div>
    </div>
  );
}
