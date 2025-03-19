
import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Loader2 } from "lucide-react";

interface ImageCropperProps {
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function ImageCropper({ imageFile, onCropComplete, onCancel, isOpen }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load the image when the file changes - fixed from useState to useEffect
  useEffect(() => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImgSrc(reader.result?.toString() || "");
    });
    reader.readAsDataURL(imageFile);
  }, [imageFile]); // Added proper dependency array

  // This function is called when the image is loaded
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Make a centered crop with aspect ratio 1:1
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1, // aspect ratio of 1:1 for profile pic
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(crop);
  }, []);

  // Process the crop and return the cropped image
  const processCrop = async () => {
    try {
      if (!imgRef.current || !crop) return;

      setIsLoading(true);
      
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("No 2d context");
      }
      
      // Set desired output size (max 400x400 for profile pics)
      const maxSize = 400;
      const cropWidth = (crop.width * image.width * scaleX) / 100;
      const cropHeight = (crop.height * image.height * scaleY) / 100;
      
      // Maintain aspect ratio while resizing
      const outputSize = Math.min(maxSize, Math.max(cropWidth, cropHeight));
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      // Draw the cropped image
      ctx.drawImage(
        image,
        (crop.x * image.width * scaleX) / 100,
        (crop.y * image.height * scaleY) / 100,
        cropWidth,
        cropHeight,
        0,
        0,
        outputSize,
        outputSize
      );
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
        setIsLoading(false);
      }, "image/jpeg", 0.9); // 0.9 quality
    } catch (error) {
      console.error("Error cropping image:", error);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-4 overflow-hidden rounded-md">
          {imgSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              circularCrop
              aspect={1}
              className="max-h-[60vh] mx-auto"
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Upload to crop"
                className="max-w-full max-h-[60vh]"
                onLoad={onImageLoad}
              />
            </ReactCrop>
          ) : (
            <div className="flex items-center justify-center h-60 bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={processCrop} 
            disabled={!crop || isLoading}
            className="bg-usc-cardinal hover:bg-usc-cardinal-dark text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
