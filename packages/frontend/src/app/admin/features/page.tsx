"use client";

import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import type { FeatureFlags } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function SiteFeaturesPage() {
  const { user, loading } = useRequireAuth("admin");
  const [flags, setFlags] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    if (user) {
      api.get("/feature-flags").then(setFlags).catch(() => {});
    }
  }, [user]);

  const toggle = async (key: keyof FeatureFlags) => {
    if (!flags) return;
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    try {
      await api.put("/feature-flags", updated);
      toast.success("Feature flag updated");
    } catch (err) {
      setFlags(flags);
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  };

  if (loading || !user || !flags) return null;

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Site Features</h1>

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Enable or disable site-wide features.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="registration">Registration Active</Label>
            <Switch
              id="registration"
              checked={flags.registrationActive}
              onCheckedChange={() => toggle("registrationActive")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="forgotPassword">Forgot Password Active</Label>
            <Switch
              id="forgotPassword"
              checked={flags.forgotPasswordActive}
              onCheckedChange={() => toggle("forgotPasswordActive")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
