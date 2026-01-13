import { ref } from "vue";
import type { ContactsData, ContactPerson, ContactsUpdateRequest } from "@/types/contacts";
import { getContacts, updateContacts as apiUpdateContacts } from "@/services/api";

// Default contacts data (matches backend defaults)
const DEFAULT_CONTACTS: ContactsData = {
  contacts: [
    {
      id: "1",
      name: "Abang Ahmad",
      role: {
        ms: "Abang Pengantin Lelaki",
        en: "Groom's Brother",
        zh: "新郎的哥哥",
        ta: "மணமகனின் சகோதரர்",
      },
      phoneNumber: "+60123456789",
      order: 0,
    },
    {
      id: "2",
      name: "Kakak Aisyah",
      role: {
        ms: "Kakak Pengantin Perempuan",
        en: "Bride's Sister",
        zh: "新娘的姐姐",
        ta: "மணமகளின் சகோதரி",
      },
      phoneNumber: "+60198765432",
      order: 1,
    },
  ],
};

// Singleton state
const contacts = ref<ContactsData>(DEFAULT_CONTACTS);
const isLoading = ref(false);
const loadError = ref("");
const isSaving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

export function useContacts() {
  // Fetch contacts from API
  const fetchContacts = async (): Promise<void> => {
    isLoading.value = true;
    loadError.value = "";

    try {
      const response = await getContacts();
      if (response.success && response.data) {
        contacts.value = response.data;
      } else {
        loadError.value = response.error ?? "Failed to load contacts";
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : "Failed to load contacts";
    } finally {
      isLoading.value = false;
    }
  };

  // Update contacts
  const updateContacts = async (contactsList: ContactPerson[]): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true;
    saveError.value = "";
    saveSuccess.value = false;

    try {
      const data: ContactsUpdateRequest = { contacts: contactsList };
      const response = await apiUpdateContacts(data);
      if (response.success && response.data) {
        contacts.value = response.data;
        saveSuccess.value = true;
        // Clear success message after 3 seconds
        setTimeout(() => {
          saveSuccess.value = false;
        }, 3000);
        return { success: true };
      }
      saveError.value = response.error ?? "Failed to update contacts";
      return { success: false, error: saveError.value };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update contacts";
      saveError.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isSaving.value = false;
    }
  };

  // Generate unique ID for new items
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  // Reset to defaults (for form reset)
  const resetToDefaults = (): void => {
    contacts.value = { ...DEFAULT_CONTACTS, contacts: [...DEFAULT_CONTACTS.contacts] };
  };

  return {
    contacts,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchContacts,
    updateContacts,
    generateId,
    resetToDefaults,
  };
}
