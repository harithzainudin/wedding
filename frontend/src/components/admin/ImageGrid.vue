<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import draggable from 'vuedraggable'
  import type { GalleryImage } from '@/types/gallery'
  import ImageCard from './ImageCard.vue'
  import MoveImageModal from './MoveImageModal.vue'

  const props = defineProps<{
    images: GalleryImage[]
  }>()

  const emit = defineEmits<{
    reorder: [newOrder: string[]]
    delete: [imageId: string]
  }>()

  // Local mutable copy for vuedraggable
  const localImages = computed({
    get: () => [...props.images],
    set: (value: GalleryImage[]) => {
      emit(
        'reorder',
        value.map((img) => img.id)
      )
    },
  })

  // Detect if device supports touch (mobile/tablet)
  const isTouchDevice = ref(false)
  if (typeof window !== 'undefined') {
    isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  // Modal state for mobile repositioning
  const selectedImageIndex = ref<number | null>(null)
  const selectedImage = computed(() =>
    selectedImageIndex.value !== null ? props.images[selectedImageIndex.value] : null
  )

  // Lightbox state
  const lightboxImage = ref<GalleryImage | null>(null)

  // Drag options - only enabled on non-touch devices
  const dragOptions = computed(() => ({
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    // Completely disable drag on touch devices
    disabled: isTouchDevice.value,
  }))

  const handleDelete = (imageId: string): void => {
    emit('delete', imageId)
  }

  // Handle tap on image (for mobile modal)
  const handleImageTap = (index: number): void => {
    // Only show modal on touch devices
    if (isTouchDevice.value) {
      selectedImageIndex.value = index
    }
  }

  // Handle move from modal
  const handleMoveImage = (newPosition: number): void => {
    if (selectedImageIndex.value === null) return

    const currentIndex = selectedImageIndex.value
    const targetIndex = newPosition - 1 // Convert to 0-based index

    if (currentIndex === targetIndex) {
      selectedImageIndex.value = null
      return
    }

    // Create new order
    const newOrder = [...props.images]
    const movedImage = newOrder.splice(currentIndex, 1)[0]
    if (movedImage) {
      newOrder.splice(targetIndex, 0, movedImage)
      emit(
        'reorder',
        newOrder.map((img) => img.id)
      )
    }
    selectedImageIndex.value = null
  }

  const handleModalCancel = (): void => {
    selectedImageIndex.value = null
  }

  // Lightbox handlers
  const handleViewLightbox = (image: GalleryImage): void => {
    selectedImageIndex.value = null // Close move modal
    lightboxImage.value = image
    document.body.style.overflow = 'hidden'
  }

  // Direct view from ImageCard (desktop)
  const handleViewImage = (image: GalleryImage): void => {
    lightboxImage.value = image
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = (): void => {
    lightboxImage.value = null
    document.body.style.overflow = ''
  }

  // Keyboard handler for lightbox
  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && lightboxImage.value) {
      closeLightbox()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<template>
  <div>
    <!-- Instructions -->
    <p
      v-if="isTouchDevice"
      class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3"
    >
      Tap an image to move or view it.
    </p>
    <p v-else class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-3">
      Drag images to reorder them.
    </p>

    <draggable
      v-model="localImages"
      item-key="id"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3"
      v-bind="dragOptions"
    >
      <template #item="{ element, index }">
        <div
          class="relative aspect-square transition-transform duration-200"
          :class="isTouchDevice ? 'cursor-pointer' : 'cursor-grab'"
          @click="handleImageTap(index)"
        >
          <ImageCard
            :image="element"
            @delete="handleDelete(element.id)"
            @view="handleViewImage(element)"
          />
          <!-- Order badge -->
          <div
            class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-xs font-body rounded select-none pointer-events-none z-10"
          >
            {{ index + 1 }}
          </div>
        </div>
      </template>
    </draggable>

    <!-- Move Image Modal -->
    <MoveImageModal
      v-if="selectedImage && selectedImageIndex !== null"
      :image="selectedImage"
      :current-position="selectedImageIndex + 1"
      :total-images="images.length"
      @move="handleMoveImage"
      @cancel="handleModalCancel"
      @view-lightbox="handleViewLightbox"
    />

    <!-- Lightbox -->
    <Transition name="lightbox">
      <div
        v-if="lightboxImage"
        class="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center"
        @click="closeLightbox"
      >
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-4 right-4 p-2 bg-black/50 text-white/90 hover:text-white hover:bg-black/70 rounded-full transition-colors cursor-pointer z-10"
          @click="closeLightbox"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Image with shadow for depth -->
        <img
          :src="lightboxImage.url"
          :alt="lightboxImage.filename"
          class="max-w-[95%] max-h-[90%] object-contain rounded-lg shadow-2xl lightbox-image"
          @click.stop
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  /* Lightbox transitions */
  .lightbox-enter-active,
  .lightbox-leave-active {
    transition: opacity 0.25s ease;
  }

  .lightbox-enter-active .lightbox-image,
  .lightbox-leave-active .lightbox-image {
    transition:
      transform 0.25s ease,
      opacity 0.25s ease;
  }

  .lightbox-enter-from,
  .lightbox-leave-to {
    opacity: 0;
  }

  .lightbox-enter-from .lightbox-image {
    transform: scale(0.9);
    opacity: 0;
  }

  .lightbox-leave-to .lightbox-image {
    transform: scale(0.9);
    opacity: 0;
  }

  /* Ghost - the placeholder left behind */
  :deep(.sortable-ghost) {
    opacity: 0.4;
    border-radius: 0.5rem;
    outline: 2px dashed rgb(124 131 99 / 0.6);
    outline-offset: -2px;
  }

  /* Chosen - selected but not yet moved */
  :deep(.sortable-chosen) {
    border-radius: 0.5rem;
    opacity: 0.9;
  }

  /* Drag - actively being dragged */
  :deep(.sortable-drag) {
    border-radius: 0.5rem;
    z-index: 9999;
    opacity: 0.95;
    will-change: transform;
  }
</style>
