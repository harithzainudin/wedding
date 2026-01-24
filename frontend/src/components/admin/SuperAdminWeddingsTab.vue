<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  import { useSuperAdmin } from '@/composables/useSuperAdmin'
  import { useStaff } from '@/composables/useStaff'
  import { useToast } from '@/composables/useToast'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { setStoredPrimaryWeddingId } from '@/services/tokenManager'
  import HardDeleteConfirmModal from '@/components/admin/HardDeleteConfirmModal.vue'

  import type {
    CreateWeddingRequest,
    AddWeddingOwnerRequest,
    UpdateWeddingOwnerRequest,
    UpdateWeddingRequest,
    WeddingStatus,
    WeddingLimits,
  } from '@/types/admin'
  import { getWeddingLimits, updateWeddingLimits } from '@/services/api'

  const toast = useToast()
  const { adminT } = useAdminLanguage()

  // Staff for owner assignment
  const { staff: staffList, fetchStaff: fetchStaffList, isLoading: isLoadingStaff } = useStaff()

  const {
    weddings,
    selectedWedding,
    selectedWeddingAdmins,
    isLoading,
    isCreating,
    isUpdating,
    isHardDeleting,
    isLoadingPreview,
    deletionPreview,
    loadError,
    activeWeddings,
    archivedWeddings,
    totalWeddings,
    fetchWeddings,
    fetchWedding,
    createWedding,
    updateWedding,
    archiveWedding,
    addOwner,
    updateOwner,
    removeOwner,
    resetPassword,
    getDeletionPreview,
    hardDeleteWedding,
    clearDeletionPreview,
    clearSelectedWedding,
  } = useSuperAdmin()

  // Weddings search and filter state
  const weddingSearchQuery = ref('')
  const weddingFilter = ref<'all' | 'active' | 'archived' | 'draft'>('all')

  // Computed filtered weddings list
  const filteredWeddings = computed(() => {
    let result = weddings.value

    // Apply search filter
    if (weddingSearchQuery.value.trim()) {
      const query = weddingSearchQuery.value.toLowerCase().trim()
      result = result.filter(
        (wedding) =>
          wedding.displayName.toLowerCase().includes(query) ||
          wedding.slug.toLowerCase().includes(query) ||
          (wedding.ownerUsername?.toLowerCase().includes(query) ?? false) ||
          (wedding.ownerEmail?.toLowerCase().includes(query) ?? false)
      )
    }

    // Apply status filter
    if (weddingFilter.value !== 'all') {
      result = result.filter((wedding) => wedding.status === weddingFilter.value)
    }

    return result
  })

  // Filter counts for UI
  const weddingFilterCounts = computed(() => ({
    all: weddings.value.length,
    active: weddings.value.filter((w) => w.status === 'active').length,
    archived: weddings.value.filter((w) => w.status === 'archived').length,
    draft: weddings.value.filter((w) => w.status === 'draft').length,
  }))

  // Clear wedding search
  const clearWeddingSearch = () => {
    weddingSearchQuery.value = ''
  }

  // Clear all wedding filters (search and filter)
  const clearAllWeddingFilters = () => {
    weddingSearchQuery.value = ''
    weddingFilter.value = 'all'
  }

  // Modal state
  const showCreateModal = ref(false)
  const showArchiveConfirm = ref<string | null>(null)
  const showHardDeleteConfirm = ref<{
    weddingId: string
    slug: string
    displayName: string
  } | null>(null)
  const showDetailModal = ref(false)
  const showAddOwnerForm = ref(false)
  const showRemoveConfirm = ref<string | null>(null)
  const showResetConfirm = ref<string | null>(null)
  const temporaryPassword = ref<string | null>(null)
  const showSettingsModal = ref(false)

  // Settings form
  const settingsWedding = ref<{
    weddingId: string
    slug: string
    displayName: string
    weddingDate: string
    status: WeddingStatus
  } | null>(null)
  const isOpeningSettings = ref(false)
  const settingsCopyFeedback = ref<'public' | 'admin' | null>(null)

  // Wedding limits (super admin managed)
  const weddingLimits = ref<WeddingLimits | null>(null)
  const isLoadingLimits = ref(false)
  const isSavingLimits = ref(false)

  // Add owner form
  const addOwnerForm = ref<AddWeddingOwnerRequest>({
    username: '',
    password: '',
    email: '',
  })

  // Edit owner form
  const showEditOwner = ref<string | null>(null)
  const editOwnerForm = ref<UpdateWeddingOwnerRequest>({
    email: '',
    role: 'coowner',
  })

  // Loading state for opening detail modal
  const isOpeningDetail = ref(false)

  // Copy feedback
  const copyFeedback = ref(false)

  // Create wedding form - owner assignment mode
  type OwnerMode = 'staff' | 'client' | 'none'
  const createOwnerMode = ref<OwnerMode>('none')
  const createSelectedStaff = ref('')

  const createForm = ref<CreateWeddingRequest>({
    slug: '',
    displayName: '',
    weddingDate: '',
  })

  // Client owner form (when creating new client)
  const createClientForm = ref({
    username: '',
    password: '',
    email: '',
    roleLabel: '',
    customRole: '',
  })

  // Password visibility toggles
  const showCreateFormPassword = ref(false)
  const showAddOwnerPassword = ref(false)

  // Preset roles for clients
  const presetRoles = ['Bride', 'Groom', 'Parent', 'Other']

  // Generate slug from display name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Watch display name and auto-generate slug
  const onDisplayNameChange = (name: string) => {
    createForm.value.displayName = name
    createForm.value.slug = generateSlug(name)
  }

  // Validate and submit create form
  const handleCreateSubmit = async () => {
    // Validate wedding details
    if (!createForm.value.slug || createForm.value.slug.length < 3) {
      toast.error('Slug must be at least 3 characters')
      return
    }
    if (!createForm.value.displayName) {
      toast.error('Display name is required')
      return
    }

    // Validate owner based on mode (skip validation for 'none' mode)
    if (createOwnerMode.value === 'staff') {
      if (!createSelectedStaff.value) {
        toast.error('Please select a staff member')
        return
      }
    } else if (createOwnerMode.value === 'client') {
      if (!createClientForm.value.username || createClientForm.value.username.length < 3) {
        toast.error('Owner username must be at least 3 characters')
        return
      }
      if (!createClientForm.value.password || createClientForm.value.password.length < 8) {
        toast.error('Owner password must be at least 8 characters')
        return
      }
    }
    // 'none' mode: no owner validation needed

    // Build request based on mode
    const request: CreateWeddingRequest = {
      slug: createForm.value.slug,
      displayName: createForm.value.displayName,
      ...(createForm.value.weddingDate && { weddingDate: createForm.value.weddingDate }),
    }

    // Add owner fields based on mode (skip for 'none' mode)
    if (createOwnerMode.value === 'staff') {
      request.assignStaffUsername = createSelectedStaff.value
    } else if (createOwnerMode.value === 'client') {
      request.ownerUsername = createClientForm.value.username
      request.ownerPassword = createClientForm.value.password
      if (createClientForm.value.email) {
        request.ownerEmail = createClientForm.value.email
      }
      // Get final role label
      if (createClientForm.value.roleLabel) {
        request.roleLabel =
          createClientForm.value.roleLabel === 'Other'
            ? createClientForm.value.customRole
            : createClientForm.value.roleLabel
      }
    }
    // 'none' mode: no owner fields added - super admin will manage directly

    showCreateModal.value = false

    const result = await createWedding(request)
    if (!result.success) {
      showCreateModal.value = true
      toast.error(result.error ?? adminT.value.toast.genericError)
    } else {
      resetCreateForm()
      toast.success(adminT.value.toast.createSuccess)
    }
  }

  const resetCreateForm = () => {
    createForm.value = {
      slug: '',
      displayName: '',
      weddingDate: '',
    }
    createOwnerMode.value = 'none'
    createSelectedStaff.value = ''
    createClientForm.value = {
      username: '',
      password: '',
      email: '',
      roleLabel: '',
      customRole: '',
    }
    showCreateFormPassword.value = false
  }

  // Archive wedding
  const handleArchive = async (weddingId: string) => {
    showArchiveConfirm.value = null
    const result = await archiveWedding(weddingId)
    if (result.success) {
      toast.success(adminT.value.toast.archiveSuccess)
    } else {
      toast.error(result.error ?? adminT.value.toast.genericError)
    }
  }

  // Open hard delete modal
  const openHardDeleteModal = async (weddingId: string, slug: string, displayName: string) => {
    showHardDeleteConfirm.value = { weddingId, slug, displayName }
    await getDeletionPreview(weddingId)
  }

  // Close hard delete modal
  const closeHardDeleteModal = () => {
    showHardDeleteConfirm.value = null
    clearDeletionPreview()
  }

  // Handle hard delete confirmation
  const handleHardDelete = async () => {
    if (!showHardDeleteConfirm.value) return
    const weddingIdToDelete = showHardDeleteConfirm.value.weddingId
    showHardDeleteConfirm.value = null

    const result = await hardDeleteWedding(weddingIdToDelete)
    if (result.success) {
      toast.success(adminT.value.toast.deleteSuccess)
    } else {
      toast.error(result.error ?? adminT.value.toast.genericError)
    }
  }

  // Navigate to wedding admin
  const goToWeddingAdmin = (slug: string, weddingId: string) => {
    // Store the weddingId so admin tabs can access it
    setStoredPrimaryWeddingId(weddingId)
    window.open(`/wedding/${slug}/admin`, '_blank')
  }

  // Navigate to public wedding page
  const goToPublicPage = (slug: string) => {
    window.open(`/wedding/${slug}`, '_blank')
  }

  // Format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Open wedding detail modal
  const openDetailModal = async (weddingId: string) => {
    isOpeningDetail.value = true
    showDetailModal.value = true
    await fetchWedding(weddingId)
    isOpeningDetail.value = false
  }

  // Close detail modal
  const closeDetailModal = () => {
    showDetailModal.value = false
    showAddOwnerForm.value = false
    showRemoveConfirm.value = null
    showResetConfirm.value = null
    showEditOwner.value = null
    temporaryPassword.value = null
    copyFeedback.value = false
    resetAddOwnerForm()
    clearSelectedWedding()
  }

  // Close create modal
  const closeCreateModal = () => {
    showCreateModal.value = false
    resetCreateForm()
  }

  // Close archive confirm
  const closeArchiveConfirm = () => {
    showArchiveConfirm.value = null
  }

  // Cancel add owner form
  const cancelAddOwnerForm = () => {
    showAddOwnerForm.value = false
    resetAddOwnerForm()
  }

  // Get the currently active modal (for ESC handling)
  const getActiveModal = (): 'detail' | 'create' | 'archive' | 'settings' | null => {
    if (showSettingsModal.value) return 'settings'
    if (showDetailModal.value) return 'detail'
    if (showCreateModal.value) return 'create'
    if (showArchiveConfirm.value) return 'archive'
    return null
  }

  // Handle ESC key
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      const activeModal = getActiveModal()
      if (activeModal === 'settings') {
        closeSettingsModal()
      } else if (activeModal === 'detail') {
        closeDetailModal()
      } else if (activeModal === 'create') {
        closeCreateModal()
      } else if (activeModal === 'archive') {
        closeArchiveConfirm()
      }
    }
  }

  // Handle backdrop click (click outside modal to close)
  const handleBackdropClick = (event: MouseEvent, closeHandler: () => void) => {
    // Only close if clicked directly on backdrop, not on modal content
    if (event.target === event.currentTarget) {
      closeHandler()
    }
  }

  // Reset add owner form
  const resetAddOwnerForm = () => {
    addOwnerForm.value = {
      username: '',
      password: '',
      email: '',
    }
  }

  // Handle add owner submit
  const handleAddOwnerSubmit = async () => {
    if (!selectedWedding.value) return

    // Validate
    if (!addOwnerForm.value.username || addOwnerForm.value.username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }
    if (!addOwnerForm.value.password || addOwnerForm.value.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    const weddingId = selectedWedding.value.weddingId
    showAddOwnerForm.value = false

    const result = await addOwner(weddingId, addOwnerForm.value)
    if (result.success) {
      resetAddOwnerForm()
      toast.success(adminT.value.toast.addOwnerSuccess)
    } else {
      showAddOwnerForm.value = true
      toast.error(result.error ?? adminT.value.toast.genericError)
    }
  }

  // Handle remove owner
  const handleRemoveOwner = async (username: string) => {
    if (!selectedWedding.value) return

    const weddingId = selectedWedding.value.weddingId
    showRemoveConfirm.value = null

    const result = await removeOwner(weddingId, username)
    if (result.success) {
      toast.success(adminT.value.toast.removeOwnerSuccess)
    } else {
      toast.error(result.error ?? adminT.value.toast.genericError)
    }
  }

  // Handle reset password
  const handleResetPassword = async (username: string) => {
    if (!selectedWedding.value) return

    const weddingId = selectedWedding.value.weddingId
    showResetConfirm.value = null

    const result = await resetPassword(weddingId, username)
    if (result.success && result.temporaryPassword) {
      temporaryPassword.value = result.temporaryPassword
      toast.success(adminT.value.toast.resetPasswordSuccess)
    } else if (!result.success) {
      toast.error(result.error ?? adminT.value.toast.genericError)
    }
  }

  // Start editing an owner
  const startEditOwner = (username: string) => {
    const admin = selectedWeddingAdmins.value.find((a) => a.username === username)
    if (admin) {
      editOwnerForm.value = {
        email: admin.email ?? '',
        role: admin.role,
      }
      showEditOwner.value = username
    }
  }

  // Cancel edit owner
  const cancelEditOwner = () => {
    showEditOwner.value = null
    editOwnerForm.value = { email: '', role: 'coowner' }
  }

  // Handle edit owner submit
  const handleEditOwnerSubmit = async () => {
    if (!selectedWedding.value || !showEditOwner.value) return

    // Validate email if provided
    if (editOwnerForm.value.email && editOwnerForm.value.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editOwnerForm.value.email)) {
        toast.error('Invalid email format')
        return
      }
    }

    const result = await updateOwner(
      selectedWedding.value.weddingId,
      showEditOwner.value,
      editOwnerForm.value
    )
    if (result.success) {
      cancelEditOwner()
      toast.success(adminT.value.toast.updateSuccess)
    } else {
      toast.error(result.error ?? adminT.value.toast.genericError)
    }
  }

  // Copy to clipboard with feedback
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      copyFeedback.value = true
      setTimeout(() => {
        copyFeedback.value = false
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      copyFeedback.value = true
      setTimeout(() => {
        copyFeedback.value = false
      }, 2000)
    }
  }

  // Open settings modal
  const openSettingsModal = async (weddingId: string) => {
    const wedding = weddings.value.find((w) => w.weddingId === weddingId)
    if (wedding) {
      isOpeningSettings.value = true
      showSettingsModal.value = true
      settingsWedding.value = {
        weddingId: wedding.weddingId,
        slug: wedding.slug,
        displayName: wedding.displayName,
        weddingDate: wedding.weddingDate ?? '',
        status: wedding.status,
      }
      settingsCopyFeedback.value = null
      weddingLimits.value = null

      // Fetch wedding limits
      isLoadingLimits.value = true
      try {
        weddingLimits.value = await getWeddingLimits(weddingId)
      } catch (err) {
        console.error('Failed to fetch wedding limits:', err)
        // Set defaults if fetch fails
        weddingLimits.value = {
          gallery: { maxFileSize: 10 * 1024 * 1024, maxImages: 50, allowedFormats: [] },
          gifts: { maxItems: 50, maxFileSize: 5 * 1024 * 1024, allowedFormats: [] },
        }
      } finally {
        isLoadingLimits.value = false
        isOpeningSettings.value = false
      }
    }
  }

  // Close settings modal
  const closeSettingsModal = () => {
    showSettingsModal.value = false
    settingsWedding.value = null
    settingsCopyFeedback.value = null
    weddingLimits.value = null
  }

  // Handle settings form submit
  const handleSettingsSubmit = async () => {
    if (!settingsWedding.value) return

    // Validate
    if (!settingsWedding.value.displayName.trim()) {
      toast.error('Display name is required')
      return
    }

    const updateData: UpdateWeddingRequest = {
      displayName: settingsWedding.value.displayName.trim(),
      status: settingsWedding.value.status,
    }

    // Only include weddingDate if it has a value
    if (settingsWedding.value.weddingDate) {
      updateData.weddingDate = settingsWedding.value.weddingDate
    }

    // Update wedding details
    const result = await updateWedding(settingsWedding.value.weddingId, updateData)
    if (!result.success) {
      toast.error(result.error ?? adminT.value.toast.genericError)
      return
    }

    // Update limits if they exist
    if (weddingLimits.value) {
      isSavingLimits.value = true
      try {
        await updateWeddingLimits(settingsWedding.value.weddingId, {
          gallery: {
            maxFileSize: weddingLimits.value.gallery.maxFileSize,
            maxImages: weddingLimits.value.gallery.maxImages,
          },
          gifts: {
            maxItems: weddingLimits.value.gifts.maxItems,
            maxFileSize: weddingLimits.value.gifts.maxFileSize,
          },
        })
      } catch (err) {
        console.error('Failed to update limits:', err)
        toast.error(adminT.value.toast.genericError)
        isSavingLimits.value = false
        return
      }
      isSavingLimits.value = false
    }

    closeSettingsModal()
    toast.success(adminT.value.toast.updateSuccess)
  }

  // Copy URL with specific feedback
  const copySettingsUrl = async (url: string, type: 'public' | 'admin') => {
    try {
      await navigator.clipboard.writeText(url)
      settingsCopyFeedback.value = type
      setTimeout(() => {
        settingsCopyFeedback.value = null
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      settingsCopyFeedback.value = type
      setTimeout(() => {
        settingsCopyFeedback.value = null
      }, 2000)
    }
  }

  // Get full URL (for display and copy)
  const getPublicUrl = (slug: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/wedding/${slug}`
  }

  const getAdminUrl = (slug: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/wedding/${slug}/admin`
  }

  // Add keyboard listener for ESC key and fetch weddings
  onMounted(async () => {
    document.addEventListener('keydown', handleKeyDown)
    await fetchWeddings()
  })

  // Cleanup keyboard listener
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  // Fetch staff list when create modal opens
  watch(showCreateModal, (isOpen) => {
    if (isOpen && staffList.value.length === 0) {
      fetchStaffList()
    }
  })
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="font-heading text-xl font-bold text-charcoal dark:text-dark-text">
          Wedding Management
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          Create and manage wedding sites
        </p>
      </div>
      <button
        type="button"
        class="px-4 py-2 bg-sage text-white font-body text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        @click="showCreateModal = true"
      >
        + Create Wedding
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border border-sand-dark dark:border-dark-border"
      >
        <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
          Total
        </p>
        <p class="font-heading text-xl sm:text-3xl font-bold text-charcoal dark:text-dark-text">
          {{ totalWeddings }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border border-sand-dark dark:border-dark-border"
      >
        <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
          Active
        </p>
        <p class="font-heading text-xl sm:text-3xl font-bold text-green-600">
          {{ activeWeddings.length }}
        </p>
      </div>
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border border-sand-dark dark:border-dark-border"
      >
        <p class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary">
          Archived
        </p>
        <p
          class="font-heading text-xl sm:text-3xl font-bold text-charcoal-light dark:text-dark-text-secondary"
        >
          {{ archivedWeddings.length }}
        </p>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="mb-6 space-y-4">
      <!-- Search Input -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            class="w-5 h-5 text-charcoal-light dark:text-dark-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          v-model="weddingSearchQuery"
          type="text"
          class="w-full pl-10 pr-10 py-2.5 border border-sand-dark dark:border-dark-border rounded-lg font-body text-sm text-charcoal dark:text-dark-text bg-white dark:bg-dark-bg-secondary focus:ring-2 focus:ring-sage focus:border-sage"
          :placeholder="adminT.superAdmin.searchPlaceholder"
        />
        <button
          v-if="weddingSearchQuery"
          type="button"
          class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text"
          @click="clearWeddingSearch"
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

      <!-- Filter Buttons -->
      <div class="flex gap-2 flex-wrap">
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="
            weddingFilter === 'all'
              ? 'bg-sage text-white'
              : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'
          "
          @click="weddingFilter = 'all'"
        >
          {{ adminT.superAdmin.filterAll }} ({{ weddingFilterCounts.all }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="
            weddingFilter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'
          "
          @click="weddingFilter = 'active'"
        >
          {{ adminT.superAdmin.filterActive }} ({{ weddingFilterCounts.active }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="
            weddingFilter === 'archived'
              ? 'bg-charcoal-light text-white'
              : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'
          "
          @click="weddingFilter = 'archived'"
        >
          {{ adminT.superAdmin.filterArchived }} ({{ weddingFilterCounts.archived }})
        </button>
        <button
          v-if="weddingFilterCounts.draft > 0"
          type="button"
          class="px-3 py-1.5 font-body text-sm rounded-full transition-colors cursor-pointer"
          :class="
            weddingFilter === 'draft'
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-border'
          "
          @click="weddingFilter = 'draft'"
        >
          {{ adminT.superAdmin.filterDraft }} ({{ weddingFilterCounts.draft }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-red-500 mb-4">{{ loadError }}</p>
      <button
        type="button"
        class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
        @click="fetchWeddings"
      >
        Retry
      </button>
    </div>

    <!-- Weddings Table -->
    <div
      v-else
      class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-sand-dark dark:border-dark-border overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-sand-dark dark:border-dark-border">
        <h2 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
          All Weddings
        </h2>
      </div>

      <!-- Empty State - No weddings at all -->
      <div v-if="weddings.length === 0" class="p-8 text-center">
        <p class="font-body text-charcoal-light dark:text-dark-text-secondary mb-4">
          No weddings created yet
        </p>
        <button
          type="button"
          class="px-4 py-2 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark cursor-pointer"
          @click="showCreateModal = true"
        >
          Create Your First Wedding
        </button>
      </div>

      <!-- No Results State - Weddings exist but filtered results are empty -->
      <div v-else-if="filteredWeddings.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-4">🔍</div>
        <p class="font-body text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.superAdmin.noResults }}
        </p>
        <button
          v-if="weddingSearchQuery || weddingFilter !== 'all'"
          type="button"
          class="mt-4 px-4 py-2 text-sage hover:text-sage-dark font-body text-sm cursor-pointer"
          @click="clearAllWeddingFilters"
        >
          {{ adminT.common.clearFilters }}
        </button>
      </div>

      <!-- Wedding List (Mobile + Desktop) -->
      <div v-else>
        <!-- Mobile Card View -->
        <div class="sm:hidden divide-y divide-sand-dark dark:divide-dark-border">
          <div
            v-for="wedding in filteredWeddings"
            :key="wedding.weddingId"
            class="p-4 hover:bg-sand/30 dark:hover:bg-dark-bg-elevated"
          >
            <!-- Top row: Name + Status -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="min-w-0 flex-1">
                <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                  {{ wedding.displayName }}
                </p>
                <code class="font-mono text-xs text-sage">{{ wedding.slug }}</code>
              </div>
              <span
                class="px-2 py-0.5 font-body text-xs font-medium rounded-full flex-shrink-0"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                    wedding.status === 'active',
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400':
                    wedding.status === 'archived',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                    wedding.status === 'draft',
                }"
              >
                {{ wedding.status }}
              </span>
            </div>

            <!-- Info row -->
            <div
              class="flex items-center gap-4 text-xs text-charcoal-light dark:text-dark-text-secondary mb-3"
            >
              <span v-if="wedding.ownerUsername">{{ wedding.ownerUsername }}</span>
              <span>{{ formatDate(wedding.weddingDate) }}</span>
              <span>Created: {{ formatDate(wedding.createdAt) }}</span>
            </div>

            <!-- Actions row -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="p-2 text-charcoal-light hover:text-sage dark:text-dark-text-secondary dark:hover:text-sage transition-colors cursor-pointer"
                title="View Public Page"
                @click="goToPublicPage(wedding.slug)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="p-2 text-charcoal-light hover:text-sage dark:text-dark-text-secondary dark:hover:text-sage transition-colors cursor-pointer"
                title="Open Admin Panel"
                @click="goToWeddingAdmin(wedding.slug, wedding.weddingId)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="p-2 text-charcoal-light hover:text-sage dark:text-dark-text-secondary dark:hover:text-sage transition-colors cursor-pointer"
                title="Wedding Settings"
                @click="openSettingsModal(wedding.weddingId)"
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
              </button>
              <button
                type="button"
                class="p-2 text-charcoal-light hover:text-amber-500 dark:text-dark-text-secondary dark:hover:text-amber-400 transition-colors cursor-pointer"
                title="Manage Users"
                @click="openDetailModal(wedding.weddingId)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </button>
              <button
                v-if="wedding.status === 'active'"
                type="button"
                class="p-2 text-charcoal-light hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors cursor-pointer"
                title="Archive Wedding"
                @click="showArchiveConfirm = wedding.weddingId"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </button>
              <button
                v-if="wedding.status === 'archived'"
                type="button"
                class="p-2 text-charcoal-light hover:text-red-600 dark:text-dark-text-secondary dark:hover:text-red-500 transition-colors cursor-pointer"
                title="Permanently Delete"
                @click="openHardDeleteModal(wedding.weddingId, wedding.slug, wedding.displayName)"
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

        <!-- Desktop Table View -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-sand/50 dark:bg-dark-bg">
              <tr>
                <th
                  class="px-6 py-3 text-left font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
                >
                  Wedding
                </th>
                <th
                  class="px-6 py-3 text-left font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
                >
                  Slug
                </th>
                <th
                  class="px-6 py-3 text-left font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
                >
                  Owner
                </th>
                <th
                  class="px-6 py-3 text-left font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  class="px-6 py-3 text-left font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  class="px-6 py-3 text-left font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-sand-dark dark:divide-dark-border">
              <tr
                v-for="wedding in filteredWeddings"
                :key="wedding.weddingId"
                class="hover:bg-sand/30 dark:hover:bg-dark-bg-elevated"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text">
                    {{ wedding.displayName }}
                  </p>
                  <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                    {{ wedding.weddingId.slice(0, 8) }}...
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <code class="font-mono text-sm text-sage bg-sage/10 px-2 py-1 rounded">{{
                    wedding.slug
                  }}</code>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <p class="font-body text-sm text-charcoal dark:text-dark-text">
                    {{ wedding.ownerUsername || '-' }}
                  </p>
                  <p
                    v-if="wedding.ownerEmail"
                    class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                  >
                    {{ wedding.ownerEmail }}
                  </p>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap font-body text-sm text-charcoal dark:text-dark-text"
                >
                  {{ formatDate(wedding.weddingDate) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ formatDate(wedding.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 font-body text-xs font-medium rounded-full"
                    :class="{
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                        wedding.status === 'active',
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400':
                        wedding.status === 'archived',
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                        wedding.status === 'draft',
                    }"
                  >
                    {{ wedding.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="p-2 text-charcoal-light hover:text-sage dark:text-dark-text-secondary dark:hover:text-sage transition-colors cursor-pointer"
                      title="View Public Page"
                      @click="goToPublicPage(wedding.slug)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="p-2 text-charcoal-light hover:text-sage dark:text-dark-text-secondary dark:hover:text-sage transition-colors cursor-pointer"
                      title="Open Admin Panel"
                      @click="goToWeddingAdmin(wedding.slug, wedding.weddingId)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="p-2 text-charcoal-light hover:text-sage dark:text-dark-text-secondary dark:hover:text-sage transition-colors cursor-pointer"
                      title="Wedding Settings"
                      @click="openSettingsModal(wedding.weddingId)"
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
                    </button>
                    <button
                      type="button"
                      class="p-2 text-charcoal-light hover:text-amber-500 dark:text-dark-text-secondary dark:hover:text-amber-400 transition-colors cursor-pointer"
                      title="Manage Users"
                      @click="openDetailModal(wedding.weddingId)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="wedding.status === 'active'"
                      type="button"
                      class="p-2 text-charcoal-light hover:text-red-500 dark:text-dark-text-secondary dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Archive Wedding"
                      @click="showArchiveConfirm = wedding.weddingId"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                    </button>
                    <!-- Permanently Delete Button (only for archived weddings) -->
                    <button
                      v-if="wedding.status === 'archived'"
                      type="button"
                      class="p-2 text-charcoal-light hover:text-red-600 dark:text-dark-text-secondary dark:hover:text-red-500 transition-colors cursor-pointer"
                      title="Permanently Delete"
                      @click="
                        openHardDeleteModal(wedding.weddingId, wedding.slug, wedding.displayName)
                      "
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Wedding Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click="handleBackdropClick($event, closeCreateModal)"
        >
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
            appear
          >
            <div
              class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div
                class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between"
              >
                <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                  Create New Wedding
                </h3>
                <button
                  type="button"
                  class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                  title="Close (ESC)"
                  @click="closeCreateModal"
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
              <form class="p-6 space-y-4" @submit.prevent="handleCreateSubmit">
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    Display Name *
                  </label>
                  <input
                    type="text"
                    :value="createForm.displayName"
                    placeholder="e.g., Ahmad & Sarah"
                    class="w-full px-4 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                    @input="onDisplayNameChange(($event.target as HTMLInputElement).value)"
                  />
                </div>
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    URL Slug *
                  </label>
                  <input
                    v-model="createForm.slug"
                    type="text"
                    placeholder="e.g., ahmad-sarah"
                    class="w-full px-4 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                  />
                  <p
                    class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                  >
                    URL: yoursite.com/<span class="text-sage">{{ createForm.slug || 'slug' }}</span>
                  </p>
                </div>
                <div>
                  <label
                    class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                  >
                    Wedding Date
                  </label>
                  <input
                    v-model="createForm.weddingDate"
                    type="date"
                    class="w-full px-4 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                  />
                </div>
                <!-- Owner Assignment Section -->
                <div class="pt-4 border-t border-sand-dark dark:border-dark-border">
                  <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
                    Assign Owner
                  </p>

                  <!-- Owner Type Tabs -->
                  <div class="flex gap-2 border-b border-sand-dark dark:border-dark-border mb-4">
                    <button
                      type="button"
                      class="px-4 py-2 font-body text-sm font-medium transition-colors cursor-pointer -mb-px"
                      :class="
                        createOwnerMode === 'none'
                          ? 'text-sage border-b-2 border-sage'
                          : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
                      "
                      @click="createOwnerMode = 'none'"
                    >
                      {{ adminT.staff.noAssignment }}
                    </button>
                    <button
                      type="button"
                      class="px-4 py-2 font-body text-sm font-medium transition-colors cursor-pointer -mb-px"
                      :class="
                        createOwnerMode === 'staff'
                          ? 'text-sage border-b-2 border-sage'
                          : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
                      "
                      @click="createOwnerMode = 'staff'"
                    >
                      {{ adminT.staff.assignStaff }}
                    </button>
                    <button
                      type="button"
                      class="px-4 py-2 font-body text-sm font-medium transition-colors cursor-pointer -mb-px"
                      :class="
                        createOwnerMode === 'client'
                          ? 'text-sage border-b-2 border-sage'
                          : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
                      "
                      @click="createOwnerMode = 'client'"
                    >
                      {{ adminT.staff.createClient }}
                    </button>
                  </div>

                  <!-- No Assignment Info -->
                  <div
                    v-if="createOwnerMode === 'none'"
                    class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <p class="font-body text-sm text-blue-700 dark:text-blue-300">
                      {{ adminT.staff.noAssignmentDesc }}
                    </p>
                  </div>

                  <!-- Staff Selection -->
                  <div v-else-if="createOwnerMode === 'staff'" class="space-y-3">
                    <div>
                      <label
                        class="block font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-1"
                      >
                        Select Staff Member *
                      </label>
                      <div v-if="isLoadingStaff" class="flex items-center gap-2 py-2">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-sage"></div>
                        <span
                          class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
                        >
                          Loading staff...
                        </span>
                      </div>
                      <select
                        v-else
                        v-model="createSelectedStaff"
                        class="w-full px-4 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                      >
                        <option value="">Choose a staff member...</option>
                        <option
                          v-for="member in staffList"
                          :key="member.username"
                          :value="member.username"
                        >
                          {{ member.username }}
                          <template v-if="member.email"> ({{ member.email }}) </template>
                        </option>
                      </select>
                    </div>
                    <div
                      v-if="staffList.length === 0 && !isLoadingStaff"
                      class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
                    >
                      <p class="font-body text-sm text-amber-700 dark:text-amber-300">
                        No staff members yet. Create staff first in the Staff tab, or switch to
                        "Create Client" to create a new user.
                      </p>
                    </div>
                  </div>

                  <!-- Client Creation Form -->
                  <div v-else-if="createOwnerMode === 'client'" class="space-y-3">
                    <div>
                      <label
                        class="block font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-1"
                      >
                        Username *
                      </label>
                      <input
                        v-model="createClientForm.username"
                        type="text"
                        placeholder="e.g., ahmad"
                        class="w-full px-4 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                      />
                    </div>
                    <div>
                      <label
                        class="block font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-1"
                      >
                        Email (optional)
                      </label>
                      <input
                        v-model="createClientForm.email"
                        type="email"
                        placeholder="owner@email.com"
                        class="w-full px-4 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                      />
                    </div>
                    <div>
                      <label
                        class="block font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-1"
                      >
                        Password *
                      </label>
                      <div class="relative">
                        <input
                          v-model="createClientForm.password"
                          :type="showCreateFormPassword ? 'text' : 'password'"
                          placeholder="Min. 8 characters"
                          class="w-full px-4 py-2 pr-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                        />
                        <button
                          type="button"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer"
                          @click="showCreateFormPassword = !showCreateFormPassword"
                        >
                          <svg
                            v-if="showCreateFormPassword"
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                            />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                          <svg
                            v-else
                            class="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label
                        class="block font-body text-sm text-charcoal-light dark:text-dark-text-secondary mb-1"
                      >
                        Role (optional)
                      </label>
                      <div class="flex flex-wrap gap-2 mb-2">
                        <button
                          v-for="role in presetRoles"
                          :key="role"
                          type="button"
                          class="px-3 py-1.5 text-sm font-body rounded-full border transition-colors cursor-pointer"
                          :class="
                            createClientForm.roleLabel === role
                              ? 'bg-sage text-white border-sage'
                              : 'border-sand-dark dark:border-dark-border text-charcoal-light dark:text-dark-text-secondary hover:border-sage hover:text-sage'
                          "
                          @click="createClientForm.roleLabel = role"
                        >
                          {{ role }}
                        </button>
                      </div>
                      <input
                        v-if="createClientForm.roleLabel === 'Other'"
                        v-model="createClientForm.customRole"
                        type="text"
                        placeholder="e.g., Wedding Planner"
                        class="w-full px-4 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                      />
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    class="px-4 py-2 font-body text-sm font-medium bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                    @click="closeCreateModal"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isCreating"
                    class="px-4 py-2 font-body text-sm font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {{ isCreating ? 'Creating...' : 'Create Wedding' }}
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Archive Confirmation Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showArchiveConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click="handleBackdropClick($event, closeArchiveConfirm)"
        >
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
            appear
          >
            <div class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-sm w-full">
              <div class="p-6">
                <div class="flex items-start gap-4">
                  <div
                    class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                  >
                    <svg
                      class="w-5 h-5 text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <h3
                      class="font-heading text-lg font-medium text-charcoal dark:text-dark-text mb-1"
                    >
                      Archive Wedding?
                    </h3>
                    <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                      This will hide the wedding from public view. You can restore it later.
                    </p>
                  </div>
                </div>
                <div class="flex items-center justify-between mt-6">
                  <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                    Press
                    <kbd
                      class="px-1.5 py-0.5 text-xs bg-sand dark:bg-dark-bg rounded border border-sand-dark dark:border-dark-border font-mono"
                      >ESC</kbd
                    >
                    to close
                  </p>
                  <div class="flex gap-3">
                    <button
                      type="button"
                      class="px-4 py-2 font-body text-sm font-medium bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                      @click="closeArchiveConfirm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="px-4 py-2 font-body text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                      @click="handleArchive(showArchiveConfirm)"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Wedding Detail / User Management Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showDetailModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click="handleBackdropClick($event, closeDetailModal)"
        >
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
            appear
          >
            <div
              class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <!-- Loading State -->
              <template v-if="isOpeningDetail">
                <div class="p-12 flex flex-col items-center justify-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage mb-4"></div>
                  <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                    Loading wedding details...
                  </p>
                </div>
              </template>

              <!-- Content (when loaded) -->
              <template v-else-if="selectedWedding">
                <!-- Header -->
                <div
                  class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between sticky top-0 bg-white dark:bg-dark-bg-secondary z-10"
                >
                  <div>
                    <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                      {{ selectedWedding.displayName }}
                    </h3>
                    <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                      User Management
                    </p>
                  </div>
                  <button
                    type="button"
                    class="p-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                    title="Close (ESC)"
                    @click="closeDetailModal"
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

                <!-- Content -->
                <div class="p-6 space-y-6">
                  <!-- Wedding Info -->
                  <div class="grid grid-cols-2 gap-4 p-4 bg-sand/50 dark:bg-dark-bg rounded-lg">
                    <div>
                      <p
                        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                      >
                        Slug
                      </p>
                      <code class="font-mono text-sm text-sage">{{ selectedWedding.slug }}</code>
                    </div>
                    <div>
                      <p
                        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                      >
                        Status
                      </p>
                      <span
                        class="px-2 py-0.5 font-body text-xs font-medium rounded-full inline-block"
                        :class="{
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                            selectedWedding.status === 'active',
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400':
                            selectedWedding.status === 'archived',
                        }"
                      >
                        {{ selectedWedding.status }}
                      </span>
                    </div>
                    <div>
                      <p
                        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                      >
                        Wedding Date
                      </p>
                      <p class="font-body text-sm text-charcoal dark:text-dark-text">
                        {{ formatDate(selectedWedding.weddingDate) }}
                      </p>
                    </div>
                    <div>
                      <p
                        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                      >
                        Plan
                      </p>
                      <p class="font-body text-sm text-charcoal dark:text-dark-text capitalize">
                        {{ selectedWedding.plan }}
                      </p>
                    </div>
                  </div>

                  <!-- Temporary Password Display -->
                  <Transition
                    enter-active-class="transition-all duration-300 ease-out"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                  >
                    <div
                      v-if="temporaryPassword"
                      class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <div class="flex items-center gap-2 mb-2">
                        <svg
                          class="w-5 h-5 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p class="font-body text-sm font-medium text-green-700 dark:text-green-300">
                          Password Reset Successful
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        <code
                          class="flex-1 px-3 py-2 bg-white dark:bg-dark-bg rounded font-mono text-sm text-charcoal dark:text-dark-text select-all"
                        >
                          {{ temporaryPassword }}
                        </code>
                        <button
                          type="button"
                          class="px-3 py-2 font-body text-sm rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                          :class="
                            copyFeedback
                              ? 'bg-green-700 text-white'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          "
                          @click="copyToClipboard(temporaryPassword)"
                        >
                          <svg
                            v-if="copyFeedback"
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <svg
                            v-else
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          {{ copyFeedback ? 'Copied!' : 'Copy' }}
                        </button>
                      </div>
                      <p class="font-body text-xs text-green-600 dark:text-green-400 mt-2">
                        User must change this password on next login.
                      </p>
                    </div>
                  </Transition>

                  <!-- Admins List -->
                  <div>
                    <div class="flex items-center justify-between mb-3">
                      <h4
                        class="font-heading text-base font-medium text-charcoal dark:text-dark-text"
                      >
                        Wedding Admins ({{ selectedWeddingAdmins.length }})
                      </h4>
                      <button
                        type="button"
                        class="px-3 py-1.5 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
                        @click="showAddOwnerForm = true"
                      >
                        + Add Admin
                      </button>
                    </div>

                    <!-- Add Owner Form -->
                    <div
                      v-if="showAddOwnerForm"
                      class="mb-4 p-4 bg-sand/50 dark:bg-dark-bg rounded-lg border border-sand-dark dark:border-dark-border"
                    >
                      <h5
                        class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3"
                      >
                        Add New Admin
                      </h5>
                      <form class="space-y-3" @submit.prevent="handleAddOwnerSubmit">
                        <div>
                          <label
                            class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                            >Username *</label
                          >
                          <input
                            v-model="addOwnerForm.username"
                            type="text"
                            placeholder="Min 3 characters"
                            class="w-full px-3 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                          />
                        </div>
                        <div>
                          <label
                            class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                            >Password *</label
                          >
                          <div class="relative">
                            <input
                              v-model="addOwnerForm.password"
                              :type="showAddOwnerPassword ? 'text' : 'password'"
                              placeholder="Min 8 characters"
                              class="w-full px-3 py-2 pr-10 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                            />
                            <button
                              type="button"
                              class="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer"
                              @click="showAddOwnerPassword = !showAddOwnerPassword"
                            >
                              <svg
                                v-if="showAddOwnerPassword"
                                class="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path
                                  d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                                />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                              <svg
                                v-else
                                class="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label
                            class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                            >Email (optional)</label
                          >
                          <input
                            v-model="addOwnerForm.email"
                            type="email"
                            placeholder="user@email.com"
                            class="w-full px-3 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                          />
                        </div>
                        <div class="flex justify-end gap-2">
                          <button
                            type="button"
                            class="px-3 py-1.5 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated rounded-lg transition-colors cursor-pointer"
                            @click="cancelAddOwnerForm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            :disabled="isUpdating"
                            class="px-3 py-1.5 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {{ isUpdating ? 'Adding...' : 'Add Admin' }}
                          </button>
                        </div>
                      </form>
                    </div>

                    <!-- Admin List -->
                    <div class="space-y-2">
                      <div
                        v-for="admin in selectedWeddingAdmins"
                        :key="admin.username"
                        class="p-3 bg-white dark:bg-dark-bg rounded-lg border border-sand-dark dark:border-dark-border"
                      >
                        <!-- Edit Form (when editing this admin) -->
                        <template v-if="showEditOwner === admin.username">
                          <form class="space-y-3" @submit.prevent="handleEditOwnerSubmit">
                            <div class="flex items-center gap-2 mb-2">
                              <p
                                class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
                              >
                                Editing: {{ admin.username }}
                              </p>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                              <div>
                                <label
                                  class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                                  >Email</label
                                >
                                <input
                                  v-model="editOwnerForm.email"
                                  type="email"
                                  placeholder="user@email.com"
                                  class="w-full px-3 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
                                />
                              </div>
                              <div>
                                <label
                                  class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                                  >Role</label
                                >
                                <select
                                  v-model="editOwnerForm.role"
                                  class="w-full px-3 py-2 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg-secondary text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 cursor-pointer"
                                >
                                  <option value="owner">Owner</option>
                                  <option value="coowner">Co-owner</option>
                                </select>
                              </div>
                            </div>
                            <div class="flex justify-end gap-2">
                              <button
                                type="button"
                                class="px-3 py-1.5 font-body text-sm text-charcoal dark:text-dark-text hover:bg-sand-dark dark:hover:bg-dark-bg-elevated rounded-lg transition-colors cursor-pointer"
                                @click="cancelEditOwner"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                :disabled="isUpdating"
                                class="px-3 py-1.5 bg-sage text-white font-body text-sm rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {{ isUpdating ? 'Saving...' : 'Save Changes' }}
                              </button>
                            </div>
                          </form>
                        </template>

                        <!-- Normal View (when not editing) -->
                        <template v-else>
                          <div class="flex items-center justify-between">
                            <div>
                              <p
                                class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
                              >
                                {{ admin.username }}
                                <span
                                  class="ml-2 px-1.5 py-0.5 text-xs rounded"
                                  :class="{
                                    'bg-sage/20 text-sage': admin.role === 'owner',
                                    'bg-charcoal-light/20 text-charcoal-light dark:text-dark-text-secondary':
                                      admin.role === 'coowner',
                                  }"
                                >
                                  {{ admin.role }}
                                </span>
                              </p>
                              <p
                                v-if="admin.email"
                                class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                              >
                                {{ admin.email }}
                              </p>
                              <p
                                v-else
                                class="font-body text-xs text-charcoal-light/50 dark:text-dark-text-secondary/50 italic"
                              >
                                No email set
                              </p>
                            </div>
                            <div class="flex items-center gap-2">
                              <!-- Edit Button -->
                              <button
                                type="button"
                                class="px-2 py-1 font-body text-xs text-sage border border-sage rounded hover:bg-sage hover:text-white transition-colors cursor-pointer"
                                @click="startEditOwner(admin.username)"
                              >
                                Edit
                              </button>

                              <!-- Reset Password -->
                              <template v-if="showResetConfirm !== admin.username">
                                <button
                                  type="button"
                                  class="px-2 py-1 font-body text-xs text-amber-600 dark:text-amber-400 border border-amber-600 dark:border-amber-400 rounded hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition-colors cursor-pointer"
                                  @click="showResetConfirm = admin.username"
                                >
                                  Reset Password
                                </button>
                              </template>
                              <template v-else>
                                <span
                                  class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                                  >Reset?</span
                                >
                                <button
                                  type="button"
                                  :disabled="isUpdating"
                                  class="px-2 py-1 font-body text-xs text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
                                  @click="handleResetPassword(admin.username)"
                                >
                                  {{ isUpdating ? '...' : 'Yes' }}
                                </button>
                                <button
                                  type="button"
                                  class="px-2 py-1 font-body text-xs text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                                  @click="showResetConfirm = null"
                                >
                                  No
                                </button>
                              </template>

                              <!-- Remove (only if more than 1 admin) -->
                              <template v-if="selectedWeddingAdmins.length > 1">
                                <template v-if="showRemoveConfirm !== admin.username">
                                  <button
                                    type="button"
                                    class="px-2 py-1 font-body text-xs text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-colors cursor-pointer"
                                    @click="showRemoveConfirm = admin.username"
                                  >
                                    Remove
                                  </button>
                                </template>
                                <template v-else>
                                  <span
                                    class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                                    >Remove?</span
                                  >
                                  <button
                                    type="button"
                                    :disabled="isUpdating"
                                    class="px-2 py-1 font-body text-xs text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                                    @click="handleRemoveOwner(admin.username)"
                                  >
                                    {{ isUpdating ? '...' : 'Yes' }}
                                  </button>
                                  <button
                                    type="button"
                                    class="px-2 py-1 font-body text-xs text-charcoal dark:text-dark-text border border-charcoal-light dark:border-dark-border rounded hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                                    @click="showRemoveConfirm = null"
                                  >
                                    No
                                  </button>
                                </template>
                              </template>
                            </div>
                          </div>
                        </template>
                      </div>

                      <div v-if="selectedWeddingAdmins.length === 0" class="p-4 text-center">
                        <p
                          class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary"
                        >
                          No admins assigned to this wedding yet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div
                  class="px-6 py-4 border-t border-sand-dark dark:border-dark-border sticky bottom-0 bg-white dark:bg-dark-bg-secondary"
                >
                  <div class="flex items-center justify-between">
                    <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                      Press
                      <kbd
                        class="px-1.5 py-0.5 text-xs bg-sand dark:bg-dark-bg rounded border border-sand-dark dark:border-dark-border font-mono"
                        >ESC</kbd
                      >
                      to close
                    </p>
                    <button
                      type="button"
                      class="px-4 py-2 font-body text-sm font-medium bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                      @click="closeDetailModal"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Hard Delete Confirmation Modal -->
    <Teleport to="body">
      <HardDeleteConfirmModal
        :show="!!showHardDeleteConfirm"
        :wedding-slug="showHardDeleteConfirm?.slug ?? ''"
        :wedding-name="showHardDeleteConfirm?.displayName ?? ''"
        :preview="deletionPreview"
        :is-loading="isLoadingPreview"
        :is-deleting="isHardDeleting"
        @confirm="handleHardDelete"
        @cancel="closeHardDeleteModal"
      />
    </Teleport>

    <!-- Wedding Settings Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSettingsModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click="handleBackdropClick($event, closeSettingsModal)"
        >
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-4"
            appear
          >
            <div
              class="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <!-- Loading State -->
              <template v-if="isOpeningSettings">
                <div class="p-12 flex flex-col items-center justify-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage mb-4"></div>
                  <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                    Loading settings...
                  </p>
                </div>
              </template>

              <!-- Content (when loaded) -->
              <template v-else-if="settingsWedding">
                <!-- Header -->
                <div
                  class="px-6 py-4 border-b border-sand-dark dark:border-dark-border flex items-center justify-between sticky top-0 bg-white dark:bg-dark-bg-secondary z-10"
                >
                  <div>
                    <h3 class="font-heading text-lg font-medium text-charcoal dark:text-dark-text">
                      Wedding Settings
                    </h3>
                    <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                      Edit wedding details
                    </p>
                  </div>
                  <button
                    type="button"
                    class="p-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text rounded-lg hover:bg-sand dark:hover:bg-dark-bg transition-colors cursor-pointer"
                    title="Close (ESC)"
                    @click="closeSettingsModal"
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

                <!-- Content -->
                <form class="p-6 space-y-6" @submit.prevent="handleSettingsSubmit">
                  <!-- Read-only Info Section -->
                  <div class="p-4 bg-sand/50 dark:bg-dark-bg rounded-lg space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <p
                          class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                        >
                          Wedding ID
                        </p>
                        <code
                          class="font-mono text-xs text-charcoal dark:text-dark-text select-all"
                          >{{ settingsWedding.weddingId }}</code
                        >
                      </div>
                    </div>
                    <div>
                      <p
                        class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                      >
                        URL Slug
                      </p>
                      <code class="font-mono text-sm text-sage">{{ settingsWedding.slug }}</code>
                      <p
                        class="font-body text-xs text-charcoal-light/70 dark:text-dark-text-secondary/70 mt-1"
                      >
                        Slug cannot be changed after creation
                      </p>
                    </div>
                  </div>

                  <!-- Editable Fields -->
                  <div class="space-y-4">
                    <div>
                      <label
                        class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                      >
                        Display Name *
                      </label>
                      <input
                        v-model="settingsWedding.displayName"
                        type="text"
                        placeholder="e.g., Ahmad & Sarah"
                        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 transition-shadow"
                      />
                    </div>

                    <div>
                      <label
                        class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                      >
                        Wedding Date
                      </label>
                      <input
                        v-model="settingsWedding.weddingDate"
                        type="date"
                        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 transition-shadow"
                      />
                    </div>

                    <div>
                      <label
                        class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
                      >
                        Status
                      </label>
                      <select
                        v-model="settingsWedding.status"
                        class="w-full px-4 py-2.5 rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text font-body text-sm focus:outline-none focus:ring-2 focus:ring-sage/50 transition-shadow cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                      <p
                        class="mt-1 font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                      >
                        <span v-if="settingsWedding.status === 'active'"
                          >Wedding is visible to the public</span
                        >
                        <span v-else-if="settingsWedding.status === 'draft'"
                          >Wedding is hidden, visible only to admins</span
                        >
                        <span v-else>Wedding is archived and hidden from view</span>
                      </p>
                    </div>
                  </div>

                  <!-- Quick Links Section -->
                  <div class="border-t border-sand-dark dark:border-dark-border pt-4">
                    <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text mb-3">
                      Quick Links
                    </p>
                    <div class="space-y-3">
                      <!-- Public URL -->
                      <div
                        class="flex items-center gap-2 p-3 bg-sand/50 dark:bg-dark-bg rounded-lg"
                      >
                        <div class="flex-1 min-w-0">
                          <p
                            class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-0.5"
                          >
                            Public Page
                          </p>
                          <p
                            class="font-mono text-xs text-sage truncate"
                            :title="getPublicUrl(settingsWedding.slug)"
                          >
                            {{ getPublicUrl(settingsWedding.slug) }}
                          </p>
                        </div>
                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            class="p-2 rounded-lg transition-all cursor-pointer"
                            :class="
                              settingsCopyFeedback === 'public'
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'hover:bg-sand-dark dark:hover:bg-dark-bg-elevated text-charcoal-light dark:text-dark-text-secondary'
                            "
                            :title="settingsCopyFeedback === 'public' ? 'Copied!' : 'Copy URL'"
                            @click="copySettingsUrl(getPublicUrl(settingsWedding.slug), 'public')"
                          >
                            <svg
                              v-if="settingsCopyFeedback === 'public'"
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <svg
                              v-else
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="p-2 rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated text-charcoal-light dark:text-dark-text-secondary transition-colors cursor-pointer"
                            title="Open in new tab"
                            @click="goToPublicPage(settingsWedding.slug)"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <!-- Admin URL -->
                      <div
                        class="flex items-center gap-2 p-3 bg-sand/50 dark:bg-dark-bg rounded-lg"
                      >
                        <div class="flex-1 min-w-0">
                          <p
                            class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-0.5"
                          >
                            Admin Panel
                          </p>
                          <p
                            class="font-mono text-xs text-sage truncate"
                            :title="getAdminUrl(settingsWedding.slug)"
                          >
                            {{ getAdminUrl(settingsWedding.slug) }}
                          </p>
                        </div>
                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            class="p-2 rounded-lg transition-all cursor-pointer"
                            :class="
                              settingsCopyFeedback === 'admin'
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'hover:bg-sand-dark dark:hover:bg-dark-bg-elevated text-charcoal-light dark:text-dark-text-secondary'
                            "
                            :title="settingsCopyFeedback === 'admin' ? 'Copied!' : 'Copy URL'"
                            @click="copySettingsUrl(getAdminUrl(settingsWedding.slug), 'admin')"
                          >
                            <svg
                              v-if="settingsCopyFeedback === 'admin'"
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <svg
                              v-else
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            class="p-2 rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated text-charcoal-light dark:text-dark-text-secondary transition-colors cursor-pointer"
                            title="Go to Admin Panel"
                            @click="
                              goToWeddingAdmin(settingsWedding.slug, settingsWedding.weddingId)
                            "
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Upload Limits Section -->
                  <div class="space-y-3">
                    <h4
                      class="font-heading text-sm font-semibold text-charcoal dark:text-dark-text flex items-center gap-2"
                    >
                      <svg
                        class="w-4 h-4 text-sage"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                      </svg>
                      {{ adminT.superAdmin?.uploadLimits ?? 'Upload Limits' }}
                    </h4>

                    <!-- Loading state -->
                    <div
                      v-if="isLoadingLimits"
                      class="flex items-center justify-center py-4 text-charcoal-light dark:text-dark-text-secondary"
                    >
                      <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </div>

                    <!-- Limits form -->
                    <div v-else-if="weddingLimits" class="space-y-4">
                      <!-- Gallery Limits -->
                      <div
                        class="p-3 bg-sand/30 dark:bg-dark-bg rounded-lg border border-sand-dark/50 dark:border-dark-border/50"
                      >
                        <p
                          class="font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary mb-2"
                        >
                          {{ adminT.superAdmin?.galleryLimits ?? 'Gallery Limits' }}
                        </p>
                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                            >
                              {{ adminT.gallery?.maxFileSize ?? 'Max File Size' }}
                            </label>
                            <select
                              v-model="weddingLimits.gallery.maxFileSize"
                              class="w-full px-2 py-1.5 text-sm rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text"
                            >
                              <option :value="1 * 1024 * 1024">1 MB</option>
                              <option :value="2 * 1024 * 1024">2 MB</option>
                              <option :value="5 * 1024 * 1024">5 MB</option>
                              <option :value="10 * 1024 * 1024">10 MB</option>
                              <option :value="20 * 1024 * 1024">20 MB</option>
                              <option :value="50 * 1024 * 1024">50 MB</option>
                            </select>
                          </div>
                          <div>
                            <label
                              class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                            >
                              {{ adminT.gallery?.maxImages ?? 'Max Images' }}
                            </label>
                            <select
                              v-model="weddingLimits.gallery.maxImages"
                              class="w-full px-2 py-1.5 text-sm rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text"
                            >
                              <option :value="10">10</option>
                              <option :value="20">20</option>
                              <option :value="30">30</option>
                              <option :value="50">50</option>
                              <option :value="100">100</option>
                              <option :value="200">200</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <!-- Gift Limits -->
                      <div
                        class="p-3 bg-sand/30 dark:bg-dark-bg rounded-lg border border-sand-dark/50 dark:border-dark-border/50"
                      >
                        <p
                          class="font-body text-xs font-medium text-charcoal-light dark:text-dark-text-secondary mb-2"
                        >
                          {{ adminT.superAdmin?.giftLimits ?? 'Gift Limits' }}
                        </p>
                        <div class="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                            >
                              {{ adminT.gifts?.maxItems ?? 'Max Items' }}
                            </label>
                            <select
                              v-model="weddingLimits.gifts.maxItems"
                              class="w-full px-2 py-1.5 text-sm rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text"
                            >
                              <option :value="10">10</option>
                              <option :value="20">20</option>
                              <option :value="30">30</option>
                              <option :value="50">50</option>
                              <option :value="100">100</option>
                            </select>
                          </div>
                          <div>
                            <label
                              class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1"
                            >
                              {{ adminT.gallery?.maxFileSize ?? 'Max File Size' }}
                            </label>
                            <select
                              v-model="weddingLimits.gifts.maxFileSize"
                              class="w-full px-2 py-1.5 text-sm rounded-lg border border-sand-dark dark:border-dark-border bg-white dark:bg-dark-bg text-charcoal dark:text-dark-text"
                            >
                              <option :value="1 * 1024 * 1024">1 MB</option>
                              <option :value="2 * 1024 * 1024">2 MB</option>
                              <option :value="5 * 1024 * 1024">5 MB</option>
                              <option :value="10 * 1024 * 1024">10 MB</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Footer -->
                  <div
                    class="flex items-center justify-between pt-4 border-t border-sand-dark dark:border-dark-border"
                  >
                    <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                      Press
                      <kbd
                        class="px-1.5 py-0.5 text-xs bg-sand dark:bg-dark-bg rounded border border-sand-dark dark:border-dark-border font-mono"
                        >ESC</kbd
                      >
                      to close
                    </p>
                    <div class="flex gap-3">
                      <button
                        type="button"
                        class="px-4 py-2 font-body text-sm font-medium bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text rounded-lg hover:bg-sand-dark dark:hover:bg-dark-bg-elevated transition-colors cursor-pointer"
                        @click="closeSettingsModal"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        :disabled="isUpdating || isSavingLimits"
                        class="px-4 py-2 font-body text-sm font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {{ isUpdating || isSavingLimits ? 'Saving...' : 'Save Changes' }}
                      </button>
                    </div>
                  </div>
                </form>
              </template>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
