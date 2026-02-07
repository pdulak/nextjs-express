"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid activation link");
      return;
    }

    api
      .post("/auth/activate", { token })
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Activation failed");
      });
  }, [token]);

  return (
    <div className="flex justify-center py-20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Activation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === "loading" && <p>Activating your account...</p>}
          {status === "success" && (
            <>
              <p className="text-sm text-green-600">{message}</p>
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-sm text-destructive">{message}</p>
              <Button variant="outline" asChild>
                <Link href="/login">Back to Login</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
