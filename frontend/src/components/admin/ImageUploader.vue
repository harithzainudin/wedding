<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  maxFileSize: number;
  allowedFormats: string[];
  formatFileSize: (bytes: number) => string;
}>();

const emit = defineEmits<{
  filesSelected: [files: File[]];
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const formatLabels: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
};

const allowedFormatsLabel = props.allowedFormats
  .map((format) => formatLabels[format] ?? format)
  .join(", ");

const handleDragOver = (event: DragEvent): void => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (): void => {
  isDragging.value = false;
};

const handleDrop = (event: DragEvent): void => {
  event.preventDefault();
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    processFiles(files);
  }
};

const handleFileInputChange = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    processFiles(input.files);
    // Reset input so the same file can be selected again
    input.value = "";
  }
};

const processFiles = (fileList: FileList): void => {
  const files = Array.from(fileList).filter((file) =>
    props.allowedFormats.includes(file.type),
  );
  if (files.length > 0) {
    emit("filesSelected", files);
  }
};

const openFilePicker = (): void => {
  fileInput.value?.click();
};
</script>

<template>
  <div
    class="relative p-4 sm:p-8 border-2 border-dashed rounded-xl transition-colors"
    :class="
      isDragging
        ? 'border-sage bg-sage/5 dark:bg-sage/10'
        : 'border-sand-dark dark:border-dark-border hover:border-sage'
    "
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="allowedFormats.join(',')"
      multiple
      class="hidden"
      @change="handleFileInputChange"
    />

    <div
      class="text-center cursor-pointer py-4 sm:py-8"
      @click="openFilePicker"
    >
      <svg
        class="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-charcoal-light dark:text-dark-text-secondary mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p
        class="font-body text-sm sm:text-base text-charcoal dark:text-dark-text mb-2"
      >
        Drag & drop images here or click to browse
      </p>
      <p
        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
      >
        {{ allowedFormatsLabel }} up to {{ formatFileSize(maxFileSize) }}
      </p>
    </div>
  </div>
</template>
