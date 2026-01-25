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
  import DefaultGiftBrowser from './DefaultGiftBrowser.vue'

  const { adminT, currentAdminLanguage } = useAdminLanguage()
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
    isBulkDeleting,
    activeUploads,
    canAddMore,
    summary,
    fetchGiftsAdmin,
    fetchReservations,
    createGiftItem,
    updateGiftItem,
    deleteGiftItem,
    bulkDeleteGiftItems,
    reorderGiftItems,
    uploadGiftImage,
    cancelUpload,
    // Selection mode
    isSelectionMode,
    selectedGiftIds,
    selectedGiftsWithReservations,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelection,
    selectAll,
    deselectAll,
  } = useGifts()

  // View mode
  const viewMode = ref<'gifts' | 'reservations'>('gifts')

  // Gift display view mode (card or list)
  type GiftViewMode = 'card' | 'list'
  const GIFT_VIEW_KEY = 'wedding-admin-gift-view'
  const getInitialGiftViewMode = (): GiftViewMode => {
    if (typeof window === 'undefined') return 'card'
    const stored = localStorage.getItem(GIFT_VIEW_KEY)
    return stored === 'list' ? 'list' : 'card'
  }
  const giftViewMode = ref<GiftViewMode>(getInitialGiftViewMode())
  const setGiftViewMode = (mode: GiftViewMode) => {
    giftViewMode.value = mode
    localStorage.setItem(GIFT_VIEW_KEY, mode)
  }

  // Gift sorting
  type AdminGiftSortOption =
    | 'custom'
    | 'priority'
    | 'name-asc'
    | 'name-desc'
    | 'category'
    | 'availability'
    | 'most-reserved'
    | 'newest'
    | 'oldest'

  const GIFT_SORT_KEY = 'wedding-admin-gift-sort'
  const validSortOptions: AdminGiftSortOption[] = [
    'custom',
    'priority',
    'name-asc',
    'name-desc',
    'category',
    'availability',
    'most-reserved',
    'newest',
    'oldest',
  ]

  const getInitialSortOption = (): AdminGiftSortOption => {
    if (typeof window === 'undefined') return 'custom'
    const stored = localStorage.getItem(GIFT_SORT_KEY)
    return validSortOptions.includes(stored as AdminGiftSortOption)
      ? (stored as AdminGiftSortOption)
      : 'custom'
  }

  const sortOption = ref<AdminGiftSortOption>(getInitialSortOption())

  const setSortOption = (option: AdminGiftSortOption) => {
    sortOption.value = option
    localStorage.setItem(GIFT_SORT_KEY, option)
  }

  // Check if drag-and-drop should be enabled (only for custom order)
  const isDragEnabled = computed(() => sortOption.value === 'custom')

  // Sorted gifts based on current sort option
  const sortedGifts = computed(() => {
    const giftList = [...gifts.value]

    switch (sortOption.value) {
      case 'priority': {
        const priorityOrder: Record<GiftPriority, number> = { high: 0, medium: 1, low: 2, none: 3 }
        return giftList.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      }
      case 'name-asc': {
        const lang = currentAdminLanguage.value
        return giftList.sort((a, b) => {
          const nameA = a.name[lang] || a.name.en || ''
          const nameB = b.name[lang] || b.name.en || ''
          return nameA.localeCompare(nameB, lang)
        })
      }
      case 'name-desc': {
        const lang = currentAdminLanguage.value
        return giftList.sort((a, b) => {
          const nameA = a.name[lang] || a.name.en || ''
          const nameB = b.name[lang] || b.name.en || ''
          return nameB.localeCompare(nameA, lang)
        })
      }
      case 'category': {
        const categoryOrder: Record<GiftCategory, number> = {
          home: 0,
          kitchen: 1,
          electronics: 2,
          experiences: 3,
          other: 4,
        }
        return giftList.sort((a, b) => categoryOrder[a.category] - categoryOrder[b.category])
      }
      case 'availability': {
        return giftList.sort((a, b) => {
          const aAvailable = a.quantityTotal - a.quantityReserved
          const bAvailable = b.quantityTotal - b.quantityReserved
          return bAvailable - aAvailable // Higher availability first
        })
      }
      case 'most-reserved': {
        return giftList.sort((a, b) => b.quantityReserved - a.quantityReserved)
      }
      case 'newest': {
        return giftList.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
      case 'oldest': {
        return giftList.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }
      case 'custom':
      default:
        // Use original order from composable (already sorted by order field)
        return giftList
    }
  })

  // Modal states
  const showSettings = ref(false)
  const showGiftForm = ref(false)
  const editingGift = ref<GiftItem | null>(null)
  const deleteConfirmId = ref<string | null>(null)
  const showDefaultBrowser = ref(false)

  // Form data
  const formData = ref({
    nameEn: '',
    nameMs: '',
    descriptionEn: '',
    descriptionMs: '',
    externalLink: '',
    priceRange: '',
    category: 'other' as GiftCategory,
    priority: 'none' as GiftPriority,
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
      formData.value.descriptionMs.trim()
    )
  })

  onMounted(async () => {
    // fetchGiftsAdmin also loads settings from the admin response
    await fetchGiftsAdmin(weddingId.value ?? undefined)
  })

  // Watch for wedding ID changes (user switching between weddings)
  watch(weddingId, async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchGiftsAdmin(newId)
    }
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
      priority: 'none',
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
      category: formData.value.category,
      priority: formData.value.priority,
      quantityTotal: formData.value.quantityTotal,
      ...(formData.value.priceRange.trim() ? { priceRange: formData.value.priceRange } : {}),
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

  // Bulk delete modal
  const showBulkDeleteModal = ref(false)
  const showReservedList = ref(false)

  const openBulkDeleteModal = () => {
    showBulkDeleteModal.value = true
    showReservedList.value = false
  }

  const closeBulkDeleteModal = () => {
    showBulkDeleteModal.value = false
    showReservedList.value = false
  }

  const handleBulkDelete = async (skipReserved: boolean) => {
    const idsToDelete = Array.from(selectedGiftIds.value)
    closeBulkDeleteModal()

    await withLoading(
      async () => {
        const result = await bulkDeleteGiftItems(
          idsToDelete,
          skipReserved,
          weddingId.value ?? undefined
        )
        if (result.success) {
          exitSelectionMode()
        }
      },
      {
        message: adminT.value.loadingOverlay.deleting,
        showSuccess: true,
      }
    )
  }

  const toggleSelectAll = () => {
    if (selectedGiftIds.value.size === gifts.value.length) {
      deselectAll()
    } else {
      selectAll()
    }
  }

  // Default gifts handler
  const handleDefaultGiftsAdded = (_count: number) => {
    // Gifts are already added via createGiftItem which updates the reactive gifts array
    // The UI updates automatically, nothing else needed here
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
  <div class="space-y-4">
    <!-- Header Row: Title + View Toggle -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <!-- Left: Title and Stats -->
      <div class="flex items-center gap-4">
        <div>
          <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
            {{ adminT.gifts.title }}
          </h2>
          <p
            class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-0.5 whitespace-nowrap"
          >
            {{ interpolate(adminT.gifts.itemsCount, { count: String(summary.total) }) }} |
            {{
              interpolate(adminT.gifts.reserved, {
                reserved: String(summary.reservedQuantity),
                total: String(summary.totalQuantity),
              })
            }}
          </p>
        </div>
      </div>

      <!-- Right: View Toggle (always visible, doesn't move) -->
      <div
        class="flex self-start sm:self-auto rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border"
      >
        <button
          type="button"
          class="px-4 py-2 text-sm font-body transition-colors cursor-pointer"
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
          class="px-4 py-2 text-sm font-body transition-colors cursor-pointer"
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
    </div>

    <!-- Toolbar Row (only visible in Gifts view - clean show/hide) -->
    <div
      v-if="viewMode === 'gifts'"
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-sand-dark/50 dark:border-dark-border/50"
    >
      <!-- Left side: Sort and View options -->
      <div class="flex items-center gap-2">
        <!-- Sort Dropdown -->
        <div v-if="gifts.length > 0" class="relative">
          <select
            :value="sortOption"
            class="appearance-none pl-3 pr-8 py-2 font-body text-sm border border-sand-dark dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text focus:outline-none focus:border-sage cursor-pointer"
            @change="
              setSortOption(($event.target as HTMLSelectElement).value as AdminGiftSortOption)
            "
          >
            <option value="custom">{{ adminT.gifts.sortCustomOrder }}</option>
            <option value="priority">{{ adminT.gifts.sortPriority }}</option>
            <option value="name-asc">{{ adminT.gifts.sortNameAsc }}</option>
            <option value="name-desc">{{ adminT.gifts.sortNameDesc }}</option>
            <option value="category">{{ adminT.gifts.sortCategory }}</option>
            <option value="availability">{{ adminT.gifts.sortAvailability }}</option>
            <option value="most-reserved">{{ adminT.gifts.sortMostReserved }}</option>
            <option value="newest">{{ adminT.gifts.sortNewest }}</option>
            <option value="oldest">{{ adminT.gifts.sortOldest }}</option>
          </select>
          <svg
            class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light dark:text-dark-text-secondary pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        <!-- Card/List View Toggle -->
        <div
          v-if="gifts.length > 0"
          class="flex rounded-lg overflow-hidden border border-sand-dark dark:border-dark-border"
        >
          <button
            type="button"
            class="p-2 transition-colors cursor-pointer"
            :class="
              giftViewMode === 'card'
                ? 'bg-sage text-white'
                : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg'
            "
            :title="adminT.gifts.cardView"
            @click="setGiftViewMode('card')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            type="button"
            class="p-2 transition-colors cursor-pointer"
            :class="
              giftViewMode === 'list'
                ? 'bg-sage text-white'
                : 'bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text hover:bg-sand dark:hover:bg-dark-bg'
            "
            :title="adminT.gifts.listView"
            @click="setGiftViewMode('list')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <!-- Settings Button -->
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
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
          <span class="hidden sm:inline">{{ adminT.common.settings }}</span>
        </button>
      </div>

      <!-- Right side: Action buttons -->
      <div class="flex items-center gap-2">
        <!-- Select / Cancel Selection Button -->
        <button
          v-if="!isSelectionMode && gifts.length > 0"
          type="button"
          class="flex items-center gap-2 px-3 py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg-secondary transition-colors cursor-pointer"
          @click="enterSelectionMode"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span class="hidden sm:inline">{{ adminT.gifts.select }}</span>
        </button>
        <button
          v-if="isSelectionMode"
          type="button"
          class="flex items-center gap-2 px-3 py-2 font-body text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
          @click="exitSelectionMode"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span class="hidden sm:inline">{{ adminT.gifts.exitSelection }}</span>
        </button>

        <!-- Browse Defaults Button -->
        <button
          type="button"
          :disabled="!canAddMore"
          :title="!canAddMore ? adminT.gifts.limitReachedTooltip : ''"
          :class="[
            'flex items-center gap-2 px-3 py-2 font-body text-sm rounded-lg transition-colors',
            !canAddMore
              ? 'border border-sage/30 text-sage/40 cursor-not-allowed'
              : 'border border-sage text-sage hover:bg-sage/10 cursor-pointer',
          ]"
          @click="showDefaultBrowser = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span class="hidden sm:inline">{{ adminT.gifts.browseDefaults }}</span>
        </button>

        <!-- Add Gift Button -->
        <button
          type="button"
          :disabled="!canAddMore"
          :title="!canAddMore ? adminT.gifts.limitReachedTooltip : ''"
          :class="[
            'flex items-center gap-2 px-4 py-2 font-body text-sm rounded-lg transition-colors',
            !canAddMore
              ? 'bg-sage/30 text-white/50 cursor-not-allowed'
              : 'bg-sage text-white hover:bg-sage-dark cursor-pointer',
          ]"
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
          <span class="hidden sm:inline">{{ adminT.gifts.addGift }}</span>
        </button>
      </div>
    </div>

    <!-- Selection Toolbar -->
    <div
      v-if="isSelectionMode"
      class="sticky top-0 z-20 bg-white dark:bg-dark-bg-secondary py-3 px-4 -mx-4 sm:mx-0 sm:px-4 sm:rounded-lg mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 border-b sm:border border-sand-dark dark:border-dark-border shadow-sm"
    >
      <!-- Top row: Count + Cancel (mobile) -->
      <div class="flex items-center justify-between sm:justify-start sm:flex-1 gap-3">
        <span class="flex items-center gap-2 text-sm font-body text-charcoal dark:text-dark-text">
          <span
            class="w-5 h-5 bg-sage text-white rounded flex items-center justify-center text-xs font-medium"
          >
            {{ selectedGiftIds.size }}
          </span>
          {{ interpolate(adminT.gifts.selectedCount, { count: String(selectedGiftIds.size) }) }}
        </span>
        <button
          type="button"
          class="sm:hidden px-3 py-1.5 text-sm text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text cursor-pointer"
          @click="exitSelectionMode"
        >
          {{ adminT.gifts.exitSelection }}
        </button>
      </div>

      <!-- Bottom row: Actions -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-4 py-2 text-sm font-body text-sage border border-sage rounded-lg hover:bg-sage/10 transition-colors cursor-pointer"
          @click="toggleSelectAll"
        >
          {{
            selectedGiftIds.size === gifts.length
              ? adminT.gifts.deselectAll
              : adminT.gifts.selectAll
          }}
        </button>
        <button
          type="button"
          class="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 px-4 py-2 text-sm font-body text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="selectedGiftIds.size === 0"
          @click="openBulkDeleteModal"
        >
          {{ adminT.gifts.deleteSelected }}
        </button>
        <button
          type="button"
          class="hidden sm:block px-4 py-2 text-sm font-body text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text transition-colors cursor-pointer"
          @click="exitSelectionMode"
        >
          {{ adminT.gifts.exitSelection }}
        </button>
      </div>
    </div>

    <!-- Upload Progress Bar -->
    <UploadProgressBar
      v-if="activeUploads.length > 0"
      :uploads="activeUploads"
      type="image"
      @cancel="cancelUpload"
    />

    <!-- Registry Limit Banner -->
    <div
      v-if="!canAddMore && !isLoading && !loadError"
      class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-center gap-3"
    >
      <svg
        class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p class="font-body text-sm text-amber-800 dark:text-amber-200">
        {{
          interpolate(adminT.gifts.limitReachedBanner, {
            current: String(gifts.length),
            max: String(settings.maxItems),
          })
        }}
      </p>
    </div>

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

        <!-- Gift Card Grid -->
        <div
          v-else-if="giftViewMode === 'card'"
          class="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4"
        >
          <div
            v-for="gift in sortedGifts"
            :key="gift.id"
            class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border overflow-hidden"
            :class="[
              isDragEnabled && !isSelectionMode ? 'cursor-move' : 'cursor-default',
              { 'ring-2 ring-sage': dropTargetId === gift.id && isDragEnabled && !isSelectionMode },
              { 'ring-2 ring-sage bg-sage/5': isSelectionMode && selectedGiftIds.has(gift.id) },
            ]"
            :draggable="isDragEnabled && !isSelectionMode"
            @dragstart="isDragEnabled && !isSelectionMode ? handleDragStart(gift.id) : undefined"
            @dragover="
              isDragEnabled && !isSelectionMode ? handleDragOver($event, gift.id) : undefined
            "
            @dragend="isDragEnabled && !isSelectionMode ? handleDragEnd() : undefined"
            @click="isSelectionMode ? toggleSelection(gift.id) : undefined"
          >
            <!-- Image -->
            <div class="relative aspect-video bg-sand dark:bg-dark-bg">
              <!-- Selection Checkbox -->
              <div
                v-if="isSelectionMode"
                class="absolute top-2 left-2 z-10"
                @click.stop="toggleSelection(gift.id)"
              >
                <div
                  class="w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors duration-150"
                  :class="
                    selectedGiftIds.has(gift.id)
                      ? 'bg-sage border-sage text-white'
                      : 'bg-white/90 border-charcoal-light/40 hover:border-sage'
                  "
                >
                  <svg
                    v-if="selectedGiftIds.has(gift.id)"
                    class="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <img
                v-if="gift.imageUrl"
                :src="gift.imageUrl"
                :alt="gift.name.en"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg
                  class="w-8 h-8 sm:w-12 sm:h-12 text-charcoal-light/30"
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
                  'absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-body rounded-full',
                  getPriorityColor(gift.priority),
                ]"
              >
                {{ adminT.gifts.needed }}
              </span>

              <!-- Reservation Badge -->
              <span
                v-if="gift.quantityReserved > 0"
                class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-body rounded-full bg-sage/90 text-white"
              >
                {{ gift.quantityReserved }}/{{ gift.quantityTotal }}
              </span>
            </div>

            <!-- Content -->
            <div class="p-2 sm:p-4">
              <div class="flex items-start justify-between mb-1 sm:mb-2">
                <h3
                  class="font-heading text-xs sm:text-base text-charcoal dark:text-dark-text line-clamp-1"
                >
                  {{ gift.name.en }}
                </h3>
                <span
                  :class="[
                    'ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-body rounded-full',
                    getPriorityColor(gift.priority),
                  ]"
                >
                  {{ gift.priority }}
                </span>
              </div>

              <p
                class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary line-clamp-2 mb-2 hidden sm:block"
              >
                {{ gift.description.en }}
              </p>

              <div
                class="flex items-center justify-between text-[10px] sm:text-xs font-body text-charcoal-light dark:text-dark-text-secondary mb-2 sm:mb-3"
              >
                <span>{{ getCategoryLabel(gift.category) }}</span>
                <span>{{ gift.priceRange }}</span>
              </div>

              <!-- Actions -->
              <div class="flex gap-1 sm:gap-2">
                <button
                  type="button"
                  class="flex-1 py-1 sm:py-1.5 px-2 sm:px-3 text-[10px] sm:text-xs font-body text-sage border border-sage rounded-lg hover:bg-sage/10 transition-colors cursor-pointer"
                  @click="openEditModal(gift)"
                >
                  {{ adminT.common.edit }}
                </button>
                <button
                  type="button"
                  class="py-1 sm:py-1.5 px-2 sm:px-3 text-[10px] sm:text-xs font-body text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  @click="handleDeleteClick(gift.id)"
                >
                  {{ adminT.common.delete }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Gift List View -->
        <div v-else class="space-y-2">
          <div
            v-for="gift in sortedGifts"
            :key="gift.id"
            class="flex items-center gap-3 p-3 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border"
            :class="[
              { 'ring-2 ring-sage': dropTargetId === gift.id && isDragEnabled && !isSelectionMode },
              { 'ring-2 ring-sage bg-sage/5': isSelectionMode && selectedGiftIds.has(gift.id) },
            ]"
            :draggable="isDragEnabled && !isSelectionMode"
            @dragstart="isDragEnabled && !isSelectionMode ? handleDragStart(gift.id) : undefined"
            @dragover="
              isDragEnabled && !isSelectionMode ? handleDragOver($event, gift.id) : undefined
            "
            @dragend="isDragEnabled && !isSelectionMode ? handleDragEnd() : undefined"
            @click="isSelectionMode ? toggleSelection(gift.id) : undefined"
          >
            <!-- Selection Checkbox (when in selection mode) -->
            <div
              v-if="isSelectionMode"
              class="flex-shrink-0"
              @click.stop="toggleSelection(gift.id)"
            >
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors duration-150"
                :class="
                  selectedGiftIds.has(gift.id)
                    ? 'bg-sage border-sage text-white'
                    : 'border-charcoal-light/40 hover:border-sage'
                "
              >
                <svg
                  v-if="selectedGiftIds.has(gift.id)"
                  class="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <!-- Drag Handle (when not in selection mode) -->
            <div
              v-else
              class="flex-shrink-0"
              :class="
                isDragEnabled
                  ? 'cursor-move text-charcoal-light dark:text-dark-text-secondary'
                  : 'cursor-not-allowed text-charcoal-light/30 dark:text-dark-text-secondary/30'
              "
              :title="!isDragEnabled ? adminT.gifts.dragDisabledHint : undefined"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
                />
              </svg>
            </div>

            <!-- Thumbnail -->
            <div class="w-12 h-12 flex-shrink-0 bg-sand dark:bg-dark-bg rounded overflow-hidden">
              <img
                v-if="gift.imageUrl"
                :src="gift.imageUrl"
                :alt="gift.name.en"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-6 h-6 text-charcoal-light/30" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  />
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-heading text-sm text-charcoal dark:text-dark-text truncate">
                  {{ gift.name.en }}
                </h3>
                <span
                  v-if="gift.priority === 'high'"
                  class="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 flex-shrink-0"
                >
                  {{ adminT.gifts.needed }}
                </span>
              </div>
              <div
                class="flex items-center gap-2 text-xs text-charcoal-light dark:text-dark-text-secondary"
              >
                <span>{{ getCategoryLabel(gift.category) }}</span>
                <span v-if="gift.priceRange" class="hidden sm:inline">•</span>
                <span v-if="gift.priceRange" class="hidden sm:inline">{{ gift.priceRange }}</span>
                <span v-if="gift.quantityReserved > 0" class="text-sage">
                  {{ gift.quantityReserved }}/{{ gift.quantityTotal }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                class="p-1.5 text-sage hover:bg-sage/10 rounded cursor-pointer"
                :title="adminT.common.edit"
                @click="openEditModal(gift)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
                :title="adminT.common.delete"
                @click="handleDeleteClick(gift.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
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
                  {{ adminT.gifts.priceRange }}
                </label>
                <input
                  v-model="formData.priceRange"
                  type="text"
                  class="w-full px-3 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  :placeholder="adminT.gifts.priceRangePlaceholder"
                />
              </div>

              <!-- Category & Priority -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    {{ adminT.gifts.category }}
                  </label>
                  <select
                    v-model="formData.category"
                    class="w-full pl-3 pr-10 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
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
                    class="w-full pl-3 pr-10 py-2 font-body text-sm border border-sand-dark dark:border-gray-600 rounded-lg bg-sand dark:bg-dark-bg focus:outline-none focus:border-sage dark:focus:border-sage text-charcoal dark:text-dark-text"
                  >
                    <option value="none">{{ adminT.gifts.priorityNone }}</option>
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
              <!-- Current Limits (read-only) -->
              <div
                class="p-3 bg-sand/50 dark:bg-dark-bg rounded-lg border border-sand-dark/50 dark:border-dark-border/50"
              >
                <div class="grid grid-cols-2 gap-4">
                  <!-- Max Items -->
                  <div>
                    <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
                      {{ adminT.gifts.maxItems }}
                    </p>
                    <p
                      class="font-body text-base text-charcoal-light dark:text-dark-text-secondary"
                    >
                      {{ settings.maxItems }}
                    </p>
                  </div>

                  <!-- Max File Size -->
                  <div>
                    <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
                      {{ adminT.gifts.maxImageSize }}
                    </p>
                    <p
                      class="font-body text-base text-charcoal-light dark:text-dark-text-secondary"
                    >
                      {{ Math.round(settings.maxFileSize / (1024 * 1024)) }} MB
                    </p>
                  </div>
                </div>

                <!-- Super Admin Note -->
                <p
                  class="mt-3 font-body text-xs text-charcoal-light/70 dark:text-dark-text-secondary/70 italic"
                >
                  {{ adminT.gifts.limitsReadOnly ?? 'Limits are managed by Super Admin' }}
                </p>
              </div>
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

    <!-- Bulk Delete Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showBulkDeleteModal"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50" @click="closeBulkDeleteModal" />

          <!-- Modal Content - bottom sheet on mobile, centered on desktop -->
          <div
            class="relative w-full sm:max-w-lg bg-white dark:bg-dark-bg-secondary rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-hidden transform transition-transform sm:mx-4"
          >
            <!-- Handle bar for mobile -->
            <div class="sm:hidden flex justify-center pt-3 pb-1">
              <div class="w-10 h-1 bg-charcoal-light/30 rounded-full" />
            </div>

            <!-- Header -->
            <div class="px-4 sm:px-6 py-4 border-b border-sand-dark dark:border-dark-border">
              <h3 class="font-heading text-lg text-charcoal dark:text-dark-text">
                {{
                  interpolate(adminT.gifts.bulkDeleteTitle, {
                    count: String(selectedGiftIds.size),
                  })
                }}
              </h3>
            </div>

            <!-- Scrollable Content -->
            <div class="px-4 sm:px-6 py-4 max-h-[40vh] overflow-y-auto">
              <!-- Reservation Warning -->
              <div
                v-if="selectedGiftsWithReservations.length > 0"
                class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
              >
                <button
                  type="button"
                  class="w-full flex items-center justify-between text-left cursor-pointer"
                  @click="showReservedList = !showReservedList"
                >
                  <span class="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                    <svg
                      class="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    {{
                      interpolate(adminT.gifts.reservationsWarning, {
                        count: String(selectedGiftsWithReservations.length),
                      })
                    }}
                  </span>
                  <svg
                    class="w-4 h-4 text-amber-600 transition-transform flex-shrink-0"
                    :class="showReservedList ? 'rotate-180' : ''"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <!-- Expandable List -->
                <ul v-if="showReservedList" class="mt-3 space-y-2">
                  <li
                    v-for="gift in selectedGiftsWithReservations"
                    :key="gift.id"
                    class="flex items-center justify-between py-2 px-3 bg-white dark:bg-dark-bg rounded text-sm"
                  >
                    <span class="text-charcoal dark:text-dark-text truncate">
                      {{ gift.name.en || gift.name.ms }}
                    </span>
                    <span class="text-amber-600 dark:text-amber-400 flex-shrink-0 ml-2">
                      {{
                        interpolate(adminT.gifts.reservationCount, {
                          count: String(gift.quantityReserved),
                        })
                      }}
                    </span>
                  </li>
                </ul>
              </div>

              <!-- No reservations message -->
              <p
                v-else
                class="text-sm text-charcoal-light dark:text-dark-text-secondary text-center py-2"
              >
                {{ adminT.gifts.noReservationsSelected }}
              </p>
            </div>

            <!-- Actions - stacked on mobile -->
            <div
              class="px-4 sm:px-6 py-4 border-t border-sand-dark dark:border-dark-border flex flex-col sm:flex-row-reverse gap-2 sm:gap-3"
            >
              <button
                type="button"
                class="w-full sm:w-auto min-h-[48px] sm:min-h-0 px-6 py-3 sm:py-2 font-body text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                :disabled="isBulkDeleting"
                @click="handleBulkDelete(false)"
              >
                {{ adminT.gifts.deleteAll }} ({{ selectedGiftIds.size }})
              </button>
              <button
                v-if="
                  selectedGiftsWithReservations.length > 0 &&
                  selectedGiftsWithReservations.length < selectedGiftIds.size
                "
                type="button"
                class="w-full sm:w-auto min-h-[48px] sm:min-h-0 px-6 py-3 sm:py-2 font-body text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                :disabled="isBulkDeleting"
                @click="handleBulkDelete(true)"
              >
                {{ adminT.gifts.deleteOnlyUnreserved }}
                ({{ selectedGiftIds.size - selectedGiftsWithReservations.length }})
              </button>
              <button
                type="button"
                class="w-full sm:w-auto min-h-[48px] sm:min-h-0 px-6 py-3 sm:py-2 font-body text-sm text-charcoal dark:text-dark-text border border-sand-dark dark:border-dark-border rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                :disabled="isBulkDeleting"
                @click="closeBulkDeleteModal"
              >
                {{ adminT.common.cancel }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Default Gift Browser Modal -->
    <DefaultGiftBrowser
      v-model="showDefaultBrowser"
      v-bind="weddingId ? { weddingId } : {}"
      :can-add-more="canAddMore"
      :max-items="settings.maxItems"
      :current-count="gifts.length"
      @gifts-added="handleDefaultGiftsAdded"
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

  /* Mobile: full-screen modal for better dropdown behavior */
  @media (max-width: 639px) {
    .modal-backdrop {
      padding: 0;
      align-items: stretch;
    }

    .modal-content {
      max-width: 100%;
      max-height: 100%;
      height: 100%;
      border-radius: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
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
