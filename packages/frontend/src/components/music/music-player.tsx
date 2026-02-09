"use client";

import { useEffect, useRef, useState } from "react";
import { useABCJS } from "@/hooks/use-abcjs";
import type { MusicContents } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface MusicPlayerProps {
  contents: MusicContents;
  title: string;
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
  const [followCursor, setFollowCursor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('music-follow-cursor') === 'true';
    }
    return true;
  });
  const [sheetWidth, setSheetWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('music-sheet-width');
      return saved ? parseInt(saved, 10) : 50;
    }
    return 50;
  });

  // Save follow cursor preference
  useEffect(() => {
    localStorage.setItem('music-follow-cursor', String(followCursor));
    if (cursorControlRef.current) {
      cursorControlRef.current.setFollowCursor(followCursor);
    }
  }, [followCursor]);

  // Save sheet width preference
  useEffect(() => {
    localStorage.setItem('music-sheet-width', String(sheetWidth));
  }, [sheetWidth]);

  // Render ABC notation and setup audio
  useEffect(() => {
    if (!isLoaded || !ABCJS || !containerRef.current || !audioRef.current) return;

    const abcString = contents.allVoices;
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

      // Create cursor controller
      const cursorControl = new CursorController("music-viewer");
      cursorControl.setFollowCursor(followCursor);
      cursorControlRef.current = cursorControl;

      // Render the score
      const visObj = ABCJS.renderAbc("music-viewer", abcString, {
        responsive: "resize",
        add_classes: true,
        paddingright: sheetWidth,
        paddingleft: sheetWidth,
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
  }, [isLoaded, ABCJS, contents, sheetWidth, followCursor]);

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

  if (!isLoaded) {
    return <div className="p-4 text-muted-foreground">Loading music notation library...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      <div className="flex gap-6 items-center border-b pb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="follow-cursor"
            checked={followCursor}
            onCheckedChange={setFollowCursor}
          />
          <Label htmlFor="follow-cursor">Follow cursor</Label>
        </div>

        <div className="flex items-center space-x-4 flex-1 max-w-md">
          <Label htmlFor="sheet-width" className="whitespace-nowrap">Sheet width:</Label>
          <Slider
            id="sheet-width"
            min={0}
            max={100}
            step={5}
            value={[sheetWidth]}
            onValueChange={(values) => setSheetWidth(values[0])}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-12">{sheetWidth}%</span>
        </div>
      </div>

      <div id="music-viewer" ref={containerRef} className="music-notation" />

      <div className="border-t pt-4">
        <div id="audio-controls" ref={audioRef} />
      </div>
    </div>
  );
}
