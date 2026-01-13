<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useSchedule } from "@/composables/useSchedule";
import ConfirmModal from "./ConfirmModal.vue";
import type { ScheduleItem, MultilingualText } from "@/types/schedule";

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
} = useSchedule();

// Local items state for editing
const localItems = ref<ScheduleItem[]>([]);

// Modal state
const showModal = ref(false);
const editingItem = ref<ScheduleItem | null>(null);
const modalForm = ref({
  time: "",
  title: {
    ms: "",
    en: "",
    zh: "",
    ta: "",
  } as MultilingualText,
});

// Delete confirmation state
const showDeleteModal = ref(false);
const itemToDelete = ref<ScheduleItem | null>(null);

// Track changes
const hasChanges = computed(() => {
  return JSON.stringify(localItems.value) !== JSON.stringify(schedule.value.items);
});

// Sync local items
const syncLocalItems = () => {
  localItems.value = schedule.value.items.map((item) => ({ ...item, title: { ...item.title } }));
};

// Open modal for add/edit
const openModal = (item?: ScheduleItem) => {
  if (item) {
    editingItem.value = item;
    modalForm.value = {
      time: item.time,
      title: { ...item.title },
    };
  } else {
    editingItem.value = null;
    modalForm.value = {
      time: "",
      title: { ms: "", en: "", zh: "", ta: "" },
    };
  }
  showModal.value = true;
};

// Close modal
const closeModal = () => {
  showModal.value = false;
  editingItem.value = null;
};

// Save modal form
const saveModalForm = () => {
  if (!modalForm.value.time.trim() || !modalForm.value.title.en.trim()) return;

  if (editingItem.value) {
    // Update existing
    const index = localItems.value.findIndex((i) => i.id === editingItem.value?.id);
    const existing = localItems.value[index];
    if (index !== -1 && existing) {
      localItems.value[index] = {
        id: existing.id,
        time: modalForm.value.time,
        title: { ...modalForm.value.title },
        order: existing.order,
      };
    }
  } else {
    // Add new
    const newItem: ScheduleItem = {
      id: generateId(),
      time: modalForm.value.time,
      title: { ...modalForm.value.title },
      order: localItems.value.length,
    };
    localItems.value.push(newItem);
  }
  closeModal();
};

// Open delete confirmation
const confirmDelete = (item: ScheduleItem) => {
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

// Delete item (called after confirmation)
const deleteItem = () => {
  if (!itemToDelete.value) return;
  localItems.value = localItems.value.filter((i) => i.id !== itemToDelete.value?.id);
  // Reorder
  localItems.value.forEach((item, index) => {
    item.order = index;
  });
  showDeleteModal.value = false;
  itemToDelete.value = null;
};

// Cancel delete
const cancelDelete = () => {
  showDeleteModal.value = false;
  itemToDelete.value = null;
};

// Move item up
const moveUp = (index: number) => {
  if (index === 0) return;
  const item = localItems.value[index];
  localItems.value.splice(index, 1);
  localItems.value.splice(index - 1, 0, item as ScheduleItem);
  // Update orders
  localItems.value.forEach((i, idx) => {
    i.order = idx;
  });
};

// Move item down
const moveDown = (index: number) => {
  if (index === localItems.value.length - 1) return;
  const item = localItems.value[index];
  localItems.value.splice(index, 1);
  localItems.value.splice(index + 1, 0, item as ScheduleItem);
  // Update orders
  localItems.value.forEach((i, idx) => {
    i.order = idx;
  });
};

// Save changes
const handleSave = async () => {
  await updateSchedule(localItems.value);
  syncLocalItems();
};

// Discard changes
const discardChanges = () => {
  syncLocalItems();
};

onMounted(async () => {
  await fetchSchedule();
  syncLocalItems();
});
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin" />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading schedule...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">{{ loadError }}</p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors"
        @click="fetchSchedule"
      >
        Try Again
      </button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-4">
      <!-- Schedule Items List -->
      <div class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border overflow-hidden">
        <div v-if="localItems.length === 0" class="p-8 text-center">
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            No schedule items yet. Click "Add Item" to create one.
          </p>
        </div>
        <div v-else class="divide-y divide-sand-dark dark:divide-dark-border">
          <div
            v-for="(item, index) in localItems"
            :key="item.id"
            class="p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <!-- Time Badge -->
            <div class="flex-shrink-0">
              <span class="inline-block px-3 py-1 bg-sage/10 dark:bg-sage/20 text-sage-dark dark:text-sage-light rounded-full font-body text-sm font-medium">
                {{ item.time }}
              </span>
            </div>

            <!-- Title -->
            <div class="flex-1 min-w-0">
              <p class="font-body text-sm text-charcoal dark:text-dark-text font-medium">
                {{ item.title.en }}
              </p>
              <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
                {{ item.title.ms }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="p-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer disabled:opacity-50"
                :disabled="index === 0"
                title="Move up"
                @click="moveUp(index)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                class="p-2 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer disabled:opacity-50"
                :disabled="index === localItems.length - 1"
                title="Move down"
                @click="moveDown(index)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                class="p-2 text-sage hover:text-sage-dark transition-colors cursor-pointer"
                title="Edit"
                @click="openModal(item)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                class="p-2 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Delete"
                @click="confirmDelete(item)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div class="flex-1">
          <!-- Save Error -->
          <div v-if="saveError" class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p class="font-body text-sm text-red-600 dark:text-red-400">{{ saveError }}</p>
          </div>

          <!-- Save Success -->
          <div v-if="saveSuccess" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="font-body text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Schedule saved successfully!
            </p>
          </div>

          <!-- Unsaved Changes Warning -->
          <div v-if="hasChanges && !isSaving && !saveSuccess" class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p class="font-body text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
            {{ isSaving ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </div>

      <!-- Last Updated Info -->
      <div v-if="schedule.updatedAt" class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          Last updated: {{ new Date(schedule.updatedAt).toLocaleString() }}
          <span v-if="schedule.updatedBy"> by {{ schedule.updatedBy }}</span>
        </p>
      </div>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4"
      @click.self="closeModal"
    >
      <div class="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-heading text-lg text-charcoal dark:text-dark-text">
            {{ editingItem ? "Edit Schedule Item" : "Add Schedule Item" }}
          </h3>
          <button
            type="button"
            class="text-charcoal-light hover:text-charcoal transition-colors cursor-pointer"
            @click="closeModal"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="saveModalForm" class="space-y-4">
          <!-- Time -->
          <div>
            <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
              Time
            </label>
            <input
              v-model="modalForm.time"
              type="text"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="e.g., 11:00 AM"
              required
            />
          </div>

          <!-- Titles -->
          <div class="space-y-3">
            <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text">Titles</p>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                English
              </label>
              <input
                v-model="modalForm.title.en"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="English title"
                required
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Malay
              </label>
              <input
                v-model="modalForm.title.ms"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Malay title"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Chinese
              </label>
              <input
                v-model="modalForm.title.zh"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Chinese title"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Tamil
              </label>
              <input
                v-model="modalForm.title.ta"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Tamil title"
              />
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              class="flex-1 px-4 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            >
              {{ editingItem ? "Update" : "Add" }}
            </button>
            <button
              type="button"
              class="px-4 py-2.5 font-body text-sm text-charcoal border border-charcoal-light rounded-lg hover:bg-sand-dark transition-colors cursor-pointer"
              @click="closeModal"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
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
