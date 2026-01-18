<script setup lang="ts">
  import { ref, watch, onMounted, computed } from 'vue'
  import { useSchedule } from '@/composables/useSchedule'
  import { useCrudList } from '@/composables/useCrudList'
  import { useAdminLanguage } from '@/composables/useAdminLanguage'
  import { useLoadingOverlay } from '@/composables/useLoadingOverlay'
  import { interpolate } from '@/i18n/translations'
  import { getStoredPrimaryWeddingId } from '@/services/tokenManager'
  import ConfirmModal from './ConfirmModal.vue'
  import ItemActions from './ItemActions.vue'
  import MultilingualInput from './MultilingualInput.vue'
  import BaseFormModal from './BaseFormModal.vue'
  import type { ScheduleItem, MultilingualText } from '@/types/schedule'

  const { adminT } = useAdminLanguage()
  const { withLoading } = useLoadingOverlay()

  const weddingId = computed(() => getStoredPrimaryWeddingId())

  const {
    schedule,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchScheduleAdmin,
    updateSchedule,
    generateId,
  } = useSchedule()

  // Clear all state
  const showClearAllModal = ref(false)

  const {
    localItems,
    showModal,
    editingItem,
    showDeleteModal,
    itemToDelete,
    hasChanges,
    syncLocalItems,
    openModal,
    closeModal,
    confirmDelete,
    deleteItem,
    cancelDelete,
    moveUp,
    moveDown,
    handleSave,
    discardChanges,
  } = useCrudList<ScheduleItem, typeof schedule.value>({
    sourceData: schedule,
    getItems: (data) => data.items,
    cloneItem: (item) => ({ ...item, title: { ...item.title } }),
    updateFn: (items) => updateSchedule(items, weddingId.value ?? undefined),
  })

  const modalForm = ref({
    time: '',
    title: { ms: '', en: '', zh: '', ta: '' } as MultilingualText,
  })

  watch([showModal, editingItem], ([show, item]) => {
    if (show) {
      if (item) {
        modalForm.value = {
          time: item.time,
          title: { ...item.title },
        }
      } else {
        modalForm.value = {
          time: '',
          title: { ms: '', en: '', zh: '', ta: '' },
        }
      }
    }
  })

  const saveModalForm = () => {
    if (!modalForm.value.time.trim() || !modalForm.value.title.en.trim()) return

    if (editingItem.value) {
      const index = localItems.value.findIndex((i) => i.id === editingItem.value?.id)
      const existing = localItems.value[index]
      if (index !== -1 && existing) {
        localItems.value[index] = {
          id: existing.id,
          time: modalForm.value.time,
          title: { ...modalForm.value.title },
          order: existing.order,
        }
      }
    } else {
      localItems.value.push({
        id: generateId(),
        time: modalForm.value.time,
        title: { ...modalForm.value.title },
        order: localItems.value.length,
      })
    }
    closeModal()
  }

  // Save with loading overlay
  const saveWithOverlay = async () => {
    await withLoading(() => handleSave(), {
      message: adminT.value.loadingOverlay.saving,
      showSuccess: true,
    })
  }

  // Clear all items
  const clearAllItems = async () => {
    showClearAllModal.value = false
    await withLoading(
      async () => {
        const result = await updateSchedule([], weddingId.value ?? undefined)
        if (result.success) {
          localItems.value = []
          syncLocalItems()
        }
      },
      {
        message: adminT.value.loadingOverlay.deleting,
        showSuccess: true,
      }
    )
  }

  onMounted(async () => {
    await fetchScheduleAdmin(weddingId.value ?? undefined)
    syncLocalItems()
  })

  // Watch for wedding ID changes (user switching between weddings)
  watch(weddingId, async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchScheduleAdmin(newId)
      syncLocalItems()
    }
  })
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
          {{ adminT.schedule.title }}
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          {{ adminT.schedule.subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-2">
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
          {{ adminT.schedule.addItem }}
        </button>
        <button
          type="button"
          class="flex items-center justify-center gap-2 px-4 py-2 font-body text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="localItems.length === 0 || isLoading"
          @click="showClearAllModal = true"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          {{ adminT.schedule.clearAll }}
          <span v-if="localItems.length > 0" class="text-xs">({{ localItems.length }})</span>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        {{ adminT.schedule.loadingSchedule }}
      </p>
    </div>

    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors cursor-pointer"
        @click="fetchScheduleAdmin(weddingId ?? undefined)"
      >
        {{ adminT.common.tryAgain }}
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden"
      >
        <div v-if="localItems.length === 0" class="p-8 text-center">
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            {{ adminT.schedule.noItems }}
          </p>
        </div>
        <TransitionGroup
          v-else
          name="list"
          tag="div"
          class="divide-y divide-sand-dark dark:divide-dark-border"
        >
          <div
            v-for="(item, index) in localItems"
            :key="item.id"
            class="p-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-dark-bg-secondary"
          >
            <div class="flex-shrink-0">
              <span
                class="inline-block px-3 py-1 bg-sage/10 dark:bg-sage/20 text-sage-dark dark:text-sage-light rounded-full font-body text-sm font-medium"
              >
                {{ item.time }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium">
                {{ item.title.en }}
              </p>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{ item.title.ms }}
              </p>
            </div>
            <ItemActions
              :index="index"
              :total-items="localItems.length"
              layout="horizontal"
              @move-up="moveUp(index)"
              @move-down="moveDown(index)"
              @edit="openModal(item)"
              @delete="confirmDelete(item)"
            />
          </div>
        </TransitionGroup>
      </div>

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
              {{ adminT.schedule.savedSuccess }}
            </p>
          </div>
          <div
            v-if="hasChanges && !isSaving && !saveSuccess"
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
            v-if="hasChanges"
            type="button"
            class="px-4 py-2 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
            @click="discardChanges"
          >
            {{ adminT.common.discard }}
          </button>
          <button
            type="button"
            class="px-6 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="!hasChanges"
            @click="saveWithOverlay"
          >
            {{ adminT.common.saveChanges }}
          </button>
        </div>
      </div>

      <div v-if="schedule.updatedAt" class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          {{ adminT.messages.lastUpdated }}: {{ new Date(schedule.updatedAt).toLocaleString() }}
          <span v-if="schedule.updatedBy"> {{ adminT.messages.by }} {{ schedule.updatedBy }}</span>
        </p>
      </div>
    </div>

    <BaseFormModal
      :show="showModal"
      :title="editingItem ? adminT.schedule.editItem : adminT.schedule.addItem"
      :submit-text="editingItem ? adminT.common.update : adminT.common.add"
      @close="closeModal"
      @submit="saveModalForm"
    >
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">{{
          adminT.schedule.time
        }}</label>
        <input
          v-model="modalForm.time"
          type="text"
          class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
          :placeholder="adminT.schedule.timePlaceholder"
          required
        />
      </div>
      <MultilingualInput
        v-model="modalForm.title"
        :label="adminT.schedule.eventTitle"
        :required-languages="['en']"
      />
    </BaseFormModal>

    <ConfirmModal
      :show="showDeleteModal"
      :title="adminT.schedule.deleteItem"
      :message="
        interpolate(adminT.schedule.deleteItemConfirm, { title: itemToDelete?.title.en || '' })
      "
      :confirm-text="adminT.common.delete"
      variant="danger"
      @confirm="deleteItem"
      @cancel="cancelDelete"
    />

    <ConfirmModal
      :show="showClearAllModal"
      :title="adminT.schedule.clearAll"
      :message="interpolate(adminT.schedule.clearAllConfirm, { count: String(localItems.length) })"
      :confirm-text="adminT.schedule.clearAll"
      variant="danger"
      @confirm="clearAllItems"
      @cancel="showClearAllModal = false"
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
    transform: translateX(-10px);
  }

  .list-leave-active {
    position: absolute;
  }
</style>
