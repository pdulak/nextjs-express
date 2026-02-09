"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useMusicSheet } from "@/hooks/use-music-sheet";
import { api } from "@/lib/api";
import type { MusicContents } from "@/lib/types";
import { MusicPreview } from "@/components/music/music-preview";
import { MusicEditorLayout } from "@/components/music/music-editor-layout";
import { MusicForm } from "@/components/music/music-form";
import { handleMusicError } from "@/lib/music-utils";

export default function EditMusicPage() {
  useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { sheet, contents: initialContents, loading } = useMusicSheet(id);
  const [title, setTitle] = useState("");
  const [abcContent, setAbcContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync form state when sheet data loads
  useEffect(() => {
    if (sheet) {
      setTitle(sheet.title);
      setAbcContent(initialContents.allVoices);
    }
  }, [sheet, initialContents]);

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
      handleMusicError(error, "Failed to update music sheet");
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
      handleMusicError(error, "Failed to delete music sheet");
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
    <MusicEditorLayout
      form={
        <MusicForm
          title={title}
          abcContent={abcContent}
          onTitleChange={setTitle}
          onContentChange={setAbcContent}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/")}
          onDelete={handleDelete}
          submitting={submitting}
          mode="edit"
        />
      }
      preview={<MusicPreview contents={contents} />}
    />
  );
}
