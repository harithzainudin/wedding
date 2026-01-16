import { ref } from "vue";
import {
  getWeddingDetailsCached,
  getScheduleCached,
  getContactsCached,
} from "@/services/api";
import { weddingConfig } from "@/config/wedding";
import type {
  WeddingDetailsData,
  EventDisplayFormat,
  DisplayNameOrder,
  BismillahCalligraphySettings,
  ParentsVisibilitySettings,
} from "@/types/weddingDetails";
import {
  DEFAULT_DISPLAY_FORMAT,
  DEFAULT_BISMILLAH_SETTINGS,
  DEFAULT_PARENTS_VISIBILITY,
} from "@/types/weddingDetails";
import type { ScheduleData, ScheduleItem } from "@/types/schedule";
import type { ContactsData, ContactPerson } from "@/types/contacts";

// Singleton state for public wedding data
const weddingDetails = ref<WeddingDetailsData | null>(null);
const scheduleData = ref<ScheduleData | null>(null);
const contactsData = ref<ContactsData | null>(null);
const isLoading = ref(false);
const hasLoaded = ref(false);

// Individual loading states for better UX
const isLoadingWeddingDetails = ref(false);
const isLoadingSchedule = ref(false);
const isLoadingContacts = ref(false);

// Convert API schedule to config format for backward compatibility
interface LegacyScheduleItem {
  time: string;
  title: string;
  titleMalay: string;
}

