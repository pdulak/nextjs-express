"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    ABCJS: any;
  }
}

const ABCJS_CSS_ID = "abcjs-audio-css";
const ABCJS_SCRIPT_ID = "abcjs-script";

export function useABCJS() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if CSS exists in document
    let cssLink = document.getElementById(ABCJS_CSS_ID) as HTMLLinkElement;
    if (!cssLink) {
      // Load CSS with ID for reusability
      cssLink = document.createElement("link");
      cssLink.id = ABCJS_CSS_ID;
      cssLink.rel = "stylesheet";
      cssLink.href = "/lib/abcjs/abcjs-audio.css";
      document.head.appendChild(cssLink);
    }

    // Check if script exists in document
    let script = document.getElementById(ABCJS_SCRIPT_ID) as HTMLScriptElement;
    if (!script) {
      // Load JS with ID for reusability
      script = document.createElement("script");
      script.id = ABCJS_SCRIPT_ID;
      script.src = "/lib/abcjs/abcjs-basic.js";
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.ABCJS) {
      // Script and library already loaded
      setIsLoaded(true);
    }

    // No cleanup - CSS and script should persist across page navigations
  }, []);

  return { isLoaded, ABCJS: window.ABCJS };
}
