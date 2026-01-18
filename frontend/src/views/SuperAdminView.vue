<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useSuperAdmin } from '@/composables/useSuperAdmin'
  import { useAdminAuth } from '@/composables/useAdminAuth'
  import { useStaff } from '@/composables/useStaff'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { setStoredPrimaryWeddingId } from '@/services/tokenManager'
  import HardDeleteConfirmModal from '@/components/admin/HardDeleteConfirmModal.vue'
  import StaffManagement from '@/components/admin/StaffManagement.vue'

  // Tab state from route
  type TabType = 'weddings' | 'staff'
  const route = useRoute()

  // Compute active tab from route params
  const activeTab = computed<TabType>(() => {
    const tab = route.params.tab as string | undefined
    if (tab === 'staff') return 'staff'
    return 'weddings' // default
  })

  // Navigate to tab via router
  const navigateToTab = (tab: TabType) => {
    if (tab === 'weddings') {
      router.push('/superadmin')
    } else {
      router.push(`/superadmin/${tab}`)
    }
  }

  // Staff for owner assignment
  const { staff: staffList, fetchStaff: fetchStaffList, isLoading: isLoadingStaff } = useStaff()
  const { withLoading } = useLoadingOverlay()
  const { adminT } = useAdminLanguage()

  import type {
    CreateWeddingRequest,
    AddWeddingOwnerRequest,
    UpdateWeddingOwnerRequest,
    UpdateWeddingRequest,
    WeddingStatus,
  } from '@/types/admin'

  const router = useRouter()
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
    actionError,
    actionSuccess,
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
    clearMessages,
    clearSelectedWedding,
  } = useSuperAdmin()

  // Use reactive auth state
  const {
    isAuthenticated,
    isCheckingAuth,
    currentUser: username,
    userType,
    adminUserType,
    checkExistingAuth,
  } = useAdminAuth()

  // Check if user can access super admin (super admin or staff)
  const canAccessSuperAdmin = computed(
    () => userType.value === 'super' || adminUserType.value === 'staff'
  )

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
  const settingsFormError = ref('')
  const isOpeningSettings = ref(false)
  const settingsCopyFeedback = ref<'public' | 'admin' | null>(null)

  // Add owner form
  const addOwnerForm = ref<AddWeddingOwnerRequest>({
    username: '',
    password: '',
    email: '',
  })
  const addOwnerFormError = ref('')

  // Edit owner form
  const showEditOwner = ref<string | null>(null)
  const editOwnerForm = ref<UpdateWeddingOwnerRequest>({
    email: '',
    role: 'coowner',
  })
  const editOwnerFormError = ref('')

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
  const createFormError = ref('')

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
    createFormError.value = ''

    // Validate wedding details
    if (!createForm.value.slug || createForm.value.slug.length < 3) {
      createFormError.value = 'Slug must be at least 3 characters'
      return
    }
    if (!createForm.value.displayName) {
      createFormError.value = 'Display name is required'
      return
    }

    // Validate owner based on mode (skip validation for 'none' mode)
    if (createOwnerMode.value === 'staff') {
      if (!createSelectedStaff.value) {
        createFormError.value = 'Please select a staff member'
        return
      }
    } else if (createOwnerMode.value === 'client') {
      if (!createClientForm.value.username || createClientForm.value.username.length < 3) {
        createFormError.value = 'Owner username must be at least 3 characters'
        return
      }
      if (!createClientForm.value.password || createClientForm.value.password.length < 8) {
        createFormError.value = 'Owner password must be at least 8 characters'
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

    await withLoading(
      async () => {
        const result = await createWedding(request)
        if (!result.success) {
          showCreateModal.value = true
        } else {
          resetCreateForm()
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
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
    createFormError.value = ''
    showCreateFormPassword.value = false
  }

  // Archive wedding
  const handleArchive = async (weddingId: string) => {
    showArchiveConfirm.value = null
    await withLoading(
      async () => {
        await archiveWedding(weddingId)
      },
      {
        message: adminT.value.loadingOverlay.processing,
        showSuccess: true,
      }
    )
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

    await withLoading(
      async () => {
        await hardDeleteWedding(weddingIdToDelete)
      },
      {
        message: adminT.value.loadingOverlay.deleting,
        showSuccess: true,
      }
    )
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
    addOwnerFormError.value = ''
    editOwnerFormError.value = ''
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
    addOwnerFormError.value = ''
  }

  // Handle add owner submit
  const handleAddOwnerSubmit = async () => {
    if (!selectedWedding.value) return

    addOwnerFormError.value = ''

    // Validate
    if (!addOwnerForm.value.username || addOwnerForm.value.username.length < 3) {
      addOwnerFormError.value = 'Username must be at least 3 characters'
      return
    }
    if (!addOwnerForm.value.password || addOwnerForm.value.password.length < 8) {
      addOwnerFormError.value = 'Password must be at least 8 characters'
      return
    }

    const weddingId = selectedWedding.value.weddingId
    showAddOwnerForm.value = false

    await withLoading(
      async () => {
        const result = await addOwner(weddingId, addOwnerForm.value)
        if (result.success) {
          resetAddOwnerForm()
        } else {
          addOwnerFormError.value = result.error ?? 'Failed to add owner'
          showAddOwnerForm.value = true
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Handle remove owner
  const handleRemoveOwner = async (username: string) => {
    if (!selectedWedding.value) return

    const weddingId = selectedWedding.value.weddingId
    showRemoveConfirm.value = null

    await withLoading(
      async () => {
        await removeOwner(weddingId, username)
      },
      {
        message: adminT.value.loadingOverlay.deleting,
        showSuccess: true,
      }
    )
  }

  // Handle reset password
  const handleResetPassword = async (username: string) => {
    if (!selectedWedding.value) return

    const weddingId = selectedWedding.value.weddingId
    showResetConfirm.value = null

    await withLoading(
      async () => {
        const result = await resetPassword(weddingId, username)
        if (result.success && result.temporaryPassword) {
          temporaryPassword.value = result.temporaryPassword
        }
      },
      {
        message: adminT.value.loadingOverlay.processing,
        showSuccess: true,
      }
    )
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
      editOwnerFormError.value = ''
    }
  }

  // Cancel edit owner
  const cancelEditOwner = () => {
    showEditOwner.value = null
    editOwnerForm.value = { email: '', role: 'coowner' }
    editOwnerFormError.value = ''
  }

  // Handle edit owner submit
  const handleEditOwnerSubmit = async () => {
    if (!selectedWedding.value || !showEditOwner.value) return

    editOwnerFormError.value = ''

    // Validate email if provided
    if (editOwnerForm.value.email && editOwnerForm.value.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editOwnerForm.value.email)) {
        editOwnerFormError.value = 'Invalid email format'
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
    } else {
      editOwnerFormError.value = result.error ?? 'Failed to update admin'
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
  const openSettingsModal = (weddingId: string) => {
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
      settingsFormError.value = ''
      settingsCopyFeedback.value = null
      // Simulate brief loading for smooth UX
      setTimeout(() => {
        isOpeningSettings.value = false
      }, 200)
    }
  }

  // Close settings modal
  const closeSettingsModal = () => {
    showSettingsModal.value = false
    settingsWedding.value = null
    settingsFormError.value = ''
    settingsCopyFeedback.value = null
  }

  // Handle settings form submit
  const handleSettingsSubmit = async () => {
    if (!settingsWedding.value) return

    settingsFormError.value = ''

    // Validate
    if (!settingsWedding.value.displayName.trim()) {
      settingsFormError.value = 'Display name is required'
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

    const result = await updateWedding(settingsWedding.value.weddingId, updateData)
    if (result.success) {
      closeSettingsModal()
    } else {
      settingsFormError.value = result.error ?? 'Failed to update wedding'
    }
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

  // Check auth and fetch weddings when authenticated
  onMounted(async () => {
    // Add keyboard listener for ESC key
    document.addEventListener('keydown', handleKeyDown)

    // Check if user has existing valid session
    await checkExistingAuth()

    // After auth check, if user can access super admin, fetch weddings
    if (isAuthenticated.value && canAccessSuperAdmin.value) {
      await fetchWeddings()
    }
  })

  // Cleanup keyboard listener
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  // Watch for auth changes to handle redirect or fetch
  // Note: Router guards handle most auth redirects, but this handles logout scenarios
  watch(
    [isAuthenticated, isCheckingAuth],
    ([authenticated, checking]) => {
      if (checking) return // Still checking, wait

      if (!authenticated) {
        // Not logged in, redirect to login page
        router.push('/login')
      }
    },
    { immediate: false }
  )

  // Fetch staff list when create modal opens
  watch(showCreateModal, (isOpen) => {
    if (isOpen && staffList.value.length === 0) {
      fetchStaffList()
    }
  })
</script>

<template>
  <div class="min-h-screen bg-sand dark:bg-dark-bg">
    <!-- Loading state while checking auth -->
    <div v-if="isCheckingAuth" class="min-h-screen flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        <span class="text-charcoal-light dark:text-dark-text-secondary text-sm font-body">
          Loading...
        </span>
      </div>
    </div>

    <!-- Main content when authenticated as super admin or staff -->
    <template v-else-if="isAuthenticated && canAccessSuperAdmin">
      <!-- Header -->
      <header
        class="bg-white dark:bg-dark-bg-secondary shadow-sm border-b border-sand-dark dark:border-dark-border"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="font-heading text-2xl font-bold text-charcoal dark:text-dark-text">
                Super Admin Dashboard
              </h1>
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                Welcome, {{ username }}
              </p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex gap-1 mt-4 -mb-4">
            <button
              type="button"
              class="px-4 py-2 font-body text-sm font-medium rounded-t-lg transition-colors cursor-pointer"
              :class="
                activeTab === 'weddings'
                  ? 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text border-t border-l border-r border-sand-dark dark:border-dark-border'
                  : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
              "
              @click="navigateToTab('weddings')"
            >
              Weddings
            </button>
            <button
              type="button"
              class="px-4 py-2 font-body text-sm font-medium rounded-t-lg transition-colors cursor-pointer"
              :class="
                activeTab === 'staff'
                  ? 'bg-sand dark:bg-dark-bg text-charcoal dark:text-dark-text border-t border-l border-r border-sand-dark dark:border-dark-border'
                  : 'text-charcoal-light dark:text-dark-text-secondary hover:text-charcoal dark:hover:text-dark-text'
              "
              @click="navigateToTab('staff')"
            >
              Staff
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <!-- Weddings Tab -->
          <div v-if="activeTab === 'weddings'" key="weddings">
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
                <p
                  class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary"
                >
                  Total
                </p>
                <p
                  class="font-heading text-xl sm:text-3xl font-bold text-charcoal dark:text-dark-text"
                >
                  {{ totalWeddings }}
                </p>
              </div>
              <div
                class="bg-white dark:bg-dark-bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border border-sand-dark dark:border-dark-border"
              >
                <p
                  class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary"
                >
                  Active
                </p>
                <p class="font-heading text-xl sm:text-3xl font-bold text-green-600">
                  {{ activeWeddings.length }}
                </p>
              </div>
              <div
                class="bg-white dark:bg-dark-bg-secondary rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border border-sand-dark dark:border-dark-border"
              >
                <p
                  class="font-body text-xs sm:text-sm text-charcoal-light dark:text-dark-text-secondary"
                >
                  Archived
                </p>
                <p
                  class="font-heading text-xl sm:text-3xl font-bold text-charcoal-light dark:text-dark-text-secondary"
                >
                  {{ archivedWeddings.length }}
                </p>
              </div>
            </div>

            <!-- Messages -->
            <div
              v-if="actionSuccess"
              class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <p class="font-body text-sm text-green-700 dark:text-green-300">
                {{ actionSuccess }}
              </p>
              <button
                type="button"
                class="text-green-600 underline text-sm mt-1 cursor-pointer"
                @click="clearMessages"
              >
                Dismiss
              </button>
            </div>
            <div
              v-if="actionError"
              class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p class="font-body text-sm text-red-700 dark:text-red-300">{{ actionError }}</p>
              <button
                type="button"
                class="text-red-600 underline text-sm mt-1 cursor-pointer"
                @click="clearMessages"
              >
                Dismiss
              </button>
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

              <!-- Wedding List (Mobile + Desktop) -->
              <div v-else>
                <!-- Mobile Card View -->
                <div class="sm:hidden divide-y divide-sand-dark dark:divide-dark-border">
                  <div
                    v-for="wedding in weddings"
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
                        v-for="wedding in weddings"
                        :key="wedding.weddingId"
                        class="hover:bg-sand/30 dark:hover:bg-dark-bg-elevated"
                      >
                        <td class="px-6 py-4 whitespace-nowrap">
                          <p
                            class="font-body text-sm font-medium text-charcoal dark:text-dark-text"
                          >
                            {{ wedding.displayName }}
                          </p>
                          <p
                            class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary"
                          >
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
                                openHardDeleteModal(
                                  wedding.weddingId,
                                  wedding.slug,
                                  wedding.displayName
                                )
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
          </div>

          <!-- Staff Tab -->
          <StaffManagement v-else key="staff" />
        </Transition>
      </main>

      <!-- Create Wedding Modal -->
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

                <div
                  v-if="createFormError"
                  class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p class="font-body text-sm text-red-700 dark:text-red-300">
                    {{ createFormError }}
                  </p>
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

      <!-- Archive Confirmation Modal -->
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

      <!-- Wedding Detail / User Management Modal -->
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
                      <form @submit.prevent="handleAddOwnerSubmit" class="space-y-3">
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
                        <div
                          v-if="addOwnerFormError"
                          class="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                        >
                          <p class="font-body text-xs text-red-700 dark:text-red-300">
                            {{ addOwnerFormError }}
                          </p>
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
                          <form @submit.prevent="handleEditOwnerSubmit" class="space-y-3">
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
                            <div
                              v-if="editOwnerFormError"
                              class="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                            >
                              <p class="font-body text-xs text-red-700 dark:text-red-300">
                                {{ editOwnerFormError }}
                              </p>
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

      <!-- Wedding Settings Modal -->
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
                <form @submit.prevent="handleSettingsSubmit" class="p-6 space-y-6">
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

                  <!-- Error Message -->
                  <div
                    v-if="settingsFormError"
                    class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <p class="font-body text-sm text-red-700 dark:text-red-300">
                      {{ settingsFormError }}
                    </p>
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
                        :disabled="isUpdating"
                        class="px-4 py-2 font-body text-sm font-medium bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {{ isUpdating ? 'Saving...' : 'Save Changes' }}
                      </button>
                    </div>
                  </div>
                </form>
              </template>
            </div>
          </Transition>
        </div>
      </Transition>
    </template>

    <!-- Hard Delete Confirmation Modal -->
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
  </div>
</template>
