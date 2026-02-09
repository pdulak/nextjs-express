"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import type { MusicContents, MusicSheet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MusicPreview } from "@/components/music/music-preview";

export default function EditMusicPage() {
  useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [abcContent, setAbcContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSheet();
  }, [id]);

  const fetchSheet = async () => {
    try {
      const sheet: MusicSheet = await api.get(`/music/${id}`);
      setTitle(sheet.title);
      const contents: MusicContents = JSON.parse(sheet.contents);
      setAbcContent(contents.allVoices);
    } catch (error) {
      console.error("Error fetching music sheet:", error);
      alert(error instanceof Error ? error.message : "Failed to load music sheet");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const contents: MusicContents = {
    allVoices: abcContent,
    voices: [],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/music/${id}`, {
        title,
        contents: JSON.stringify(contents),
      });
      router.push("/");
    } catch (error) {
      console.error("Error updating music sheet:", error);
      alert(error instanceof Error ? error.message : "Failed to update music sheet");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this music sheet?")) {
      return;
    }

    try {
      await api.delete(`/music/${id}`);
      router.push("/");
    } catch (error) {
      console.error("Error deleting music sheet:", error);
      alert(error instanceof Error ? error.message : "Failed to delete music sheet");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading music sheet...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left side - Form */}
      <div className="flex-1 border-r overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Music Sheet</h1>
            <p className="text-muted-foreground">
              Update the music sheet using ABC notation
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
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
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
