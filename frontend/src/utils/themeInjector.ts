import type { ResolvedTheme } from "@/types/theme";

// CSS variable names for theme colors
const THEME_CSS_VARIABLES = {
  // Light mode
  primary: "--theme-primary",
  primaryLight: "--theme-primary-light",
  primaryDark: "--theme-primary-dark",
  secondary: "--theme-secondary",
  secondaryDark: "--theme-secondary-dark",
  text: "--theme-text",
  textLight: "--theme-text-light",
  background: "--theme-background",
  // Dark mode
  darkBg: "--theme-dark-bg",
  darkBgSecondary: "--theme-dark-bg-secondary",
  darkBgElevated: "--theme-dark-bg-elevated",
  darkBorder: "--theme-dark-border",
  darkText: "--theme-dark-text",
  darkTextSecondary: "--theme-dark-text-secondary",
  // Fonts
  fontHeading: "--theme-font-heading",
  fontBody: "--theme-font-body",
} as const;

/**
 * Inject theme CSS variables into the document root
 */
export function injectThemeVariables(theme: ResolvedTheme): void {
  const root = document.documentElement;

  // Light mode colors
  root.style.setProperty(THEME_CSS_VARIABLES.primary, theme.colors.light.primary);
  root.style.setProperty(THEME_CSS_VARIABLES.primaryLight, theme.colors.light.primaryLight);
  root.style.setProperty(THEME_CSS_VARIABLES.primaryDark, theme.colors.light.primaryDark);
  root.style.setProperty(THEME_CSS_VARIABLES.secondary, theme.colors.light.secondary);
  root.style.setProperty(THEME_CSS_VARIABLES.secondaryDark, theme.colors.light.secondaryDark);
  root.style.setProperty(THEME_CSS_VARIABLES.text, theme.colors.light.text);
  root.style.setProperty(THEME_CSS_VARIABLES.textLight, theme.colors.light.textLight);
  root.style.setProperty(THEME_CSS_VARIABLES.background, theme.colors.light.background);

  // Dark mode colors
  root.style.setProperty(THEME_CSS_VARIABLES.darkBg, theme.colors.dark.background);
  root.style.setProperty(THEME_CSS_VARIABLES.darkBgSecondary, theme.colors.dark.backgroundSecondary);
  root.style.setProperty(THEME_CSS_VARIABLES.darkBgElevated, theme.colors.dark.backgroundElevated);
  root.style.setProperty(THEME_CSS_VARIABLES.darkBorder, theme.colors.dark.border);
  root.style.setProperty(THEME_CSS_VARIABLES.darkText, theme.colors.dark.text);
  root.style.setProperty(THEME_CSS_VARIABLES.darkTextSecondary, theme.colors.dark.textSecondary);

  // Fonts
  root.style.setProperty(THEME_CSS_VARIABLES.fontHeading, `"${theme.fonts.heading}"`);
  root.style.setProperty(THEME_CSS_VARIABLES.fontBody, `"${theme.fonts.body}"`);
}

/**
 * Remove all theme CSS variables from the document root
 */
export function removeThemeVariables(): void {
  const root = document.documentElement;

  Object.values(THEME_CSS_VARIABLES).forEach((variable) => {
    root.style.removeProperty(variable);
  });
}

/**
 * Load Google Fonts dynamically
 * Removes any existing dynamic font link and adds a new one
 */
export function loadGoogleFonts(fontUrl: string): void {
  // Remove existing dynamic font link if present
  const existingLink = document.querySelector('link[data-theme-fonts="dynamic"]');
  if (existingLink) {
    existingLink.remove();
  }

  // Don't add if it's the same as the static font (default theme)
  const staticFontLink = document.querySelector('link[href*="fonts.googleapis.com"]');
  if (staticFontLink && staticFontLink.getAttribute("href") === fontUrl) {
    return;
  }

  // Create and add new font link
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = fontUrl;
  link.setAttribute("data-theme-fonts", "dynamic");
  document.head.appendChild(link);
}

/**
 * Apply a complete theme (inject variables + load fonts)
 */
export function applyTheme(theme: ResolvedTheme): void {
  injectThemeVariables(theme);
  loadGoogleFonts(theme.fonts.googleFontUrl);
}

/**
 * Store theme ID in localStorage for instant application on page load
 */
export function storeThemePreference(themeId: string): void {
  try {
    localStorage.setItem("wedding-theme-id", themeId);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Get stored theme ID from localStorage
 */
export function getStoredThemePreference(): string | null {
  try {
    return localStorage.getItem("wedding-theme-id");
  } catch {
    return null;
  }
}

/**
 * Clear stored theme preference
 */
export function clearStoredThemePreference(): void {
  try {
    localStorage.removeItem("wedding-theme-id");
  } catch {
    // localStorage might not be available
  }
}
