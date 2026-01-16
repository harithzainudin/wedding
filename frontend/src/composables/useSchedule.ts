import { ref } from "vue";
import type {
  ScheduleData,
  ScheduleItem,
  ScheduleUpdateRequest,
} from "@/types/schedule";
import {
  getSchedule,
  updateSchedule as apiUpdateSchedule,
} from "@/services/api";

// Default schedule data (matches backend defaults)
const DEFAULT_SCHEDULE: ScheduleData = {
  items: [
    {
      id: "1",
      time: "11:00 AM",
      title: {
        ms: "Ketibaan Tetamu",
        en: "Guest Arrival",
        zh: "宾客到达",
        ta: "விருந்தினர் வருகை",
      },
      order: 0,
    },
    {
      id: "2",
      time: "11:30 AM",
      title: {
        ms: "Jamuan Makan Bermula",
        en: "Lunch Begins",
        zh: "午餐开始",
        ta: "மதிய உணவு தொடங்குகிறது",
      },
      order: 1,
    },
    {
      id: "3",
      time: "12:30 PM",
      title: {
        ms: "Ketibaan Pengantin",
        en: "Bride & Groom Arrival",
        zh: "新人入场",
        ta: "மணமக்கள் வருகை",
      },
      order: 2,
    },
    {
      id: "4",
      time: "4:00 PM",
      title: {
        ms: "Majlis Tamat",
        en: "Event Ends",
        zh: "活动结束",
        ta: "நிகழ்ச்சி முடிவு",
      },
      order: 3,
    },
  ],
};

// Singleton state
const schedule = ref<ScheduleData>(DEFAULT_SCHEDULE);
const isLoading = ref(false);
const loadError = ref("");
const isSaving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

export function useSchedule() {
  // Fetch schedule from API
  const fetchSchedule = async (): Promise<void> => {
    isLoading.value = true;
    loadError.value = "";

    try {
      const data = await getSchedule();
      schedule.value = data;
    } catch (err) {
      loadError.value =
        err instanceof Error ? err.message : "Failed to load schedule";
    } finally {
      isLoading.value = false;
    }
  };

  // Update schedule
  const updateSchedule = async (
    items: ScheduleItem[],
  ): Promise<{ success: boolean; error?: string }> => {
    isSaving.value = true;
    saveError.value = "";
    saveSuccess.value = false;

    try {
      const requestData: ScheduleUpdateRequest = { items };
      const responseData = await apiUpdateSchedule(requestData);
      schedule.value = responseData;
      saveSuccess.value = true;
      // Clear success message after 3 seconds
      setTimeout(() => {
        saveSuccess.value = false;
      }, 3000);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update schedule";
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
    schedule.value = {
      ...DEFAULT_SCHEDULE,
      items: [...DEFAULT_SCHEDULE.items],
    };
  };

  return {
    schedule,
    isLoading,
    loadError,
    isSaving,
    saveError,
    saveSuccess,
    fetchSchedule,
    updateSchedule,
    generateId,
    resetToDefaults,
  };
}
