// Theme identifier types
export type PresetThemeId =
  | "earthy-minimalist"
  | "romantic-blush"
  | "elegant-classic"
  | "modern-bold"
  | "garden-fresh"
  | "rustic-charm"
  | "ocean-breeze"
  | "lavender-dream"
  | "midnight-luxe"
  | "sunset-glow";

export type ThemeId = PresetThemeId | "custom";

// Light mode color palette structure
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  text: string;
  textLight: string;
  background: string;
}

// Dark mode color overrides
export interface ThemeDarkColors {
  background: string;
  backgroundSecondary: string;
  backgroundElevated: string;
  border: string;
  text: string;
  textSecondary: string;
}

// Font pairing structure
export interface ThemeFonts {
  heading: string;
  body: string;
  googleFontUrl: string;
}

// Complete theme definition
export interface ThemeDefinition {
  id: PresetThemeId;
  name: string;
  description: string;
  colors: {
    light: ThemeColors;
    dark: ThemeDarkColors;
  };
  fonts: ThemeFonts;
}

// Custom theme data (user-created)
export interface CustomThemeData {
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeDarkColors;
  };
  fonts: ThemeFonts;
}

// Theme settings stored in database
export interface ThemeSettings {
  activeThemeId: ThemeId;
  customTheme?: CustomThemeData | undefined;
  updatedAt?: string;
  updatedBy?: string;
}

// API request type
export interface ThemeUpdateRequest {
  activeThemeId: ThemeId;
  customTheme?: CustomThemeData | undefined;
}

// API response type
export interface ThemeResponse {
  success: boolean;
  data?: ThemeSettings;
  error?: string;
}

// Resolved theme - what gets applied to the page
export interface ResolvedTheme {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    light: ThemeColors;
    dark: ThemeDarkColors;
  };
  fonts: ThemeFonts;
}
