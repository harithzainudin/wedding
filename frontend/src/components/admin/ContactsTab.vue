<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useContacts } from "@/composables/useContacts";
import ConfirmModal from "./ConfirmModal.vue";
import type { ContactPerson, MultilingualText } from "@/types/contacts";

const {
  contacts,
  isLoading,
  loadError,
  isSaving,
  saveError,
  saveSuccess,
  fetchContacts,
  updateContacts,
  generateId,
} = useContacts();

// Local items state for editing
const localContacts = ref<ContactPerson[]>([]);

// Modal state
const showModal = ref(false);
const editingContact = ref<ContactPerson | null>(null);
const modalForm = ref({
  name: "",
  phoneNumber: "",
  role: {
    ms: "",
    en: "",
    zh: "",
    ta: "",
  } as MultilingualText,
});

// Delete confirmation state
const showDeleteModal = ref(false);
const contactToDelete = ref<ContactPerson | null>(null);

// Track changes
const hasChanges = computed(() => {
  return JSON.stringify(localContacts.value) !== JSON.stringify(contacts.value.contacts);
});

// Sync local contacts
const syncLocalContacts = () => {
  localContacts.value = contacts.value.contacts.map((c) => ({ ...c, role: { ...c.role } }));
};

// Open modal for add/edit
const openModal = (contact?: ContactPerson) => {
  if (contact) {
    editingContact.value = contact;
    modalForm.value = {
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      role: { ...contact.role },
    };
  } else {
    editingContact.value = null;
    modalForm.value = {
      name: "",
      phoneNumber: "",
      role: { ms: "", en: "", zh: "", ta: "" },
    };
  }
  showModal.value = true;
};

// Close modal
const closeModal = () => {
  showModal.value = false;
  editingContact.value = null;
};

// Save modal form
const saveModalForm = () => {
  if (!modalForm.value.name.trim() || !modalForm.value.phoneNumber.trim()) return;

  if (editingContact.value) {
    // Update existing
    const index = localContacts.value.findIndex((c) => c.id === editingContact.value?.id);
    const existing = localContacts.value[index];
    if (index !== -1 && existing) {
      localContacts.value[index] = {
        id: existing.id,
        name: modalForm.value.name,
        phoneNumber: modalForm.value.phoneNumber,
        role: { ...modalForm.value.role },
        order: existing.order,
      };
    }
  } else {
    // Add new
    const newContact: ContactPerson = {
      id: generateId(),
      name: modalForm.value.name,
      phoneNumber: modalForm.value.phoneNumber,
      role: { ...modalForm.value.role },
      order: localContacts.value.length,
    };
    localContacts.value.push(newContact);
  }
  closeModal();
};

// Open delete confirmation
const confirmDelete = (contact: ContactPerson) => {
  contactToDelete.value = contact;
  showDeleteModal.value = true;
};

// Delete contact (called after confirmation)
const deleteContact = () => {
  if (!contactToDelete.value) return;
  localContacts.value = localContacts.value.filter((c) => c.id !== contactToDelete.value?.id);
  // Reorder
  localContacts.value.forEach((contact, index) => {
    contact.order = index;
  });
  showDeleteModal.value = false;
  contactToDelete.value = null;
};

// Cancel delete
const cancelDelete = () => {
  showDeleteModal.value = false;
  contactToDelete.value = null;
};

// Move contact up
const moveUp = (index: number) => {
  if (index === 0) return;
  const contact = localContacts.value[index];
  localContacts.value.splice(index, 1);
  localContacts.value.splice(index - 1, 0, contact as ContactPerson);
  // Update orders
  localContacts.value.forEach((c, idx) => {
    c.order = idx;
  });
};

// Move contact down
const moveDown = (index: number) => {
  if (index === localContacts.value.length - 1) return;
  const contact = localContacts.value[index];
  localContacts.value.splice(index, 1);
  localContacts.value.splice(index + 1, 0, contact as ContactPerson);
  // Update orders
  localContacts.value.forEach((c, idx) => {
    c.order = idx;
  });
};

// Save changes
const handleSave = async () => {
  await updateContacts(localContacts.value);
  syncLocalContacts();
};

// Discard changes
const discardChanges = () => {
  syncLocalContacts();
};

// Format phone for display
const formatPhone = (phone: string): string => {
  return phone.replace(/(\+60)(\d{2,3})(\d{3,4})(\d{4})/, "$1 $2-$3 $4");
};

