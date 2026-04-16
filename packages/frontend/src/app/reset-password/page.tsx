"use client";

import { Suspense } from "react";
import ResetPasswordContent from "./reset-password-content";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><p>Loading...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
