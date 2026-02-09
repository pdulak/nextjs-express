"use client";

import { useState, useEffect } from "react";
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
  const [successMessage, setSuccessMessage] = useState("");

  const contents: MusicContents = {
    allVoices: abcContent,
    voices: [],
  };

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");

    try {
      await api.post("/music", {
        title,
        contents: JSON.stringify(contents),
      });
      setSuccessMessage("✓ Music sheet created successfully!");
      // Clear form for next entry
      setTitle("");
      setAbcContent("");
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
          successMessage={successMessage}
        />
      }
      preview={<MusicPreview contents={contents} />}
    />
  );
}
