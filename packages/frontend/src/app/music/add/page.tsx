"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import type { MusicContents } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MusicPreview } from "@/components/music/music-preview";

export default function AddMusicPage() {
  useRequireAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [abcContent, setAbcContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const contents: MusicContents = {
    allVoices: abcContent,
    voices: [],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/music", {
        title,
        contents: JSON.stringify(contents),
      });
      router.push("/");
    } catch (error) {
      console.error("Error creating music sheet:", error);
      alert(error instanceof Error ? error.message : "Failed to create music sheet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left side - Form */}
      <div className="flex-1 border-r overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Add Music Sheet</h1>
            <p className="text-muted-foreground">
              Create a new music sheet using ABC notation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter sheet title"
              required
            />
          </div>

          <div className="space-y-2 flex-1">
            <Label htmlFor="abc-content">ABC Notation</Label>
            <Textarea
              id="abc-content"
              value={abcContent}
              onChange={(e) => setAbcContent(e.target.value)}
              placeholder="Enter ABC notation here..."
              className="font-mono min-h-[400px] resize-none"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Sheet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      {/* Right side - Preview */}
      <div className="flex-1 overflow-y-auto">
        <MusicPreview contents={contents} />
      </div>
    </div>
  );
}
