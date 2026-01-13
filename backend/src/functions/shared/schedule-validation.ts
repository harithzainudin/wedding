// Types for schedule CMS

export interface MultilingualText {
  ms: string; // Malay
  en: string; // English
  zh: string; // Chinese
  ta: string; // Tamil
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: MultilingualText;
  order: number;
}

export interface ScheduleData {
  items: ScheduleItem[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ScheduleUpdateRequest {
  items: ScheduleItem[];
}

function validateMultilingualText(
  text: unknown,
  label: string
): { valid: true; data: MultilingualText } | { valid: false; error: string } {
  if (typeof text !== "object" || text === null) {
    return { valid: false, error: `${label} is required` };
  }

  const obj = text as Record<string, unknown>;

  // Validate each language
  const languages = ["ms", "en", "zh", "ta"] as const;
  const result: Record<string, string> = {};

  for (const lang of languages) {
    if (typeof obj[lang] !== "string") {
      return { valid: false, error: `${label} ${lang} is required` };
    }
    if (obj[lang].length > 200) {
      return { valid: false, error: `${label} ${lang} must be 200 characters or less` };
    }
    result[lang] = (obj[lang] as string).trim();
  }

  return {
    valid: true,
    data: result as unknown as MultilingualText,
  };
}

function validateScheduleItem(
  item: unknown,
  index: number
): { valid: true; data: ScheduleItem } | { valid: false; error: string } {
  if (typeof item !== "object" || item === null) {
    return { valid: false, error: `Schedule item ${index + 1} is invalid` };
  }

  const obj = item as Record<string, unknown>;

  // Validate id
  if (typeof obj.id !== "string" || !obj.id.trim()) {
    return { valid: false, error: `Schedule item ${index + 1} id is required` };
  }

  // Validate time
  if (typeof obj.time !== "string" || !obj.time.trim()) {
    return { valid: false, error: `Schedule item ${index + 1} time is required` };
  }
  if (obj.time.length > 20) {
    return { valid: false, error: `Schedule item ${index + 1} time must be 20 characters or less` };
  }

  // Validate title
  const titleResult = validateMultilingualText(obj.title, `Schedule item ${index + 1} title`);
  if (!titleResult.valid) return { valid: false, error: titleResult.error };

  // Validate order
  if (typeof obj.order !== "number" || !Number.isInteger(obj.order) || obj.order < 0) {
    return { valid: false, error: `Schedule item ${index + 1} order must be a non-negative integer` };
  }

  return {
    valid: true,
    data: {
      id: obj.id.trim(),
      time: obj.time.trim(),
      title: titleResult.data,
      order: obj.order,
    },
  };
}

export function validateScheduleUpdate(
  input: unknown
): { valid: true; data: ScheduleUpdateRequest } | { valid: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { valid: false, error: "Invalid request body" };
  }

  const body = input as Record<string, unknown>;

  // Validate items array
  if (!Array.isArray(body.items)) {
    return { valid: false, error: "Schedule items must be an array" };
  }

  if (body.items.length > 20) {
    return { valid: false, error: "Maximum 20 schedule items allowed" };
  }

  const validatedItems: ScheduleItem[] = [];

  for (let i = 0; i < body.items.length; i++) {
    const itemResult = validateScheduleItem(body.items[i], i);
    if (!itemResult.valid) return { valid: false, error: itemResult.error };
    validatedItems.push(itemResult.data);
  }

  // Sort by order
  validatedItems.sort((a, b) => a.order - b.order);

  return {
    valid: true,
    data: {
      items: validatedItems,
    },
  };
}

// Default schedule data (fallback when no data exists in DB)
export const DEFAULT_SCHEDULE: ScheduleData = {
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
