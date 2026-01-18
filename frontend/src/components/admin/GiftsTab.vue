<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
  import { useGifts } from '@/composables/useGifts'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { interpolate } from '@/i18n/translations'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import type { GiftItem, GiftCategory, GiftPriority } from '@/types/gift'
  import DeleteConfirmModal from './DeleteConfirmModal.vue'
  import UploadProgressBar from './UploadProgressBar.vue'
  import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()

  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const {
    gifts,
    settings,
    reservations,
    reservationSummary,
    isLoading,
    isLoadingReservations,
    loadError,
    operationError,
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingEnabled,
    activeUploads,
    canAddMore,
    summary,
    fetchGiftsAdmin,
    fetchReservations,
    createGiftItem,
    updateGiftItem,
    deleteGiftItem,
    reorderGiftItems,
    uploadGiftImage,
    cancelUpload,
    updateSettings,
    toggleEnabled,
  } = useGifts()

  // View mode
  const viewMode = ref<'gifts' | 'reservations'>('gifts')

  // Modal states
  const showSettings = ref(false)
  const showGiftForm = ref(false)
  const editingGift = ref<GiftItem | null>(null)
  const deleteConfirmId = ref<string | null>(null)

  // Form data
  const formData = ref({
    nameEn: '',
    nameMs: '',
    descriptionEn: '',
    descriptionMs: '',
    externalLink: '',
    priceRange: '',
    category: 'other' as GiftCategory,
    priority: 'medium' as GiftPriority,
    notes: '',
    quantityTotal: 1,
  })

  // Image upload
  const imageFile = ref<File | null>(null)
  const imagePreview = ref<string | null>(null)

  // Drag state for reordering
  const draggedId = ref<string | null>(null)
  const dropTargetId = ref<string | null>(null)

  // Computed
  const isFormValid = computed(() => {
    return (
      formData.value.nameEn.trim() &&
      formData.value.nameMs.trim() &&
      formData.value.descriptionEn.trim() &&
      formData.value.descriptionMs.trim() &&
      formData.value.priceRange.trim()
    )
  })

  onMounted(async () => {
    // fetchGiftsAdmin also loads settings from the admin response
    await fetchGiftsAdmin(weddingId.value ?? undefined)
  })

  // Modal handlers
  const openCreateModal = () => {
    editingGift.value = null
    formData.value = {
      nameEn: '',
      nameMs: '',
      descriptionEn: '',
      descriptionMs: '',
      externalLink: '',
      priceRange: '',
      category: 'other',
      priority: 'medium',
      notes: '',
      quantityTotal: 1,
    }
    imageFile.value = null
    imagePreview.value = null
    showGiftForm.value = true
  }

  const openEditModal = (gift: GiftItem) => {
    editingGift.value = gift
    formData.value = {
      nameEn: gift.name.en || '',
      nameMs: gift.name.ms || '',
      descriptionEn: gift.description.en || '',
      descriptionMs: gift.description.ms || '',
      externalLink: gift.externalLink || '',
      priceRange: gift.priceRange || '',
      category: gift.category,
      priority: gift.priority,
      notes: gift.notes || '',
      quantityTotal: gift.quantityTotal,
    }
    imageFile.value = null
    imagePreview.value = gift.imageUrl || null
    showGiftForm.value = true
  }

  const closeGiftForm = () => {
    showGiftForm.value = false
    editingGift.value = null
    imageFile.value = null
    imagePreview.value = null
  }

  // Handle image selection
  const handleImageSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      imageFile.value = file
      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreview.value = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit form
  const handleSubmit = async () => {
    if (!isFormValid.value) return

    const data = {
      name: {
        en: formData.value.nameEn,
        ms: formData.value.nameMs,
        zh: '',
        ta: '',
      },
      description: {
        en: formData.value.descriptionEn,
        ms: formData.value.descriptionMs,
        zh: '',
        ta: '',
      },
      externalLink: formData.value.externalLink || '',
      priceRange: formData.value.priceRange,
      category: formData.value.category,
      priority: formData.value.priority,
      quantityTotal: formData.value.quantityTotal,
      ...(formData.value.notes ? { notes: formData.value.notes } : {}),
    }

    const currentEditingGift = editingGift.value
    const currentImageFile = imageFile.value
    closeGiftForm()

    await withLoading(
      async () => {
        if (currentEditingGift) {
          const result = await updateGiftItem(
            currentEditingGift.id,
            data,
            weddingId.value ?? undefined
          )
          if (result.success && currentImageFile) {
            await uploadGiftImage(
              currentEditingGift.id,
              currentImageFile,
              weddingId.value ?? undefined
            )
          }
        } else {
          const result = await createGiftItem(data, weddingId.value ?? undefined)
          if (result.success && result.giftId && currentImageFile) {
            await uploadGiftImage(result.giftId, currentImageFile, weddingId.value ?? undefined)
          }
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Delete handlers
  const handleDeleteClick = (giftId: string) => {
    deleteConfirmId.value = giftId
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId.value) return
    const giftIdToDelete = deleteConfirmId.value
    deleteConfirmId.value = null

    await withLoading(
      async () => {
        await deleteGiftItem(giftIdToDelete, weddingId.value ?? undefined)
      },
      {
        message: adminT.value.loadingOverlay.deleting,
        showSuccess: true,
      }
    )
  }

  const handleDeleteCancel = () => {
    deleteConfirmId.value = null
  }

  // Drag and drop handlers
  const handleDragStart = (giftId: string) => {
    draggedId.value = giftId
  }

  const handleDragOver = (event: DragEvent, giftId: string) => {
    event.preventDefault()
    dropTargetId.value = giftId
  }

  const handleDragEnd = async () => {
    if (draggedId.value && dropTargetId.value && draggedId.value !== dropTargetId.value) {
      const currentOrder = gifts.value.map((g) => g.id)
      const draggedIndex = currentOrder.indexOf(draggedId.value)
      const targetIndex = currentOrder.indexOf(dropTargetId.value)

      currentOrder.splice(draggedIndex, 1)
      currentOrder.splice(targetIndex, 0, draggedId.value)

      await reorderGiftItems(currentOrder, weddingId.value ?? undefined)
    }

    draggedId.value = null
    dropTargetId.value = null
  }

  // Settings handlers
  const handleToggleEnabled = async () => {
    await withLoading(
      async () => {
        await toggleEnabled(weddingId.value ?? undefined)
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  const handleSettingsUpdate = async (newSettings: Partial<typeof settings.value>) => {
    await withLoading(
      async () => {
        await updateSettings(newSettings, weddingId.value ?? undefined)
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // View reservations
  const handleViewReservations = async () => {
    viewMode.value = 'reservations'
    await fetchReservations(undefined, weddingId.value ?? undefined)
  }

  // Get gift name by ID for reservations
  const getGiftName = (giftId: string): string => {
    const gift = gifts.value.find((g) => g.id === giftId)
    return gift ? gift.name.en || gift.name.ms || 'Unknown' : 'Unknown'
  }

  // Get category label
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      home: adminT.value.gifts.categoryHome,
      kitchen: adminT.value.gifts.categoryKitchen,
      electronics: adminT.value.gifts.categoryElectronics,
      experiences: adminT.value.gifts.categoryExperiences,
      other: adminT.value.gifts.categoryOther,
    }
    return labels[category] || category
  }

  // Get priority badge color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getGiftToDelete = (): GiftItem | undefined => {
    return gifts.value.find((g) => g.id === deleteConfirmId.value)
  }

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Handle Escape key
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSettings.value) showSettings.value = false
      if (showGiftForm.value) closeGiftForm()
    }
  }

  // Reset body overflow after modal leave animation completes
  // Only reset if no modals are open
  const onModalClosed = (): void => {
    if (!showSettings.value && !showGiftForm.value) {
      document.body.style.overflow = ''
    }
  }

  watch([showSettings, showGiftForm], ([settingsOpen, formOpen]) => {
    if (settingsOpen || formOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleEscapeKey)
      // Note: body overflow is reset in onModalClosed (via @after-leave)
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscapeKey)
    document.body.style.overflow = ''
  })
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
          {{ adminT.gifts.title }}
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          {{ interpolate(adminT.gifts.itemsCount, { count: String(summary.total) }) }} |
          {{
            interpolate(adminT.gifts.reserved, {
              reserved: String(summary.reservedQuantity),
              total: String(summary.totalQuantity),
            })
          }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Toggle View -->
        <div
          class="flex rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border"
        >
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-body transition-colors cursor-pointer"
            :class="
              viewMode === 'gifts'
                ? 'bg-sage text-white'
                : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg'
            "
            @click="viewMode = 'gifts'"
          >
            {{ adminT.gifts.viewGifts }}
          </button>
          <button
            type="button"
            class="px-3 py-1.5 text-sm font-body transition-colors cursor-pointer"
            :class="
              viewMode === 'reservations'
                ? 'bg-sage text-white'
                : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg'
            "
            @click="handleViewReservations"
          >
            {{ adminT.gifts.viewReservations }}
          </button>
        </div>

        <!-- Settings Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
          @click="showSettings = !showSettings"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{{ adminT.common.settings }}</span>
        </button>

        <!-- Add Gift Button -->
        <button
          v-if="canAddMore && viewMode === 'gifts'"
          type="button"
          class="flex items-center gap-2 px-4 py-2 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
          @click="openCreateModal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>{{ adminT.gifts.addGift }}</span>
        </button>
      </div>
    </div>

    <!-- Enable/Disable Toggle -->
    <div
      class="flex items-center justify-between p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
    >
      <div>
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
          {{ adminT.gifts.registryStatus }}
        </h3>
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          {{ settings.enabled ? adminT.gifts.visibleToGuests : adminT.gifts.hiddenFromGuests }}
        </p>
      </div>
      <ToggleSwitch
        :model-value="settings.enabled"
        :loading="isTogglingEnabled"
        @update:model-value="handleToggleEnabled"
      />
    </div>

    <!-- Upload Progress Bar -->
    <UploadProgressBar
      v-if="activeUploads.length > 0"
      :uploads="activeUploads"
      type="image"
      @cancel="cancelUpload"
    />

    <!-- Error Display -->
    <div
      v-if="operationError"
      class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <p class="font-body text-sm text-red-600 dark:text-red-400">
        {{ operationError }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      ></div>
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        {{ adminT.gifts.loadingGifts }}
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="mt-3 px-4 py-2 font-body text-sm text-sage border border-sage rounded-full hover:bg-sage hover:text-white transition-colors cursor-pointer"
        @click="fetchGiftsAdmin(weddingId ?? undefined)"
      >
        {{ adminT.common.tryAgain }}
      </button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Gifts View -->
      <template v-if="viewMode === 'gifts'">
        <!-- Empty State -->
        <div
          v-if="gifts.length === 0"
          class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl border border-sand-dark dark:border-dark-border"
        >
          <svg
            class="w-16 h-16 mx-auto text-charcoal-light/30 dark:text-dark-text-secondary/30 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.gifts.noGifts }}
          </p>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-2">
            {{ adminT.gifts.noGiftsHint }}
          </p>
          <button
            type="button"
            class="mt-4 px-4 py-2 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            @click="openCreateModal"
          >
            {{ adminT.gifts.addFirstGift }}
          </button>
        </div>

        <!-- Gift Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="gift in gifts"
            :key="gift.id"
            class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border overflow-hidden cursor-move"
            :class="{ 'ring-2 ring-sage': dropTargetId === gift.id }"
            draggable="true"
            @dragstart="handleDragStart(gift.id)"
            @dragover="handleDragOver($event, gift.id)"
            @dragend="handleDragEnd"
          >
            <!-- Image -->
            <div class="relative aspect-video bg-sand dark:bg-dark-bg">
              <img
                v-if="gift.imageUrl"
                :src="gift.imageUrl"
                :alt="gift.name.en"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg
                  class="w-12 h-12 text-charcoal-light/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
              </div>

              <!-- Priority Badge -->
              <span
                v-if="gift.priority === 'high'"
                :class="[
                  'absolute top-2 right-2 px-2 py-0.5 text-xs font-body rounded-full',
                  getPriorityColor(gift.priority),
                ]"
              >
                {{ adminT.gifts.needed }}
              </span>

              <!-- Reservation Badge -->
              <span
                v-if="gift.quantityReserved > 0"
                class="absolute top-2 left-2 px-2 py-0.5 text-xs font-body rounded-full bg-sage/90 text-white"
              >
                {{ gift.quantityReserved }}/{{ gift.quantityTotal }}
              </span>
            </div>

            <!-- Content -->
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-heading text-base text-charcoal dark:text-dark-text line-clamp-1">
                  {{ gift.name.en }}
                </h3>
                <span
                  :class="[
                    'ml-2 px-2 py-0.5 text-xs font-body rounded-full',
                    getPriorityColor(gift.priority),
                  ]"
                >
                  {{ gift.priority }}
                </span>
              </div>

              <p
                class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary line-clamp-2 mb-2"
              >
                {{ gift.description.en }}
              </p>

              <div
                class="flex items-center justify-between text-xs font-body text-charcoal-light dark:text-dark-text-secondary mb-3"
              >
                <span>{{ getCategoryLabel(gift.category) }}</span>
                <span>{{ gift.priceRange }}</span>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 py-1.5 px-3 text-xs font-body text-sage border border-sage rounded-lg hover:bg-sage/10 transition-colors cursor-pointer"
                  @click="openEditModal(gift)"
                >
                  {{ adminT.common.edit }}
                </button>
                <button
                  type="button"
                  class="py-1.5 px-3 text-xs font-body text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  @click="handleDeleteClick(gift.id)"
                >
                  {{ adminT.common.delete }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Reservations View -->
      <template v-else>
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
          >
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              {{ adminT.gifts.totalReservations }}
            </p>
            <p class="font-heading text-2xl text-charcoal dark:text-dark-text">
              {{ reservationSummary.totalReservations }}
            </p>
          </div>
          <div
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
          >
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              {{ adminT.gifts.itemsReserved }}
            </p>
            <p class="font-heading text-2xl text-charcoal dark:text-dark-text">
              {{ reservationSummary.totalQuantity }}
            </p>
          </div>
          <div
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
          >
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              {{ adminT.gifts.uniqueGuests }}
            </p>
            <p class="font-heading text-2xl text-charcoal dark:text-dark-text">
              {{ reservationSummary.uniqueGuests }}
            </p>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoadingReservations" class="text-center py-12">
          <div
            class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
          ></div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="reservations.length === 0"
          class="text-center py-12 bg-white dark:bg-dark-bg-secondary rounded-xl border border-sand-dark dark:border-dark-border"
        >
          <svg
            class="w-16 h-16 mx-auto text-charcoal-light/30 dark:text-dark-text-secondary/30 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.gifts.noReservations }}
          </p>
        </div>

        <!-- Reservations List -->
        <div
          v-else
          class="bg-white dark:bg-dark-bg-secondary rounded-xl border border-sand-dark dark:border-dark-border overflow-hidden"
        >
          <table class="w-full">
            <thead class="bg-sand dark:bg-dark-bg">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-body font-medium text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ adminT.gifts.guest }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-body font-medium text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ adminT.gifts.phone }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-body font-medium text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ adminT.gifts.gift }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-body font-medium text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ adminT.gifts.date }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sand-dark dark:divide-dark-border">
              <tr v-for="reservation in reservations" :key="reservation.id">
                <td class="px-4 py-3 font-body text-sm text-charcoal dark:text-dark-text">
                  {{ reservation.guestName }}
                </td>
                <td
                  class="px-4 py-3 font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ reservation.guestPhone }}
                </td>
                <td class="px-4 py-3 font-body text-sm text-charcoal dark:text-dark-text">
                  {{ reservation.giftName?.en || getGiftName(reservation.giftId) }}
                </td>
                <td
                  class="px-4 py-3 font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ formatDate(reservation.reservedAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Gift Form Modal -->
    <Teleport to="body">
      <Transition name="modal" @after-leave="onModalClosed">
        <div v-if="showGiftForm" class="modal-backdrop" @click.self="closeGiftForm">
          <div class="modal-content max-w-lg bg-white dark:bg-dark-bg-secondary">
            <div class="modal-header border-sand-dark dark:border-dark-border">
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ editingGift ? adminT.gifts.editGift : adminT.gifts.addGift }}
              </h3>
              <button
                type="button"
                class="p-2 -m-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                @click="closeGiftForm"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <!-- Image Upload -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-2"
                >
                  {{ adminT.gifts.image }}
                </label>
                <div class="flex items-center gap-4">
                  <div
                    class="w-20 h-20 bg-sand dark:bg-dark-bg rounded-lg overflow-hidden flex items-center justify-center"
                  >
                    <img
                      v-if="imagePreview"
                      :src="imagePreview"
                      class="w-full h-full object-cover"
                    />
                    <svg
                      v-else
                      class="w-8 h-8 text-charcoal-light/30"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                      />
                    </svg>
                  </div>
                  <label
                    class="px-4 py-2 font-body text-sm text-sage border border-sage rounded-lg hover:bg-sage/10 transition-colors cursor-pointer"
                  >
                    {{ adminT.gifts.chooseImage }}
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleImageSelect"
                    />
                  </label>
                </div>
              </div>

              <!-- Name EN -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.nameEnglish }} *
                </label>
                <input
                  v-model="formData.nameEn"
                  type="text"
                  required
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  placeholder="e.g., Rice Cooker"
                />
              </div>

              <!-- Name MS -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.nameMalay }} *
                </label>
                <input
                  v-model="formData.nameMs"
                  type="text"
                  required
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  placeholder="e.g., Periuk Nasi"
                />
              </div>

              <!-- Description EN -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.descriptionEnglish }} *
                </label>
                <textarea
                  v-model="formData.descriptionEn"
                  rows="2"
                  required
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text resize-none"
                  placeholder="Brief description..."
                ></textarea>
              </div>

              <!-- Description MS -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.descriptionMalay }} *
                </label>
                <textarea
                  v-model="formData.descriptionMs"
                  rows="2"
                  required
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text resize-none"
                  placeholder="Penerangan ringkas..."
                ></textarea>
              </div>

              <!-- External Link -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.externalLink }}
                </label>
                <input
                  v-model="formData.externalLink"
                  type="url"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  placeholder="https://shopee.com.my/..."
                />
              </div>

              <!-- Price Range -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.priceRange }} *
                </label>
                <input
                  v-model="formData.priceRange"
                  type="text"
                  required
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  placeholder="e.g., RM150 - RM200"
                />
              </div>

              <!-- Category & Priority -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    {{ adminT.gifts.category }}
                  </label>
                  <select
                    v-model="formData.category"
                    class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  >
                    <option value="home">{{ adminT.gifts.categoryHome }}</option>
                    <option value="kitchen">{{ adminT.gifts.categoryKitchen }}</option>
                    <option value="electronics">{{ adminT.gifts.categoryElectronics }}</option>
                    <option value="experiences">{{ adminT.gifts.categoryExperiences }}</option>
                    <option value="other">{{ adminT.gifts.categoryOther }}</option>
                  </select>
                </div>
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    {{ adminT.gifts.priority }}
                  </label>
                  <select
                    v-model="formData.priority"
                    class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  >
                    <option value="high">{{ adminT.gifts.priorityHigh }}</option>
                    <option value="medium">{{ adminT.gifts.priorityMedium }}</option>
                    <option value="low">{{ adminT.gifts.priorityLow }}</option>
                  </select>
                </div>
              </div>

              <!-- Quantity -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.quantity }}
                </label>
                <input
                  v-model.number="formData.quantityTotal"
                  type="number"
                  min="1"
                  max="10"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                />
                <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                  {{ adminT.gifts.quantityHint }}
                </p>
              </div>

              <!-- Notes -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.notes }}
                </label>
                <textarea
                  v-model="formData.notes"
                  rows="2"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text resize-none"
                  :placeholder="adminT.gifts.notesPlaceholder"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 py-2.5 px-4 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-gray-600 rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                  @click="closeGiftForm"
                >
                  {{ adminT.common.cancel }}
                </button>
                <button
                  type="submit"
                  :disabled="!isFormValid || isCreating || isUpdating"
                  class="flex-1 py-2.5 px-4 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {{
                    isCreating || isUpdating
                      ? adminT.common.saving
                      : editingGift
                        ? adminT.common.update
                        : adminT.gifts.addGift
                  }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Settings Modal -->
    <Teleport to="body">
      <Transition name="modal" @after-leave="onModalClosed">
        <div v-if="showSettings" class="modal-backdrop" @click.self="showSettings = false">
          <div class="modal-content bg-white dark:bg-dark-bg-secondary">
            <div class="modal-header border-sand-dark dark:border-dark-border">
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ adminT.gifts.giftSettings }}
              </h3>
              <button
                type="button"
                class="p-2 -m-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text cursor-pointer"
                @click="showSettings = false"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <!-- Max Items -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.maxItems }}
                </label>
                <input
                  :value="settings.maxItems"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  @change="
                    handleSettingsUpdate({
                      maxItems: parseInt(($event.target as HTMLInputElement).value),
                    })
                  "
                />
              </div>

              <!-- Max File Size -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  {{ adminT.gifts.maxImageSize }}
                </label>
                <input
                  :value="Math.round(settings.maxFileSize / (1024 * 1024))"
                  type="number"
                  min="1"
                  max="10"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  @change="
                    handleSettingsUpdate({
                      maxFileSize:
                        parseInt(($event.target as HTMLInputElement).value) * 1024 * 1024,
                    })
                  "
                />
              </div>

              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{ adminT.gifts.settingsAutoSave }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-if="deleteConfirmId"
      :title="adminT.gifts.deleteGift"
      :message="
        interpolate(adminT.gifts.deleteGiftConfirm, { name: getGiftToDelete()?.name?.en || '' })
      "
      :is-deleting="isDeleting"
      @confirm="handleDeleteConfirm"
      @cancel="handleDeleteCancel"
    />
  </div>
</template>

<style scoped>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom-width: 1px;
    border-bottom-style: solid;
  }

  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease-out;
  }

  .modal-enter-active .modal-content,
  .modal-leave-active .modal-content {
    transition:
      transform 0.2s ease-out,
      opacity 0.2s ease-out;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-from .modal-content,
  .modal-leave-to .modal-content {
    opacity: 0;
    transform: scale(0.95);
  }

  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
