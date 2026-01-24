import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  X, 
  GripVertical, 
  Image as ImageIcon, 
  MapPin,
  Loader2
} from "lucide-react";

export interface SitePhoto {
  id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  caption: string;
  sort_order: number;
  preview_url?: string;
  uploading?: boolean;
}

interface SitePhotosUploaderProps {
  photos: SitePhoto[];
  onChange: (photos: SitePhoto[]) => void;
  maxPhotos?: number;
  maxSizeMb?: number;
}

export function SitePhotosUploader({ 
  photos, 
  onChange, 
  maxPhotos = 6,
  maxSizeMb = 5 
}: SitePhotosUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxPhotos - photos.length;
    
    if (fileArray.length > remainingSlots) {
      toast({
        variant: "destructive",
        title: "Too many files",
        description: `You can only add ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}.`,
      });
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
        });
        return false;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} exceeds ${maxSizeMb}MB limit.`,
        });
        return false;
      }
      return true;
    });

    // Create temporary entries with preview URLs
    const newPhotos: SitePhoto[] = validFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file_path: '',
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      caption: '',
      sort_order: photos.length + index,
      preview_url: URL.createObjectURL(file),
      uploading: true,
    }));

    let currentPhotos = [...photos, ...newPhotos];
    onChange(currentPhotos);

    // Upload files to Supabase Storage
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const tempPhoto = newPhotos[i];
      
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const filePath = `temp/${uniqueId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('estimate-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Update the photo with the actual path
        currentPhotos = currentPhotos.map(p => 
          p.id === tempPhoto.id 
            ? { ...p, file_path: filePath, uploading: false }
            : p
        );
        onChange(currentPhotos);
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: `Failed to upload ${file.name}. Please try again.`,
        });
        // Remove the failed upload
        currentPhotos = currentPhotos.filter(p => p.id !== tempPhoto.id);
        onChange(currentPhotos);
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  }, [photos, maxPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo?.file_path) {
      // Delete from storage
      await supabase.storage
        .from('estimate-attachments')
        .remove([photo.file_path]);
    }
    
    // Revoke preview URL to prevent memory leaks
    if (photo?.preview_url) {
      URL.revokeObjectURL(photo.preview_url);
    }
    
    onChange(photos.filter(p => p.id !== photoId));
  };

  const handleCaptionChange = (photoId: string, caption: string) => {
    onChange(photos.map(p => 
      p.id === photoId ? { ...p, caption } : p
    ));
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPhotos = [...photos];
    const draggedPhoto = newPhotos[draggedIndex];
    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(index, 0, draggedPhoto);
    
    // Update sort_order
    newPhotos.forEach((photo, i) => {
      photo.sort_order = i;
    });
    
    onChange(newPhotos);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getPhotoUrl = (photo: SitePhoto): string => {
    if (photo.preview_url) return photo.preview_url;
    if (photo.file_path) {
      const { data } = supabase.storage
        .from('estimate-attachments')
        .getPublicUrl(photo.file_path);
      return data.publicUrl;
    }
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Site Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        {photos.length < maxPhotos && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop GIS screenshots or site photos here
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse • Max {maxSizeMb}MB per file • {maxPhotos - photos.length} slots remaining
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`
                  relative bg-muted rounded-lg overflow-hidden group
                  ${draggedIndex === index ? 'opacity-50' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(photo.id)}
                >
                  <X className="w-3 h-3" />
                </Button>

                {/* Image Preview */}
                <div className="aspect-[4/3] relative">
                  {photo.uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : photo.preview_url || photo.file_path ? (
                    <img
                      src={getPhotoUrl(photo)}
                      alt={photo.caption || photo.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Caption Input */}
                <div className="p-2">
                  <Input
                    placeholder="Add caption (e.g., 'GIS Aerial View')"
                    value={photo.caption}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    className="text-sm h-8"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Add GIS aerial screenshots, existing court photos, or property overview images to include in your estimate.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
