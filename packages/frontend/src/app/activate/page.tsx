"use client";

import { Suspense } from "react";
import ActivateContent from "./activate-content";

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><p>Loading...</p></div>}>
      <ActivateContent />
    </Suspense>
  );
}
