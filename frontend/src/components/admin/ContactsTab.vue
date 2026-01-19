<script setup lang="ts">
  import { ref, watch, onMounted, computed } from 'vue'
  import { useContacts } from '@/composables/useContacts'
  import { useCrudList } from '@/composables/useCrudList'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { interpolate } from '@/i18n/translations'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import ConfirmModal from './ConfirmModal.vue'
  import ItemActions from './ItemActions.vue'
  import MultilingualInput from './MultilingualInput.vue'
  import BaseFormModal from './BaseFormModal.vue'
  import SectionVisibilityToggle from './SectionVisibilityToggle.vue'
  import type { ContactPerson, MultilingualText } from '@/types/contacts'

  const emit = defineEmits<{
    'dirty-state-change': [
      payload: {
        isDirty: boolean
        save: () => Promise<{ success: boolean; error?: string }>
        discard: () => void
      },
    ]
  }>()

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()

  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const {
    contacts,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchContactsAdmin,
    updateContacts,
    updateContactsSettings,
    generateId,
  } = useContacts()

  // Show/hide toggle state (auto-saves on change)
  const showContacts = computed(() => contacts.value.settings?.showContacts ?? true)
  const isTogglingVisibility = ref(false)

  // Handle toggle with auto-save
  const handleToggleVisibility = async (value: boolean) => {
    isTogglingVisibility.value = true
    try {
      await updateContactsSettings({ showContacts: value }, weddingId.value ?? undefined)
    } finally {
      isTogglingVisibility.value = false
    }
  }

  const {
    localItems: localContacts,
    showModal,
    editingItem: editingContact,
    showDeleteModal,
    itemToDelete: contactToDelete,
    hasChanges,
    syncLocalItems: syncLocalContacts,
    openModal,
    closeModal,
    confirmDelete,
    deleteItem: deleteContact,
    cancelDelete,
    moveUp,
    moveDown,
    handleSave,
    discardChanges,
  } = useCrudList<ContactPerson, typeof contacts.value>({
    sourceData: contacts,
    getItems: (data) => data.contacts,
    cloneItem: (c) => ({ ...c, role: { ...c.role } }),
    updateFn: (contacts) => updateContacts(contacts, weddingId.value ?? undefined),
  })

  const modalForm = ref({
    name: '',
    phoneNumber: '',
    role: { ms: '', en: '', zh: '', ta: '' } as MultilingualText,
  })

  watch([showModal, editingContact], ([show, item]) => {
    if (show) {
      if (item) {
        modalForm.value = {
          name: item.name,
          phoneNumber: item.phoneNumber,
          role: { ...item.role },
        }
      } else {
        modalForm.value = {
          name: '',
          phoneNumber: '',
          role: { ms: '', en: '', zh: '', ta: '' },
        }
      }
    }
  })

  const saveModalForm = () => {
    if (!modalForm.value.name.trim() || !modalForm.value.phoneNumber.trim()) return

    if (editingContact.value) {
      const index = localContacts.value.findIndex((c) => c.id === editingContact.value?.id)
      const existing = localContacts.value[index]
      if (index !== -1 && existing) {
        localContacts.value[index] = {
          id: existing.id,
          name: modalForm.value.name,
          phoneNumber: modalForm.value.phoneNumber,
          role: { ...modalForm.value.role },
          order: existing.order,
        }
      }
    } else {
      localContacts.value.push({
        id: generateId(),
        name: modalForm.value.name,
        phoneNumber: modalForm.value.phoneNumber,
        role: { ...modalForm.value.role },
        order: localContacts.value.length,
      })
    }
    closeModal()
  }

  const formatPhone = (phone: string): string => {
    return phone.replace(/(\+60)(\d{2,3})(\d{3,4})(\d{4})/, '$1 $2-$3 $4')
  }

  // Combined changes check (items only - toggle auto-saves)
  const hasAnyChanges = computed(() => hasChanges.value)

  // Save with loading overlay - saves items only (toggle auto-saves)
  const saveWithOverlay = async () => {
    await withLoading(
      async () => {
        if (hasChanges.value) {
          await handleSave()
        }
      },
      {
        message: adminT.value.loadingOverlay.saving,
        showSuccess: true,
      }
    )
  }

  // Save function for external callers (returns result) - items only (toggle auto-saves)
  const saveForEmit = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (hasChanges.value) {
        const itemsResult = await updateContacts(
          localContacts.value as ContactPerson[],
          weddingId.value ?? undefined
        )
        if (!itemsResult.success) {
          return itemsResult
        }
        syncLocalContacts()
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Save failed' }
    }
  }

  // Emit dirty state changes to parent
  watch(
    hasAnyChanges,
    (isDirty) => {
      emit('dirty-state-change', {
        isDirty,
        save: saveForEmit,
        discard: discardChanges,
      })
    },
    { immediate: true }
  )

  onMounted(async () => {
    await fetchContactsAdmin(weddingId.value ?? undefined)
    syncLocalContacts()
  })

  // Watch for wedding ID changes (user switching between weddings)
  watch(weddingId, async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchContactsAdmin(newId)
      syncLocalContacts()
    }
  })
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
          {{ adminT.contacts.title }}
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          {{ adminT.contacts.subtitle }}
        </p>
      </div>
      <button
        type="button"
        class="flex items-center justify-center gap-2 px-4 py-2 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
        @click="openModal()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        {{ adminT.contacts.addContact }}
      </button>
    </div>

    <!-- Show/Hide Contacts Toggle -->
    <SectionVisibilityToggle
      :model-value="showContacts"
      :loading="isTogglingVisibility"
      :disabled="isLoading"
      :label="adminT.contacts.showContactsSection"
      :description="adminT.contacts.showContactsDesc"
      @update:model-value="handleToggleVisibility"
    />

    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        {{ adminT.contacts.loadingContacts }}
      </p>
    </div>

    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors"
        @click="fetchContactsAdmin(weddingId ?? undefined)"
      >
        {{ adminT.common.tryAgain }}
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-if="localContacts.length === 0"
        class="p-8 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border text-center"
      >
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.contacts.noContacts }}
        </p>
      </div>
      <TransitionGroup v-else name="list" tag="div" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="(contact, index) in localContacts"
          :key="contact.id"
          class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p
                class="font-heading text-base text-charcoal dark:text-dark-text font-medium truncate"
              >
                {{ contact.name }}
              </p>
              <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
                {{ contact.role.en || contact.role.ms }}
              </p>
              <a
                :href="`tel:${contact.phoneNumber}`"
                class="font-body text-sm text-sage hover:text-sage-dark inline-flex items-center gap-1 mt-1"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {{ formatPhone(contact.phoneNumber) }}
              </a>
            </div>
            <ItemActions
              :index="index"
              :total-items="localContacts.length"
              layout="vertical"
              @move-up="moveUp(index)"
              @move-down="moveDown(index)"
              @edit="openModal(contact)"
              @delete="confirmDelete(contact)"
            />
          </div>
        </div>
      </TransitionGroup>

      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2"
      >
        <div class="flex-1">
          <div v-if="saveError" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p class="font-body text-sm text-red-600 dark:text-red-400">
              {{ saveError }}
            </p>
          </div>
          <div v-if="saveSuccess" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {{ adminT.contacts.savedSuccess }}
            </p>
          </div>
          <div
            v-if="hasAnyChanges && !isSaving && !saveSuccess"
            class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
          >
            <p class="font-body text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {{ adminT.messages.unsavedChanges }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="hasAnyChanges"
            type="button"
            class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
            @click="discardAllChanges"
          >
            {{ adminT.common.discard }}
          </button>
          <button
            type="button"
            class="px-6 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="!hasAnyChanges"
            @click="saveWithOverlay"
          >
            {{ adminT.common.saveChanges }}
          </button>
        </div>
      </div>

      <div v-if="contacts.updatedAt" class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.messages.lastUpdated }}: {{ new Date(contacts.updatedAt).toLocaleString() }}
          <span v-if="contacts.updatedBy"> {{ adminT.messages.by }} {{ contacts.updatedBy }}</span>
        </p>
      </div>
    </div>

    <BaseFormModal
      :show="showModal"
      :title="editingContact ? adminT.contacts.editContact : adminT.contacts.addContact"
      :submit-text="editingContact ? adminT.common.update : adminT.common.add"
      @close="closeModal"
      @submit="saveModalForm"
    >
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">{{
          adminT.contacts.contactName
        }}</label>
        <input
          v-model="modalForm.name"
          type="text"
          class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
          :placeholder="adminT.contacts.contactNamePlaceholder"
          required
        />
      </div>
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">{{
          adminT.contacts.phoneNumber
        }}</label>
        <input
          v-model="modalForm.phoneNumber"
          type="tel"
          class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
          placeholder="+60123456789"
          required
        />
      </div>
      <MultilingualInput
        v-model="modalForm.role"
        :label="adminT.contacts.role"
        :placeholder="adminT.contacts.rolePlaceholder"
      />
    </BaseFormModal>

    <ConfirmModal
      :show="showDeleteModal"
      :title="adminT.contacts.deleteContact"
      :message="
        interpolate(adminT.contacts.deleteContactConfirm, { name: contactToDelete?.name || '' })
      "
      :confirm-text="adminT.common.delete"
      variant="danger"
      @confirm="deleteContact"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
  .list-move {
    transition: transform 0.3s ease;
  }

  .list-enter-active,
  .list-leave-active {
    transition: all 0.3s ease;
  }

  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .list-leave-active {
    position: absolute;
  }
</style>
