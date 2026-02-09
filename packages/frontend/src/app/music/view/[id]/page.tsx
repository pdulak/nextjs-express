"use client";

import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useMusicSheet } from "@/hooks/use-music-sheet";
import { Button } from "@/components/ui/button";
import { MusicPlayer } from "@/components/music/music-player";
import Link from "next/link";

export default function ViewMusicPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { sheet, contents, loading } = useMusicSheet(id);

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
