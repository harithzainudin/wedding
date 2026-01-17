<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
  import { useGifts } from '@/composables/useGifts'
  import type { GiftItem, GiftCategory, GiftPriority } from '@/types/gift'
  import DeleteConfirmModal from './DeleteConfirmModal.vue'
  import UploadProgressBar from './UploadProgressBar.vue'

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
    activeUploads,
    canAddMore,
    summary,
    fetchGifts,
    fetchSettings,
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
    await Promise.all([fetchGifts(), fetchSettings()])
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

    if (editingGift.value) {
      const result = await updateGiftItem(editingGift.value.id, data)
      if (result.success && imageFile.value) {
        await uploadGiftImage(editingGift.value.id, imageFile.value)
      }
      if (result.success) {
        closeGiftForm()
      }
    } else {
      const result = await createGiftItem(data)
      if (result.success && result.giftId && imageFile.value) {
        await uploadGiftImage(result.giftId, imageFile.value)
      }
      if (result.success) {
        closeGiftForm()
      }
    }
  }

  // Delete handlers
  const handleDeleteClick = (giftId: string) => {
    deleteConfirmId.value = giftId
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId.value) return
    const result = await deleteGiftItem(deleteConfirmId.value)
    if (result.success) {
      deleteConfirmId.value = null
    }
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

      await reorderGiftItems(currentOrder)
    }

    draggedId.value = null
    dropTargetId.value = null
  }

  // Settings handlers
  const handleToggleEnabled = async () => {
    await toggleEnabled()
  }

  const handleSettingsUpdate = async (newSettings: Partial<typeof settings.value>) => {
    await updateSettings(newSettings)
  }

  // View reservations
  const handleViewReservations = async () => {
    viewMode.value = 'reservations'
    await fetchReservations()
  }

  // Get gift name by ID for reservations
  const getGiftName = (giftId: string): string => {
    const gift = gifts.value.find((g) => g.id === giftId)
    return gift ? gift.name.en || gift.name.ms || 'Unknown' : 'Unknown'
  }

  // Get category label
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      home: 'Home',
      kitchen: 'Kitchen',
      electronics: 'Electronics',
      experiences: 'Experiences',
      other: 'Other',
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

  watch([showSettings, showGiftForm], ([settingsOpen, formOpen]) => {
    if (settingsOpen || formOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = ''
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
          Gift Registry
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          {{ summary.total }} items | {{ summary.reservedQuantity }} /
          {{ summary.totalQuantity }} reserved
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
            Gifts
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
            Reservations
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
          <span>Settings</span>
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
          <span>Add Gift</span>
        </button>
      </div>
    </div>

    <!-- Enable/Disable Toggle -->
    <div
      class="flex items-center justify-between p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
    >
      <div>
        <h3 class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
          Gift Registry Status
        </h3>
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-0.5">
          {{
            settings.enabled ? 'Wishlist is visible to guests' : 'Wishlist is hidden from guests'
          }}
        </p>
      </div>
      <button
        type="button"
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer"
        :class="settings.enabled ? 'bg-sage' : 'bg-gray-300 dark:bg-gray-600'"
        @click="handleToggleEnabled"
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
          :class="settings.enabled ? 'translate-x-6' : 'translate-x-1'"
        />
      </button>
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
        Loading gifts...
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
        @click="fetchGifts"
      >
        Try Again
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
            No gifts in the registry yet.
          </p>
          <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mt-2">
            Add your first gift to create a wishlist for guests.
          </p>
          <button
            type="button"
            class="mt-4 px-4 py-2 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            @click="openCreateModal"
          >
            Add First Gift
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
                Needed
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
                  Edit
                </button>
                <button
                  type="button"
                  class="py-1.5 px-3 text-xs font-body text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  @click="handleDeleteClick(gift.id)"
                >
                  Delete
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
              Total Reservations
            </p>
            <p class="font-heading text-2xl text-charcoal dark:text-dark-text">
              {{ reservationSummary.totalReservations }}
            </p>
          </div>
          <div
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
          >
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              Items Reserved
            </p>
            <p class="font-heading text-2xl text-charcoal dark:text-dark-text">
              {{ reservationSummary.totalQuantity }}
            </p>
          </div>
          <div
            class="p-4 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
          >
            <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
              Unique Guests
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
            No reservations yet.
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
                  Guest
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-body font-medium text-charcoal-light dark:text-dark-text-secondary"
                >
                  Phone
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-body font-medium text-charcoal-light dark:text-dark-text-secondary"
                >
                  Gift
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-body font-medium text-charcoal-light dark:text-dark-text-secondary"
                >
                  Date
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
      <Transition name="modal">
        <div v-if="showGiftForm" class="modal-backdrop" @click.self="closeGiftForm">
          <div class="modal-content max-w-lg">
            <div class="modal-header">
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                {{ editingGift ? 'Edit Gift' : 'Add Gift' }}
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
                  Image
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
                    Choose Image
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
                  Name (English) *
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
                  Name (Malay) *
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
                  Description (English) *
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
                  Description (Malay) *
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
                  External Link (Shopee, etc.)
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
                  Price Range *
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
                    Category
                  </label>
                  <select
                    v-model="formData.category"
                    class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  >
                    <option value="home">Home</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="electronics">Electronics</option>
                    <option value="experiences">Experiences</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    Priority
                  </label>
                  <select
                    v-model="formData.priority"
                    class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  >
                    <option value="high">High (Needed)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <!-- Quantity -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  Quantity
                </label>
                <input
                  v-model.number="formData.quantityTotal"
                  type="number"
                  min="1"
                  max="10"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                />
                <p class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                  How many of this item would you like? Multiple guests can reserve different units.
                </p>
              </div>

              <!-- Notes -->
              <div>
                <label
                  class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                >
                  Notes (specifications, preferred color/brand)
                </label>
                <textarea
                  v-model="formData.notes"
                  rows="2"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text resize-none"
                  placeholder="e.g., Preferably in white color, Philips brand..."
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 py-2.5 px-4 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-gray-600 rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                  @click="closeGiftForm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="!isFormValid || isCreating || isUpdating"
                  class="flex-1 py-2.5 px-4 font-body text-sm bg-sage text-white rounded-lg hover:bg-sage-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {{ isCreating || isUpdating ? 'Saving...' : editingGift ? 'Update' : 'Add Gift' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Settings Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showSettings" class="modal-backdrop" @click.self="showSettings = false">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                Gift Settings
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
                  Maximum Items
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
                  Maximum Image Size (MB)
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
                Settings are saved automatically when changed.
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      v-if="deleteConfirmId"
      :title="'Delete Gift'"
      :message="`Are you sure you want to delete '${getGiftToDelete()?.name?.en}'? This will also delete all reservations for this gift.`"
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
    background-color: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  :global(.dark) .modal-content {
    background-color: #1f2937;
  }

  :global(.dark) .modal-header {
    border-bottom-color: #374151;
  }

  .modal-enter-active,
  .modal-leave-active {
    transition: all 0.2s ease-out;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-from .modal-content,
  .modal-leave-to .modal-content {
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