onMounted(async () => {
  await fetchContacts();
  syncLocalContacts();
});
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="font-heading text-xl font-semibold text-charcoal dark:text-dark-text">
          Contacts
        </h2>
        <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-1">
          Manage contact people for guests to reach
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
        Add Contact
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-3 border-sage border-t-transparent rounded-full animate-spin" />
      <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary mt-3">
        Loading contacts...
      </p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="text-center py-12">
      <p class="font-body text-sm text-red-600 dark:text-red-400 mb-3">{{ loadError }}</p>
      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sage text-white font-body text-sm hover:bg-sage-dark transition-colors"
        @click="fetchContacts"
      >
        Try Again
      </button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-4">
      <!-- Contacts List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-if="localContacts.length === 0" class="col-span-full p-8 bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border text-center">
          <p class="font-body text-sm text-charcoal-light dark:text-dark-text-secondary">
            No contacts yet. Click "Add Contact" to create one.
          </p>
        </div>
        <div
          v-for="(contact, index) in localContacts"
          :key="contact.id"
          class="bg-white dark:bg-dark-bg-secondary rounded-lg border border-sand-dark dark:border-dark-border p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="font-heading text-base text-charcoal dark:text-dark-text font-medium truncate">
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ formatPhone(contact.phoneNumber) }}
              </a>
            </div>

            <!-- Actions -->
            <div class="flex flex-col gap-1">
              <button
                type="button"
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer disabled:opacity-50"
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
                class="p-1.5 text-charcoal-light hover:text-charcoal dark:text-dark-text-secondary dark:hover:text-dark-text transition-colors cursor-pointer disabled:opacity-50"
                :disabled="index === localContacts.length - 1"
                title="Move down"
                @click="moveDown(index)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                class="p-1.5 text-sage hover:text-sage-dark transition-colors cursor-pointer"
                title="Edit"
                @click="openModal(contact)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                class="p-1.5 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Delete"
                @click="confirmDelete(contact)"
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
              Contacts saved successfully!
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
      <div v-if="contacts.updatedAt" class="p-3 bg-sand/30 dark:bg-dark-bg-elevated rounded-lg">
        <p class="font-body text-xs text-charcoal-light dark:text-dark-text-secondary">
          Last updated: {{ new Date(contacts.updatedAt).toLocaleString() }}
          <span v-if="contacts.updatedBy"> by {{ contacts.updatedBy }}</span>
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
            {{ editingContact ? "Edit Contact" : "Add Contact" }}
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
          <!-- Name -->
          <div>
            <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
              Name
            </label>
            <input
              v-model="modalForm.name"
              type="text"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="Contact name"
              required
            />
          </div>

          <!-- Phone Number -->
          <div>
            <label class="block font-body text-sm font-medium text-charcoal dark:text-dark-text mb-1">
              Phone Number
            </label>
            <input
              v-model="modalForm.phoneNumber"
              type="tel"
              class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
              placeholder="+60123456789"
              required
            />
          </div>

          <!-- Roles -->
          <div class="space-y-3">
            <p class="font-body text-sm font-medium text-charcoal dark:text-dark-text">Role</p>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                English
              </label>
              <input
                v-model="modalForm.role.en"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="e.g., Groom's Brother"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Malay
              </label>
              <input
                v-model="modalForm.role.ms"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="e.g., Abang Pengantin Lelaki"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Chinese
              </label>
              <input
                v-model="modalForm.role.zh"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Chinese role"
              />
            </div>
            <div>
              <label class="block font-body text-xs text-charcoal-light dark:text-dark-text-secondary mb-1">
                Tamil
              </label>
              <input
                v-model="modalForm.role.ta"
                type="text"
                class="w-full px-3 py-2.5 font-body text-base border border-sand-dark dark:border-dark-border rounded-lg bg-sand dark:bg-dark-bg-elevated text-charcoal dark:text-dark-text focus:outline-none focus:border-sage"
                placeholder="Tamil role"
              />
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-2">
            <button
              type="submit"
              class="flex-1 px-4 py-2.5 font-body text-sm text-white bg-sage rounded-lg hover:bg-sage-dark transition-colors cursor-pointer"
            >
              {{ editingContact ? "Update" : "Add" }}
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
      title="Delete Contact"
      :message="`Are you sure you want to delete '${contactToDelete?.name || ''}'? This action cannot be undone.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="deleteContact"
      @cancel="cancelDelete"
    />
  </div>
</template>
