// Types for wedding details CMS

export interface CoupleInfo {
  fullName: string;
  nickname: string;
}

export interface ParentsInfo {
  father: string;
  mother: string;
}

export interface WeddingDetailsData {
  couple: {
    bride: CoupleInfo;
    groom: CoupleInfo;
  };
  parents: {
    bride: ParentsInfo;
    groom: ParentsInfo;
  };
  eventDate: string; // ISO datetime string
  dressCode: string;
  hashtag: string;
  qrCodeUrl: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface WeddingDetailsUpdateRequest {
  couple: {
    bride: CoupleInfo;
    groom: CoupleInfo;
  };
  parents: {
    bride: ParentsInfo;
    groom: ParentsInfo;
  };
  eventDate: string;
  dressCode: string;
  hashtag: string;
  qrCodeUrl: string;
}

function validateCoupleInfo(
  info: unknown,
  label: string
): { valid: true; data: CoupleInfo } | { valid: false; error: string } {
  if (typeof info !== "object" || info === null) {
    return { valid: false, error: `${label} info is required` };
  }

  const obj = info as Record<string, unknown>;

  if (typeof obj.fullName !== "string" || !obj.fullName.trim()) {
    return { valid: false, error: `${label} full name is required` };
  }
  if (obj.fullName.length > 100) {
    return { valid: false, error: `${label} full name must be 100 characters or less` };
  }

  if (typeof obj.nickname !== "string" || !obj.nickname.trim()) {
    return { valid: false, error: `${label} nickname is required` };
  }
  if (obj.nickname.length > 50) {
    return { valid: false, error: `${label} nickname must be 50 characters or less` };
  }

  return {
    valid: true,
    data: {
      fullName: obj.fullName.trim(),
      nickname: obj.nickname.trim(),
    },
  };
}

function validateParentsInfo(
  info: unknown,
  label: string
): { valid: true; data: ParentsInfo } | { valid: false; error: string } {
  if (typeof info !== "object" || info === null) {
    return { valid: false, error: `${label} parents info is required` };
  }

  const obj = info as Record<string, unknown>;

  if (typeof obj.father !== "string" || !obj.father.trim()) {
    return { valid: false, error: `${label}'s father name is required` };
  }
  if (obj.father.length > 100) {
    return { valid: false, error: `${label}'s father name must be 100 characters or less` };
  }

  if (typeof obj.mother !== "string" || !obj.mother.trim()) {
    return { valid: false, error: `${label}'s mother name is required` };
  }
  if (obj.mother.length > 100) {
    return { valid: false, error: `${label}'s mother name must be 100 characters or less` };
  }

  return {
    valid: true,
    data: {
      father: obj.father.trim(),
      mother: obj.mother.trim(),
    },
  };
}

export function validateWeddingDetailsUpdate(
  input: unknown
): { valid: true; data: WeddingDetailsUpdateRequest } | { valid: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { valid: false, error: "Invalid request body" };
  }

  const body = input as Record<string, unknown>;

  // Validate couple
  if (typeof body.couple !== "object" || body.couple === null) {
    return { valid: false, error: "Couple information is required" };
  }

  const couple = body.couple as Record<string, unknown>;

  const brideResult = validateCoupleInfo(couple.bride, "Bride");
  if (!brideResult.valid) return { valid: false, error: brideResult.error };

  const groomResult = validateCoupleInfo(couple.groom, "Groom");
  if (!groomResult.valid) return { valid: false, error: groomResult.error };

  // Validate parents
  if (typeof body.parents !== "object" || body.parents === null) {
    return { valid: false, error: "Parents information is required" };
  }

  const parents = body.parents as Record<string, unknown>;

  const brideParentsResult = validateParentsInfo(parents.bride, "Bride");
  if (!brideParentsResult.valid) return { valid: false, error: brideParentsResult.error };

  const groomParentsResult = validateParentsInfo(parents.groom, "Groom");
  if (!groomParentsResult.valid) return { valid: false, error: groomParentsResult.error };

  // Validate eventDate
  if (typeof body.eventDate !== "string" || !body.eventDate.trim()) {
    return { valid: false, error: "Event date is required" };
  }

  // Validate date format
  const dateObj = new Date(body.eventDate);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: "Invalid event date format" };
  }

  // Validate dressCode
  if (typeof body.dressCode !== "string" || !body.dressCode.trim()) {
    return { valid: false, error: "Dress code is required" };
  }
  if (body.dressCode.length > 100) {
    return { valid: false, error: "Dress code must be 100 characters or less" };
  }

  // Validate hashtag
  if (typeof body.hashtag !== "string" || !body.hashtag.trim()) {
    return { valid: false, error: "Hashtag is required" };
  }
  if (body.hashtag.length > 50) {
    return { valid: false, error: "Hashtag must be 50 characters or less" };
  }

  // Validate qrCodeUrl
  if (typeof body.qrCodeUrl !== "string" || !body.qrCodeUrl.trim()) {
    return { valid: false, error: "QR code URL is required" };
  }
  if (body.qrCodeUrl.length > 500) {
    return { valid: false, error: "QR code URL must be 500 characters or less" };
  }

  return {
    valid: true,
    data: {
      couple: {
        bride: brideResult.data,
        groom: groomResult.data,
      },
      parents: {
        bride: brideParentsResult.data,
        groom: groomParentsResult.data,
      },
      eventDate: body.eventDate.trim(),
      dressCode: body.dressCode.trim(),
      hashtag: body.hashtag.trim(),
      qrCodeUrl: body.qrCodeUrl.trim(),
    },
  };
}

// Default wedding details data (fallback when no data exists in DB)
export const DEFAULT_WEDDING_DETAILS: WeddingDetailsData = {
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
