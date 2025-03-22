
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";

interface AvatarActionsProps {
  avatarUrl: string | null;
  avatarFile: File | null;
  uploadingAvatar: boolean;
  isSubmitting: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => Promise<void>;
}

export const AvatarActions = ({
  avatarUrl,
  avatarFile,
  uploadingAvatar,
  isSubmitting,
  onFileChange,
  onRemove
}: AvatarActionsProps) => {
  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="relative">
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        
        <Button
          asChild
          variant="outline"
          className="w-full"
          disabled={uploadingAvatar || isSubmitting}
        >
          <label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center">
            <Upload className="mr-2 h-4 w-4" />
            {avatarFile ? "Change Image" : "Upload Image"}
          </label>
        </Button>
      </div>
      
      {avatarUrl && (
        <Button
          variant="outline"
          className="text-red-500 hover:text-red-600"
          onClick={onRemove}
          disabled={uploadingAvatar || isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          Remove Photo
        </Button>
      )}
    </div>
  );
};
