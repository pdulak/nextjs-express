"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import type { MusicContents, MusicSheet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MusicPlayer } from "@/components/music/music-player";
import Link from "next/link";

export default function ViewMusicPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<MusicSheet | null>(null);
  const [contents, setContents] = useState<MusicContents>({
    allVoices: "",
    voices: [],
  });

  useEffect(() => {
    fetchSheet();
  }, [id]);

  const fetchSheet = async () => {
    try {
      const data: MusicSheet = await api.get(`/music/${id}`);
      setSheet(data);
      const parsedContents: MusicContents = JSON.parse(data.contents);
      setContents(parsedContents);
    } catch (error) {
      console.error("Error fetching music sheet:", error);
      alert(error instanceof Error ? error.message : "Failed to load music sheet");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading music sheet...</p>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Music sheet not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to List
        </Button>
        {user && (
          <Link href={`/music/edit/${sheet.id}`}>
            <Button>Edit</Button>
          </Link>
        )}
      </div>

      <MusicPlayer contents={contents} title={sheet.title} />
    </div>
  );
}
