import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle, Clock, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PumpOutImageUploadProps {
  pumpOutRequestId: number;
  onComplete?: () => void;
}

export function PumpOutImageUpload({ pumpOutRequestId, onComplete }: PumpOutImageUploadProps) {
  const [beforeImage, setBeforeImage] = useState<string>("");
  const [duringImage, setDuringImage] = useState<string>("");
  const [afterImage, setAfterImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!beforeImage && !duringImage && !afterImage) {
      toast({
        title: "No images",
        description: "Please upload at least one documentation image",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const images: any = {};
      
      // Only include images that were uploaded
      if (beforeImage && beforeImage.startsWith('https://storage.googleapis.com')) {
        images.beforeImageURL = beforeImage;
      }
      if (duringImage && duringImage.startsWith('https://storage.googleapis.com')) {
        images.duringImageURL = duringImage;
      }
      if (afterImage && afterImage.startsWith('https://storage.googleapis.com')) {
        images.afterImageURL = afterImage;
      }

      // Update pump-out request with image documentation
      await apiRequest(`/api/pump-out/${pumpOutRequestId}/images`, {
        method: 'PUT',
        body: JSON.stringify(images),
        headers: { 'Content-Type': 'application/json' }
      });

      toast({
        title: "Documentation saved",
        description: "Service documentation images have been uploaded successfully"
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving documentation:', error);
      toast({
        title: "Upload failed",
        description: "Failed to save documentation images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Service Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Before Service Image */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-yellow-600" />
              Before Service
            </div>
            <ImageUpload
              value={beforeImage}
              onChange={setBeforeImage}
              className="w-full"
            />
          </div>

          {/* During Service Image */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-blue-600" />
              During Service
            </div>
            <ImageUpload
              value={duringImage}
              onChange={setDuringImage}
              className="w-full"
            />
          </div>

          {/* After Service Image */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle className="h-4 w-4 text-green-600" />
              After Service
            </div>
            <ImageUpload
              value={afterImage}
              onChange={setAfterImage}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!beforeImage && !duringImage && !afterImage)}
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Documentation
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}