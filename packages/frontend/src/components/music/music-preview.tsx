"use client";

import { useEffect, useRef, useState } from "react";
import { useABCJS } from "@/hooks/use-abcjs";
import type { MusicContents } from "@/lib/types";

interface MusicPreviewProps {
  contents: MusicContents;
}

export function MusicPreview({ contents }: MusicPreviewProps) {
  const { isLoaded, ABCJS } = useABCJS();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const [debouncedContents, setDebouncedContents] = useState(contents);

  // Debounce contents updates (1000ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContents(contents);
    }, 1000);

    return () => clearTimeout(timer);
  }, [contents]);

  // Render ABC notation
  useEffect(() => {
    if (!isLoaded || !ABCJS || !containerRef.current) return;

    const abcString = debouncedContents.allVoices;
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
  }, [isLoaded, ABCJS, debouncedContents]);

  // Setup audio controls
  useEffect(() => {
    if (!isLoaded || !ABCJS || !audioRef.current || !debouncedContents.allVoices?.trim()) return;

    const abcString = debouncedContents.allVoices;

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

      // Create new synth
      if (window.AudioContext || (window as any).webkitAudioContext) {
        synthRef.current = new ABCJS.synth.CreateSynth();
        synthRef.current.init({
          visualObj: ABCJS.renderAbc("*", abcString, { add_classes: true })[0],
          options: {},
        }).then(() => {
          synthRef.current.prime(() => {
            audioRef.current!.innerHTML = "";
            const audioControl = new ABCJS.synth.SynthController();
            audioControl.load("#audio-controls", null, {
              displayLoop: true,
              displayRestart: true,
              displayPlay: true,
              displayProgress: true,
              displayWarp: true,
            });
            audioControl.setTune(ABCJS.renderAbc("*", abcString)[0], false);
          });
        }).catch((error: any) => {
          console.error("Error initializing audio:", error);
        });

        audioContextRef.current = synthRef.current.audioContext;
      }
    } catch (error) {
      console.error("Error setting up audio:", error);
    }
  }, [isLoaded, ABCJS, debouncedContents]);

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
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 p-4">
        <div ref={containerRef} className="music-notation" />
      </div>
      <div className="border-t p-4">
        <div id="audio-controls" ref={audioRef} />
      </div>
    </div>
  );
}
