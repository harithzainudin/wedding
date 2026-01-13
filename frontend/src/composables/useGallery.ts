import { ref, computed } from "vue";
import type { GalleryImage, GallerySettings } from "@/types/gallery";
import {
  listGalleryImages,
  getPresignedUrl,
  uploadToS3,
  confirmImageUpload,
  deleteGalleryImage,
  reorderGalleryImages,
  updateGallerySettings,
} from "@/services/api";

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Singleton state
const images = ref<GalleryImage[]>([]);
const settings = ref<GallerySettings>({
  maxFileSize: 10 * 1024 * 1024, // 10MB default
  maxImages: 50,
  allowedFormats: ALLOWED_MIME_TYPES,
});
const isLoading = ref(false);
const loadError = ref("");
const uploadProgress = ref<Map<string, number>>(new Map());

export function useGallery() {
  // Computed
  const sortedImages = computed(() => [...images.value].sort((a, b) => a.order - b.order));

  const canUploadMore = computed(() => images.value.length < settings.value.maxImages);

  const remainingSlots = computed(() => settings.value.maxImages - images.value.length);

  // Validate a file before upload
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: JPG, PNG, WebP, GIF`,
      };
    }

    // Check file size
    if (file.size > settings.value.maxFileSize) {
      const maxMB = Math.round(settings.value.maxFileSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds maximum of ${maxMB}MB`,
      };
    }

    // Check if we can upload more
    if (!canUploadMore.value) {
      return {
        valid: false,
        error: `Maximum of ${settings.value.maxImages} images reached`,
      };
    }

    return { valid: true };
  };

  // Fetch all images
  const fetchImages = async (): Promise<void> => {
    isLoading.value = true;
    loadError.value = "";

    try {
      const response = await listGalleryImages();
      if (response.success && response.data) {
        images.value = response.data.images;
        settings.value = response.data.settings;
      } else {
        loadError.value = response.error ?? "Failed to load images";
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : "Failed to load images";
    } finally {
      isLoading.value = false;
    }
  };

  // Upload a single image
  const uploadImage = async (file: File): Promise<{ success: boolean; error?: string }> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const fileId = `${file.name}-${Date.now()}`;
    uploadProgress.value.set(fileId, 0);

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await getPresignedUrl({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      if (!presignedResponse.success || !presignedResponse.data) {
        uploadProgress.value.delete(fileId);
        return { success: false, error: presignedResponse.error ?? "Failed to get upload URL" };
      }

      uploadProgress.value.set(fileId, 30);

      // Step 2: Upload to S3
      const uploadSuccess = await uploadToS3(presignedResponse.data.uploadUrl, file);
      if (!uploadSuccess) {
        uploadProgress.value.delete(fileId);
        return { success: false, error: "Failed to upload file to storage" };
      }

      uploadProgress.value.set(fileId, 70);

      // Step 3: Confirm upload
      const confirmResponse = await confirmImageUpload({
        imageId: presignedResponse.data.imageId,
        s3Key: presignedResponse.data.s3Key,
        filename: file.name,
        mimeType: file.type,
      });

      if (!confirmResponse.success || !confirmResponse.data) {
        uploadProgress.value.delete(fileId);
        return { success: false, error: confirmResponse.error ?? "Failed to confirm upload" };
      }

      uploadProgress.value.set(fileId, 100);

      // Add the new image to the list
      images.value.push(confirmResponse.data);

      // Clean up progress after a delay
      setTimeout(() => {
        uploadProgress.value.delete(fileId);
      }, 1000);

      return { success: true };
    } catch (err) {
      uploadProgress.value.delete(fileId);
      return { success: false, error: err instanceof Error ? err.message : "Upload failed" };
    }
  };

  // Remove an image
  const removeImage = async (imageId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await deleteGalleryImage(imageId);
      if (response.success) {
        images.value = images.value.filter((img) => img.id !== imageId);
        return { success: true };
      }
      return { success: false, error: response.error ?? "Failed to delete image" };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to delete image" };
    }
  };

  // Update image order
  const updateOrder = async (newOrder: string[]): Promise<{ success: boolean; error?: string }> => {
    // Optimistically update the UI
    const previousImages = [...images.value];
    images.value = newOrder
      .map((id, index) => {
        const img = images.value.find((i) => i.id === id);
        return img ? { ...img, order: index + 1 } : null;
      })
      .filter((img): img is GalleryImage => img !== null);

    try {
      const response = await reorderGalleryImages({ imageIds: newOrder });
      if (!response.success) {
        // Revert on failure
        images.value = previousImages;
        return { success: false, error: response.error ?? "Failed to reorder images" };
      }
      return { success: true };
    } catch (err) {
      // Revert on error
      images.value = previousImages;
      return { success: false, error: err instanceof Error ? err.message : "Failed to reorder images" };
    }
  };

  // Update settings
  const updateSettings = async (
    newSettings: { maxFileSize?: number; maxImages?: number }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await updateGallerySettings(newSettings);
      if (response.success && response.data) {
        settings.value = response.data;
        return { success: true };
      }
      return { success: false, error: response.error ?? "Failed to update settings" };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to update settings" };
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    images: sortedImages,
    settings,
    isLoading,
    loadError,
    uploadProgress,
    canUploadMore,
    remainingSlots,
    fetchImages,
    uploadImage,
    removeImage,
    updateOrder,
    updateSettings,
    validateFile,
    formatFileSize,
  };
}
