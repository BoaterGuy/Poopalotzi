import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  onUploadComplete?: (url: string) => void;
}

export function ImageUpload({ value, onChange, className, onUploadComplete }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create a preview first
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get upload URL from backend
      const uploadUrlResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadURL } = await uploadUrlResponse.json();

      // Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      // Extract the URL without query parameters
      const uploadedFileUrl = uploadURL.split('?')[0];
      
      setUploadedUrl(uploadedFileUrl);
      onChange(uploadedFileUrl);
      
      if (onUploadComplete) {
        onUploadComplete(uploadedFileUrl);
      }

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setUploadedUrl(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // If value is provided and it's an object storage URL, show it
  const displayImage = preview || (value && value.startsWith('/objects/') ? value : null) || value;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />

      {displayImage ? (
        <div className="relative w-full max-w-xs mt-2">
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-auto object-cover rounded-md border border-border"
            onError={(e) => {
              // If image fails to load, show placeholder
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTUwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjE5cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
          <button
            type="button"
            onClick={clearImage}
            disabled={isUploading}
            className="absolute top-2 right-2 p-1 bg-background rounded-full border border-border hover:bg-muted disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full max-w-xs h-40 border-2 border-dashed border-muted-foreground/30 rounded-md flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-muted/50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading to cloud storage...</span>
            </div>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Click to upload an image
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max size: 5MB
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex mt-4 space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {displayImage ? "Change Image" : "Upload Image"}
        </Button>
        {displayImage && !isUploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearImage}
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}