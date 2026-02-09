"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import type { MusicContents } from "@/lib/types";
import { MusicPreview } from "@/components/music/music-preview";
import { MusicEditorLayout } from "@/components/music/music-editor-layout";
import { MusicForm } from "@/components/music/music-form";
import { handleMusicError } from "@/lib/music-utils";

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
      handleMusicError(error, "Failed to create music sheet");
    } finally {
      setSubmitting(false);
    }
  };

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
          submitting={submitting}
          mode="add"
        />
      }
      preview={<MusicPreview contents={contents} />}
    />
  );
}
