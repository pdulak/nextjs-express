interface MusicEditorLayoutProps {
  form: React.ReactNode;
  preview: React.ReactNode;
}

export function MusicEditorLayout({ form, preview }: MusicEditorLayoutProps) {
  return (
    <div className="fixed inset-0 top-14 flex">
      {/* Left side - Form (50% viewport width) */}
      <div className="w-1/2 border-r overflow-y-auto p-3">
        {form}
      </div>

      {/* Right side - Preview (50% viewport width) */}
      <div className="w-1/2 overflow-y-auto p-3">
        {preview}
      </div>
    </div>
  );
}
