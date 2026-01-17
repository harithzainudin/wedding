<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { useSchedule } from '@/composables/useSchedule'
  import { useCrudList } from '@/composables/useCrudList'
  import ConfirmModal from './ConfirmModal.vue'
  import ItemActions from './ItemActions.vue'
  import MultilingualInput from './MultilingualInput.vue'
  import BaseFormModal from './BaseFormModal.vue'
  import type { ScheduleItem, MultilingualText } from '@/types/schedule'

  const {
    schedule,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchSchedule,
    updateSchedule,
    generateId,
  } = useSchedule()

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
    updateFn: updateSchedule,
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

  onMounted(async () => {
    await fetchSchedule()
    syncLocalItems()
  })
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
          Schedule
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          Manage the event timeline
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
        Add Item
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin"
      />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading schedule...
      </p>
    </div>

    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">
        {{ loadError }}
      </p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors"
        @click="fetchSchedule"
      >
        Try Again
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden"
      >
        <div v-if="localItems.length === 0" class="p-8 text-center">
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            No schedule items yet. Click "Add Item" to create one.
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
              Schedule saved successfully!
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
              You have unsaved changes
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
            Discard
          </button>
          <button
            type="button"
            class="px-6 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="isSaving || !hasChanges"
            @click="handleSave"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div v-if="schedule.updatedAt" class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          Last updated: {{ new Date(schedule.updatedAt).toLocaleString() }}
          <span v-if="schedule.updatedBy"> by {{ schedule.updatedBy }}</span>
        </p>
      </div>
    </div>

    <BaseFormModal
      :show="showModal"
      :title="editingItem ? 'Edit Schedule Item' : 'Add Schedule Item'"
      :submit-text="editingItem ? 'Update' : 'Add'"
      @close="closeModal"
      @submit="saveModalForm"
    >
      <div>
        <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1"
          >Time</label
        >
        <input
          v-model="modalForm.time"
          type="text"
          class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
          placeholder="e.g., 11:00 AM"
          required
        />
      </div>
      <MultilingualInput v-model="modalForm.title" label="Titles" :required-languages="['en']" />
    </BaseFormModal>

    <ConfirmModal
      v-if="showDeleteModal"
      title="Delete Schedule Item"
      :message="`Are you sure you want to delete '${itemToDelete?.title.en || ''}'? This action cannot be undone.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="deleteItem"
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
    transform: translateX(-10px);
  }

  .list-leave-active {
    position: absolute;
  }
</style>
