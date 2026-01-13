import { ref } from "vue";
import type { WeddingDetailsData, WeddingDetailsUpdateRequest } from "@/types/weddingDetails";
import { getWeddingDetails, updateWeddingDetails as apiUpdateWeddingDetails } from "@/services/api";

// Default wedding details data (matches backend defaults)
const DEFAULT_WEDDING_DETAILS: WeddingDetailsData = {
  couple: {
    bride: {
      fullName: "Nama Penuh Pengantin Perempuan",
      nickname: "Aisyah",
    },
    groom: {
      fullName: "Nama Penuh Pengantin Lelaki",
      nickname: "Ahmad",
    },
  },
  parents: {
    bride: {
      father: "Encik Bapa Pengantin Perempuan",
      mother: "Puan Ibu Pengantin Perempuan",
    },
    groom: {
      father: "Encik Bapa Pengantin Lelaki",
      mother: "Puan Ibu Pengantin Lelaki",
    },
  },
  eventDate: "2026-12-12T11:00:00+08:00",
  dressCode: "Pastel / Earthy Tones",
  hashtag: "#AisyahAhmadWedding",
  qrCodeUrl: "https://harithzainudin.github.io/wedding",
};

// Singleton state
const weddingDetails = ref<WeddingDetailsData>(DEFAULT_WEDDING_DETAILS);
const isLoading = ref(false);
const loadError = ref("");
const isSaving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

export function useWeddingDetails() {
  // Fetch wedding details from API
  const fetchWeddingDetails = async (): Promise<void> => {
    isLoading.value = true;
    loadError.value = "";

    try {
      const response = await getWeddingDetails();
      if (response.success && response.data) {
        weddingDetails.value = response.data;
      } else {
        loadError.value = response.error ?? "Failed to load wedding details";
      }
    } catch (err) {
      loadError.value = err instanceof Error ? err.message : "Failed to load wedding details";
    } finally {
      isLoading.value = false;
    }
  };

  // Update wedding details
  const updateWeddingDetails = async (data: WeddingDetailsUpdateRequest): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true;
    saveError.value = "";
    saveSuccess.value = false;

    try {
      const response = await apiUpdateWeddingDetails(data);
      if (response.success && response.data) {
        weddingDetails.value = response.data;
        saveSuccess.value = true;
        // Clear success message after 3 seconds
        setTimeout(() => {
          saveSuccess.value = false;
        }, 3000);
        return { success: true };
      }
      saveError.value = response.error ?? "Failed to update wedding details";
      return { success: false, error: saveError.value };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update wedding details";
      saveError.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isSaving.value = false;
    }
  };

  // Reset to defaults (for form reset)
  const resetToDefaults = (): void => {
    weddingDetails.value = { ...DEFAULT_WEDDING_DETAILS };
  };

  return {
    weddingDetails,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchWeddingDetails,
    updateWeddingDetails,
    resetToDefaults,
  };
}
