import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { MusicContents, MusicSheet } from "@/lib/types";

interface UseMusicSheetResult {
  sheet: MusicSheet | null;
  contents: MusicContents;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMusicSheet(id: string): UseMusicSheetResult {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<MusicSheet | null>(null);
  const [contents, setContents] = useState<MusicContents>({
    allVoices: "",
    voices: [],
  });
  const [error, setError] = useState<Error | null>(null);

  const fetchSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: MusicSheet = await api.get(`/music/${id}`);
      setSheet(data);
      const parsedContents: MusicContents = JSON.parse(data.contents);
      setContents(parsedContents);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load music sheet");
      setError(error);
      console.error("Error fetching music sheet:", error);
      alert(error.message);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheet();
  }, [id]);

  return {
    sheet,
    contents,
    loading,
    error,
    refetch: fetchSheet,
  };
}
