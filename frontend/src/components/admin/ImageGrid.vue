<script setup lang="ts">
import { ref } from "vue";
import type { GalleryImage } from "@/types/gallery";
import ImageCard from "./ImageCard.vue";

const props = defineProps<{
  images: GalleryImage[];
}>();

const emit = defineEmits<{
  reorder: [newOrder: string[]];
  delete: [imageId: string];
}>();

const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const handleDragStart = (index: number, event: DragEvent): void => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", index.toString());
  }
};

const handleDragOver = (index: number, event: DragEvent): void => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  dragOverIndex.value = index;
};

const handleDragLeave = (): void => {
  dragOverIndex.value = null;
};

const handleDrop = (targetIndex: number): void => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    resetDragState();
    return;
  }

  const newOrder = [...props.images];
  const [removed] = newOrder.splice(draggedIndex.value, 1);
  newOrder.splice(targetIndex, 0, removed);

  emit("reorder", newOrder.map((img) => img.id));
  resetDragState();
};

const handleDragEnd = (): void => {
  resetDragState();
};

const resetDragState = (): void => {
  draggedIndex.value = null;
  dragOverIndex.value = null;
};

const handleDelete = (imageId: string): void => {
  emit("delete", imageId);
};
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
    <div
      v-for="(image, index) in images"
      :key="image.id"
      class="relative aspect-square cursor-move transition-all duration-200"
      :class="[
        draggedIndex === index ? 'opacity-50 scale-95' : '',
        dragOverIndex === index && draggedIndex !== index ? 'ring-2 ring-sage ring-offset-2 dark:ring-offset-dark-bg' : '',
      ]"
      draggable="true"
      @dragstart="handleDragStart(index, $event)"
      @dragover="handleDragOver(index, $event)"
      @dragleave="handleDragLeave"
      @drop="handleDrop(index)"
      @dragend="handleDragEnd"
    >
      <ImageCard :image="image" @delete="handleDelete(image.id)" />
      <div class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs font-body rounded">
        {{ index + 1 }}
      </div>
    </div>
  </div>
</template>
