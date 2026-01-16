import { ref, readonly } from "vue";
import type { ResolvedTheme, ThemeId, CustomThemeData } from "@/types/theme";
import { DEFAULT_THEMES, isPresetThemeId, DEFAULT_THEME_ID } from "@/constants/themes";
import { applyTheme } from "@/utils/themeInjector";

// Singleton state for preview mode
const isPreviewMode = ref(false);
const previewTheme = ref<ResolvedTheme | null>(null);
const savedThemeId = ref<ThemeId>(DEFAULT_THEME_ID);
const savedCustomTheme = ref<CustomThemeData | undefined>(undefined);

/**
 * Composable for managing theme preview mode
 * Allows previewing themes without saving them
 */
export function useThemePreview() {
  /**
   * Start previewing a theme
   * Stores the current theme so it can be restored later
   */
  const startPreview = (
    themeId: ThemeId,
    customTheme?: CustomThemeData,
    currentThemeId?: ThemeId,
    currentCustomTheme?: CustomThemeData
  ): void => {
    // Save current theme state if provided
    if (currentThemeId) {
      savedThemeId.value = currentThemeId;
      savedCustomTheme.value = currentCustomTheme;
    }

    isPreviewMode.value = true;

    // Resolve and apply the preview theme
    let theme: ResolvedTheme;

    if (themeId === "custom" && customTheme) {
      theme = {
        id: "custom",
        name: customTheme.name,
        description: "Custom theme",
        colors: customTheme.colors,
        fonts: customTheme.fonts,
      };
    } else if (isPresetThemeId(themeId)) {
      theme = DEFAULT_THEMES[themeId];
    } else {
      theme = DEFAULT_THEMES[DEFAULT_THEME_ID];
    }

    previewTheme.value = theme;
    applyTheme(theme);
  };

  /**
   * End preview mode and restore the saved theme
   */
  const endPreview = (): void => {
    if (!isPreviewMode.value) return;

    isPreviewMode.value = false;
    previewTheme.value = null;

    // Restore saved theme
    let theme: ResolvedTheme;

    if (savedThemeId.value === "custom" && savedCustomTheme.value) {
      theme = {
        id: "custom",
        name: savedCustomTheme.value.name,
        description: "Custom theme",
        colors: savedCustomTheme.value.colors,
        fonts: savedCustomTheme.value.fonts,
      };
    } else if (isPresetThemeId(savedThemeId.value)) {
      theme = DEFAULT_THEMES[savedThemeId.value];
    } else {
      theme = DEFAULT_THEMES[DEFAULT_THEME_ID];
    }

    applyTheme(theme);
  };

  /**
   * Update the preview theme without ending preview mode
   * Useful for real-time preview while adjusting custom colors
   */
  const updatePreview = (themeId: ThemeId, customTheme?: CustomThemeData): void => {
    if (!isPreviewMode.value) {
      // Start preview mode if not already in it
      startPreview(themeId, customTheme);
      return;
    }

    let theme: ResolvedTheme;

    if (themeId === "custom" && customTheme) {
      theme = {
        id: "custom",
        name: customTheme.name,
        description: "Custom theme",
        colors: customTheme.colors,
        fonts: customTheme.fonts,
      };
    } else if (isPresetThemeId(themeId)) {
      theme = DEFAULT_THEMES[themeId];
    } else {
      theme = DEFAULT_THEMES[DEFAULT_THEME_ID];
    }

    previewTheme.value = theme;
    applyTheme(theme);
  };

  /**
   * Set the saved theme state
   * Call this when the saved theme changes (e.g., after loading from API)
   */
  const setSavedTheme = (themeId: ThemeId, customTheme?: CustomThemeData): void => {
    savedThemeId.value = themeId;
    savedCustomTheme.value = customTheme;
  };

  return {
    isPreviewMode: readonly(isPreviewMode),
    previewTheme: readonly(previewTheme),
    startPreview,
    endPreview,
    updatePreview,
    setSavedTheme,
  };
}
