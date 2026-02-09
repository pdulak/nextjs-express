"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    ABCJS: any;
  }
}

export function useABCJS() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if (window.ABCJS) {
      setIsLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/lib/abcjs/abcjs-audio.css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "/lib/abcjs/abcjs-basic.js";
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  return { isLoaded, ABCJS: window.ABCJS };
}