export function usePublicWeddingData() {
  // Fetch all public data from APIs (uses caching to prevent duplicate calls)
  const fetchPublicData = async (): Promise<void> => {
    if (hasLoaded.value) return; // Only fetch once per session

    isLoading.value = true;
    isLoadingWeddingDetails.value = true;
    isLoadingSchedule.value = true;
    isLoadingContacts.value = true;

    try {
      // Fetch all data in parallel using cached API functions
      // Cache deduplicates simultaneous requests automatically
      const weddingPromise = getWeddingDetailsCached()
        .then((data) => {
          weddingDetails.value = data;
        })
        .catch((err) => {
          console.error("Failed to fetch wedding details:", err);
        })
        .finally(() => {
          isLoadingWeddingDetails.value = false;
        });

      const schedulePromise = getScheduleCached()
        .then((data) => {
          scheduleData.value = data;
        })
        .catch((err) => {
          console.error("Failed to fetch schedule:", err);
        })
        .finally(() => {
          isLoadingSchedule.value = false;
        });

      const contactsPromise = getContactsCached()
        .then((data) => {
          contactsData.value = data;
        })
        .catch((err) => {
          console.error("Failed to fetch contacts:", err);
        })
        .finally(() => {
          isLoadingContacts.value = false;
        });

      // Wait for all to complete
      await Promise.all([weddingPromise, schedulePromise, contactsPromise]);
    } catch (error) {
      console.error("Failed to fetch public data:", error);
    } finally {
      isLoading.value = false;
      hasLoaded.value = true;
    }
  };

  // Computed getters with fallback to config

  // Couple info with fallback
  const getCoupleNames = () => {
    if (weddingDetails.value) {
      return {
        bride: {
          fullName: weddingDetails.value.couple.bride.fullName,
          nickname: weddingDetails.value.couple.bride.nickname,
        },
        groom: {
          fullName: weddingDetails.value.couple.groom.fullName,
          nickname: weddingDetails.value.couple.groom.nickname,
        },
      };
    }
    return weddingConfig.couple;
  };

  // Parents info with fallback
  const getParents = () => {
    if (weddingDetails.value) {
      return weddingDetails.value.parents;
    }
    return weddingConfig.parents;
  };

  // Event date with fallback
  const getEventDate = (): Date => {
    if (weddingDetails.value?.eventDate) {
      return new Date(weddingDetails.value.eventDate);
    }
    return weddingConfig.event.date;
  };

  // Event end time with fallback
  const getEventEndTime = (): Date | null => {
    if (weddingDetails.value?.eventEndTime) {
      return new Date(weddingDetails.value.eventEndTime);
    }
    if (weddingConfig.event.endDate) {
      return weddingConfig.event.endDate;
    }
    return null;
  };

  // Event display format with fallback
  const getEventDisplayFormat = (): EventDisplayFormat => {
    if (weddingDetails.value?.eventDisplayFormat) {
      return weddingDetails.value.eventDisplayFormat;
    }
    if (weddingConfig.event.displayFormat) {
      return weddingConfig.event.displayFormat;
    }
    return DEFAULT_DISPLAY_FORMAT;
  };

  // Display name order with fallback (defaults to bride_first - traditional)
  const getDisplayNameOrder = (): DisplayNameOrder => {
    if (weddingDetails.value?.displayNameOrder) {
      return weddingDetails.value.displayNameOrder;
    }
    return "bride_first";
  };

  // Dress code with fallback
  const getDressCode = (): string => {
    if (weddingDetails.value?.dressCode) {
      return weddingDetails.value.dressCode;
    }
    return weddingConfig.dressCode;
  };

  // Hashtag with fallback
  const getHashtag = (): string => {
    if (weddingDetails.value?.hashtag) {
      return weddingDetails.value.hashtag;
    }
    return weddingConfig.hashtag;
  };

  // QR Code URL with fallback
  const getQrCodeUrl = (): string => {
    if (weddingDetails.value?.qrCodeUrl) {
      return weddingDetails.value.qrCodeUrl;
    }
    return "https://harithzainudin.github.io/wedding";
  };

  // Schedule with fallback - converts to legacy format for backward compatibility
  const getSchedule = (): LegacyScheduleItem[] => {
    if (scheduleData.value?.items && scheduleData.value.items.length > 0) {
      return scheduleData.value.items.map((item: ScheduleItem) => ({
        time: item.time,
        title: item.title.en,
        titleMalay: item.title.ms,
      }));
    }
    return weddingConfig.event.schedule;
  };

  // Schedule with multilingual support
  const getScheduleMultilingual = (): ScheduleItem[] => {
    if (scheduleData.value?.items && scheduleData.value.items.length > 0) {
      return scheduleData.value.items;
    }
    // Convert legacy config to multilingual format
    return weddingConfig.event.schedule.map((item, index) => ({
      id: String(index + 1),
      time: item.time,
      title: {
        ms: item.titleMalay,
        en: item.title,
        zh: item.title, // Fallback to English
        ta: item.title, // Fallback to English
      },
      order: index,
    }));
  };

  // Contacts with fallback
  const getContactsList = (): Array<{
    name: string;
    role: string;
    phone: string;
  }> => {
    if (
      contactsData.value?.contacts &&
      contactsData.value.contacts.length > 0
    ) {
      return contactsData.value.contacts.map((contact: ContactPerson) => ({
        name: contact.name,
        role: contact.role.ms, // Default to Malay for backward compatibility
        phone: contact.phoneNumber,
      }));
    }
    return weddingConfig.contacts;
  };

  // Contacts with multilingual support
  const getContactsMultilingual = (): ContactPerson[] => {
    if (
      contactsData.value?.contacts &&
      contactsData.value.contacts.length > 0
    ) {
      return contactsData.value.contacts;
    }
    // Convert legacy config to multilingual format
    return weddingConfig.contacts.map((contact, index) => ({
      id: String(index + 1),
      name: contact.name,
      role: {
        ms: contact.role,
        en: contact.role, // Fallback
        zh: contact.role, // Fallback
        ta: contact.role, // Fallback
      },
      phoneNumber: contact.phone,
      order: index,
    }));
  };

  // Bismillah calligraphy settings with fallback
  const getBismillahSettings = (): BismillahCalligraphySettings => {
    if (weddingDetails.value?.bismillahCalligraphy) {
      return weddingDetails.value.bismillahCalligraphy;
    }
    return DEFAULT_BISMILLAH_SETTINGS;
  };

  // Parents visibility settings with fallback (defaults to showing both)
  const getParentsVisibility = (): ParentsVisibilitySettings => {
    if (weddingDetails.value?.parentsVisibility) {
      return weddingDetails.value.parentsVisibility;
    }
    return DEFAULT_PARENTS_VISIBILITY;
  };

  return {
    isLoading,
    hasLoaded,
    isLoadingWeddingDetails,
    isLoadingSchedule,
    isLoadingContacts,
    weddingDetails,
    scheduleData,
    contactsData,
    fetchPublicData,
    getCoupleNames,
    getParents,
    getEventDate,
    getEventEndTime,
    getEventDisplayFormat,
    getDisplayNameOrder,
    getDressCode,
    getHashtag,
    getQrCodeUrl,
    getSchedule,
    getScheduleMultilingual,
    getContactsList,
    getContactsMultilingual,
    getBismillahSettings,
    getParentsVisibility,
  };
}
