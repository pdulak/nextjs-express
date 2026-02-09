import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface MusicFormProps {
  title: string;
  abcContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  submitting: boolean;
  mode: "add" | "edit";
  successMessage?: string;
  deleteDialogOpen?: boolean;
  onDeleteDialogChange?: (open: boolean) => void;
}

export function MusicForm({
  title,
  abcContent,
  onTitleChange,
  onContentChange,
  onSubmit,
  onCancel,
  onDelete,
  submitting,
  mode,
  successMessage,
  deleteDialogOpen,
  onDeleteDialogChange,
}: MusicFormProps) {
  const isEditMode = mode === "edit";

  return (
    <form onSubmit={onSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {isEditMode ? "Edit Music Sheet" : "Add Music Sheet"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? "Update the music sheet using ABC notation"
              : "Create a new music sheet using ABC notation"
            }
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/20 border border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter sheet title"
            required
          />
        </div>

        <div className="space-y-2 flex-1">
          <Label htmlFor="abc-content">ABC Notation</Label>
          <Textarea
            id="abc-content"
            value={abcContent}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Enter ABC notation here..."
            className="font-mono min-h-[400px] resize-none"
            required
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t pt-4 mt-6 flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? (isEditMode ? "Saving..." : "Creating...")
            : (isEditMode ? "Save Changes" : "Create Sheet")
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Back to the list
        </Button>
        {isEditMode && onDelete && (
          <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogChange}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent position="bottom-left">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Music Sheet</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this music sheet? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  );
}
