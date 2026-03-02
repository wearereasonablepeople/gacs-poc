import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

interface ImageUploadProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/uploads", formData, {
        headers: { "Content-Type": undefined },
      });
      onChange(data.url);
    } catch {
      /* upload failed — silently ignore */
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const apiBase = (
    import.meta.env.VITE_API_URL || "http://localhost:4000"
  ).replace(/\/$/, "");

  const fullUrl = value?.startsWith("/api/")
    ? `${apiBase}${value}`
    : value;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.svg"
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-md border overflow-hidden bg-muted">
          <img
            src={fullUrl!}
            alt="Uploaded"
            className="object-contain mx-auto max-h-96"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onChange(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-24 border-dashed"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Upload image</span>
            </div>
          )}
        </Button>
      )}
    </div>
  );
}
