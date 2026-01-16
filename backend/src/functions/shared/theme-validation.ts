import {
  type ThemeId,
  type ThemeUpdateRequest,
  type ThemeColors,
  type ThemeDarkColors,
  type ThemeFonts,
  type CustomThemeData,
  isValidThemeId,
} from "./theme-constants";

// Validation result type
export type ValidationResult =
  | { valid: true; data: ThemeUpdateRequest }
  | { valid: false; error: string };

// Validate hex color format (#RRGGBB or #RGB)
export function isValidHexColor(color: unknown): boolean {
  if (typeof color !== "string") return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Validate font family string
export function isValidFontFamily(font: unknown): boolean {
  if (typeof font !== "string") return false;
  // Allow alphanumeric, spaces, and common punctuation
  return font.trim().length > 0 && font.length <= 100;
}

// Validate Google Font URL
export function isValidGoogleFontUrl(url: unknown): boolean {
  if (typeof url !== "string") return false;
  return (
    url.startsWith("https://fonts.googleapis.com/css2?") && url.length <= 1000
  );
}

// Validate light mode colors object
function validateLightColors(
  colors: unknown,
): { valid: true; data: ThemeColors } | { valid: false; error: string } {
  if (typeof colors !== "object" || colors === null) {
    return { valid: false, error: "Light colors object is required" };
  }

  const c = colors as Record<string, unknown>;

  const requiredFields: (keyof ThemeColors)[] = [
    "primary",
    "primaryLight",
    "primaryDark",
    "secondary",
    "secondaryDark",
    "text",
    "textLight",
    "background",
  ];

  for (const field of requiredFields) {
    if (!isValidHexColor(c[field])) {
      return {
        valid: false,
        error: `Invalid or missing light color: ${field}. Must be a valid hex color (e.g., #RRGGBB)`,
      };
    }
  }

  return {
    valid: true,
    data: {
      primary: c.primary as string,
      primaryLight: c.primaryLight as string,
      primaryDark: c.primaryDark as string,
      secondary: c.secondary as string,
      secondaryDark: c.secondaryDark as string,
      text: c.text as string,
      textLight: c.textLight as string,
      background: c.background as string,
    },
  };
}

// Validate dark mode colors object
function validateDarkColors(
  colors: unknown,
): { valid: true; data: ThemeDarkColors } | { valid: false; error: string } {
  if (typeof colors !== "object" || colors === null) {
    return { valid: false, error: "Dark colors object is required" };
  }

  const c = colors as Record<string, unknown>;

  const requiredFields: (keyof ThemeDarkColors)[] = [
    "background",
    "backgroundSecondary",
    "backgroundElevated",
    "border",
    "text",
    "textSecondary",
  ];

  for (const field of requiredFields) {
    if (!isValidHexColor(c[field])) {
      return {
        valid: false,
        error: `Invalid or missing dark color: ${field}. Must be a valid hex color (e.g., #RRGGBB)`,
      };
    }
  }

  return {
    valid: true,
    data: {
      background: c.background as string,
      backgroundSecondary: c.backgroundSecondary as string,
      backgroundElevated: c.backgroundElevated as string,
      border: c.border as string,
      text: c.text as string,
      textSecondary: c.textSecondary as string,
    },
  };
}

// Validate fonts object
function validateFonts(
  fonts: unknown,
): { valid: true; data: ThemeFonts } | { valid: false; error: string } {
  if (typeof fonts !== "object" || fonts === null) {
    return { valid: false, error: "Fonts object is required" };
  }

  const f = fonts as Record<string, unknown>;

  if (!isValidFontFamily(f.heading)) {
    return { valid: false, error: "Invalid or missing heading font family" };
  }

  if (!isValidFontFamily(f.body)) {
    return { valid: false, error: "Invalid or missing body font family" };
  }

  if (!isValidGoogleFontUrl(f.googleFontUrl)) {
    return { valid: false, error: "Invalid or missing Google Font URL" };
  }

  return {
    valid: true,
    data: {
      heading: (f.heading as string).trim(),
      body: (f.body as string).trim(),
      googleFontUrl: (f.googleFontUrl as string).trim(),
    },
  };
}

// Validate custom theme data
function validateCustomTheme(
  customTheme: unknown,
): { valid: true; data: CustomThemeData } | { valid: false; error: string } {
  if (typeof customTheme !== "object" || customTheme === null) {
    return {
      valid: false,
      error: "Custom theme data is required when activeThemeId is 'custom'",
    };
  }

  const ct = customTheme as Record<string, unknown>;

  // Validate name
  if (typeof ct.name !== "string" || !ct.name.trim()) {
    return { valid: false, error: "Custom theme name is required" };
  }
  if (ct.name.length > 50) {
    return {
      valid: false,
      error: "Custom theme name must be 50 characters or less",
    };
  }

  // Validate colors
  if (typeof ct.colors !== "object" || ct.colors === null) {
    return { valid: false, error: "Custom theme colors are required" };
  }

  const colors = ct.colors as Record<string, unknown>;

  const lightResult = validateLightColors(colors.light);
  if (!lightResult.valid) {
    return { valid: false, error: lightResult.error };
  }

  const darkResult = validateDarkColors(colors.dark);
  if (!darkResult.valid) {
    return { valid: false, error: darkResult.error };
  }

  // Validate fonts
  const fontsResult = validateFonts(ct.fonts);
  if (!fontsResult.valid) {
    return { valid: false, error: fontsResult.error };
  }

  return {
    valid: true,
    data: {
      name: ct.name.trim(),
      colors: {
        light: lightResult.data,
        dark: darkResult.data,
      },
      fonts: fontsResult.data,
    },
  };
}

// Main validation function for theme update request
export function validateThemeUpdate(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { valid: false, error: "Invalid request body" };
  }

  const body = input as Record<string, unknown>;

  // Validate activeThemeId
  if (typeof body.activeThemeId !== "string") {
    return {
      valid: false,
      error: "activeThemeId is required and must be a string",
    };
  }

  if (!isValidThemeId(body.activeThemeId)) {
    return {
      valid: false,
      error:
        "Invalid activeThemeId. Must be one of: earthy-minimalist, romantic-blush, elegant-classic, modern-bold, garden-fresh, rustic-charm, or custom",
    };
  }

  const activeThemeId = body.activeThemeId as ThemeId;

  // If custom theme is selected, validate the custom theme data
  if (activeThemeId === "custom") {
    const customResult = validateCustomTheme(body.customTheme);
    if (!customResult.valid) {
      return { valid: false, error: customResult.error };
    }

    return {
      valid: true,
      data: {
        activeThemeId,
        customTheme: customResult.data,
      },
    };
  }

  // For preset themes, custom theme data is ignored
  return {
    valid: true,
    data: {
      activeThemeId,
    },
  };
}
