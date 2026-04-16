"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface B2FileRecord {
  id: number;
  name: string;
  slug: string;
  publicUrl: string;
  notes: string | null;
  createdAt: string;
  downloads: { id: number }[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("sv-SE").slice(0, 16);
}

export default function B2FilesPage() {
  const { user, loading } = useRequireAuth();
  const [files, setFiles] = useState<B2FileRecord[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchFiles = useCallback(async () => {
    setFetching(true);
    try {
      const data = await api.get("/b2files");
      setFiles(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchFiles();
  }, [user, fetchFiles]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/b2files/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("File deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const handleCopyLink = (publicUrl: string) => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  };

  if (loading || !user) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">B2 Files</h1>
        <Button asChild>
          <Link href="/b2files/add">Add File</Link>
        </Button>
      </div>

      {fetching ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No files uploaded yet
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell className="text-muted-foreground">{file.notes || "-"}</TableCell>
                    <TableCell>{file.downloads?.length ?? 0}</TableCell>
                    <TableCell>{formatDate(file.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(file.publicUrl)}
                        >
                          Copy link
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete file?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the record for &quot;{file.name}&quot;. The file
                                will remain in B2 storage.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(file.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
