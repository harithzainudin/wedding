// Theme identifier types
export type PresetThemeId =
  | 'earthy-minimalist'
  | 'romantic-blush'
  | 'elegant-classic'
  | 'modern-bold'
  | 'garden-fresh'
  | 'rustic-charm'
  | 'ocean-breeze'
  | 'lavender-dream'
  | 'midnight-luxe'
  | 'sunset-glow'

export type ThemeId = PresetThemeId | 'custom'

// Light mode color palette structure
export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryDark: string
  text: string
  textLight: string
  background: string
}

// Dark mode color overrides
export interface ThemeDarkColors {
  background: string
  backgroundSecondary: string
  backgroundElevated: string
  border: string
  text: string
  textSecondary: string
}

// Font pairing structure
export interface ThemeFonts {
  heading: string
  body: string
  googleFontUrl: string
}

// Complete theme definition
export interface ThemeDefinition {
  id: PresetThemeId
  name: string
  description: string
  colors: {
    light: ThemeColors
    dark: ThemeDarkColors
  }
  fonts: ThemeFonts
}

// Custom theme data (user-created)
export interface CustomThemeData {
  name: string
  colors: {
    light: ThemeColors
    dark: ThemeDarkColors
  }
  fonts: ThemeFonts
}

// Theme settings stored in database
export interface ThemeSettings {
  activeThemeId: ThemeId
  customTheme?: CustomThemeData
  updatedAt?: string
  updatedBy?: string
}

// API request type
export interface ThemeUpdateRequest {
  activeThemeId: ThemeId
  customTheme?: CustomThemeData
}

// Default theme ID
export const DEFAULT_THEME_ID: PresetThemeId = 'earthy-minimalist'

// All preset theme IDs
export const PRESET_THEME_IDS: PresetThemeId[] = [
  'earthy-minimalist',
  'romantic-blush',
  'elegant-classic',
  'modern-bold',
  'garden-fresh',
  'rustic-charm',
  'ocean-breeze',
  'lavender-dream',
  'midnight-luxe',
  'sunset-glow',
]

// All 10 default theme definitions
export const DEFAULT_THEMES: Record<PresetThemeId, ThemeDefinition> = {
  'earthy-minimalist': {
    id: 'earthy-minimalist',
    name: 'Earthy Minimalist',
    description: 'Warm sage greens with natural sand tones',
    colors: {
      light: {
        primary: '#7c8363',
        primaryLight: '#9ba58a',
        primaryDark: '#5d6349',
        secondary: '#f5f2ed',
        secondaryDark: '#e8e3db',
        text: '#333333',
        textLight: '#555555',
        background: '#f5f2ed',
      },
      dark: {
        background: '#1a1a1a',
        backgroundSecondary: '#2a2a2a',
        backgroundElevated: '#3a3a3a',
        border: '#444444',
        text: '#f5f2ed',
        textSecondary: '#c8c4bc',
      },
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Montserrat',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600&display=swap',
    },
  },
  'romantic-blush': {
    id: 'romantic-blush',
    name: 'Romantic Blush',
    description: 'Soft dusty rose with elegant cream accents',
    colors: {
      light: {
        primary: '#d4a5a5',
        primaryLight: '#e8c4c4',
        primaryDark: '#8b5a5a',
        secondary: '#faf8f5',
        secondaryDark: '#f0ebe5',
        text: '#4a3c3c',
        textLight: '#6b5a5a',
        background: '#faf8f5',
      },
      dark: {
        background: '#1f1a1a',
        backgroundSecondary: '#2a2424',
        backgroundElevated: '#3a3232',
        border: '#4a4040',
        text: '#faf8f5',
        textSecondary: '#d4c4c4',
      },
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Lato',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Lato:wght@300;400;500;700&display=swap',
    },
  },
  'elegant-classic': {
    id: 'elegant-classic',
    name: 'Elegant Classic',
    description: 'Timeless gold with sophisticated ivory',
    colors: {
      light: {
        primary: '#c9a227',
        primaryLight: '#dfc463',
        primaryDark: '#9a7a1d',
        secondary: '#fffff0',
        secondaryDark: '#f5f5dc',
        text: '#1a2233',
        textLight: '#3a4a5a',
        background: '#fffff0',
      },
      dark: {
        background: '#141820',
        backgroundSecondary: '#1e242e',
        backgroundElevated: '#282e3a',
        border: '#3a4050',
        text: '#fffff0',
        textSecondary: '#c8c8b8',
      },
    },
    fonts: {
      heading: 'Cinzel',
      body: 'Raleway',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Raleway:wght@300;400;500;600&display=swap',
    },
  },
  'modern-bold': {
    id: 'modern-bold',
    name: 'Modern Bold',
    description: 'Vibrant coral with clean contemporary style',
    colors: {
      light: {
        primary: '#ff6b6b',
        primaryLight: '#ff9999',
        primaryDark: '#cc4444',
        secondary: '#ffffff',
        secondaryDark: '#f5f5f5',
        text: '#2d2d2d',
        textLight: '#555555',
        background: '#ffffff',
      },
      dark: {
        background: '#1a1a1a',
        backgroundSecondary: '#252525',
        backgroundElevated: '#333333',
        border: '#444444',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
      },
    },
    fonts: {
      heading: 'Josefin Sans',
      body: 'Source Sans Pro',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600;700&family=Source+Sans+Pro:wght@300;400;500;600&display=swap',
    },
  },
  'garden-fresh': {
    id: 'garden-fresh',
    name: 'Garden Fresh',
    description: 'Lush forest green with fresh mint tones',
    colors: {
      light: {
        primary: '#2d5a27',
        primaryLight: '#4a8a42',
        primaryDark: '#1e3d1a',
        secondary: '#f0fff4',
        secondaryDark: '#d4f0dc',
        text: '#1a2818',
        textLight: '#3a4838',
        background: '#f0fff4',
      },
      dark: {
        background: '#0f1810',
        backgroundSecondary: '#1a251a',
        backgroundElevated: '#253225',
        border: '#354535',
        text: '#f0fff4',
        textSecondary: '#b8d4bc',
      },
    },
    fonts: {
      heading: 'Libre Baskerville',
      body: 'Open Sans',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Open+Sans:wght@300;400;500;600&display=swap',
    },
  },
  'rustic-charm': {
    id: 'rustic-charm',
    name: 'Rustic Charm',
    description: 'Warm terracotta with cozy linen textures',
    colors: {
      light: {
        primary: '#c4795b',
        primaryLight: '#d9a088',
        primaryDark: '#8f5840',
        secondary: '#faf0e6',
        secondaryDark: '#f0e0d0',
        text: '#3c2415',
        textLight: '#5a4030',
        background: '#faf0e6',
      },
      dark: {
        background: '#1a1410',
        backgroundSecondary: '#251e18',
        backgroundElevated: '#322820',
        border: '#4a3c30',
        text: '#faf0e6',
        textSecondary: '#c8b8a8',
      },
    },
    fonts: {
      heading: 'Amatic SC',
      body: 'Roboto',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=Roboto:wght@300;400;500;700&display=swap',
    },
  },
  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Calming coastal blues with sandy neutrals',
    colors: {
      light: {
        primary: '#4a90a4',
        primaryLight: '#7ab8cc',
        primaryDark: '#2d6a7a',
        secondary: '#f5f9fa',
        secondaryDark: '#e0eef2',
        text: '#1a3a45',
        textLight: '#3a5a65',
        background: '#f5f9fa',
      },
      dark: {
        background: '#0f1a1e',
        backgroundSecondary: '#1a2a30',
        backgroundElevated: '#253a42',
        border: '#354a52',
        text: '#f5f9fa',
        textSecondary: '#a8c8d4',
      },
    },
    fonts: {
      heading: 'Merriweather',
      body: 'Nunito',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Nunito:wght@300;400;500;600&display=swap',
    },
  },
  'lavender-dream': {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Soft purple hues with romantic elegance',
    colors: {
      light: {
        primary: '#9b7bb8',
        primaryLight: '#c4a8d8',
        primaryDark: '#6d4a8a',
        secondary: '#faf8fc',
        secondaryDark: '#f0e8f5',
        text: '#3a2845',
        textLight: '#5a4865',
        background: '#faf8fc',
      },
      dark: {
        background: '#1a161e',
        backgroundSecondary: '#2a2430',
        backgroundElevated: '#3a3242',
        border: '#4a4052',
        text: '#faf8fc',
        textSecondary: '#c8b8d8',
      },
    },
    fonts: {
      heading: 'Dancing Script',
      body: 'Poppins',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap',
    },
  },
  'midnight-luxe': {
    id: 'midnight-luxe',
    name: 'Midnight Luxe',
    description: 'Deep navy elegance with gold accents',
    colors: {
      light: {
        primary: '#1e3a5f',
        primaryLight: '#3a5a8a',
        primaryDark: '#0f1f35',
        secondary: '#f8f6f0',
        secondaryDark: '#ebe8e0',
        text: '#1a1a2e',
        textLight: '#3a3a4e',
        background: '#f8f6f0',
      },
      dark: {
        background: '#0a0e14',
        backgroundSecondary: '#141a24',
        backgroundElevated: '#1e2834',
        border: '#2e3a48',
        text: '#f8f6f0',
        textSecondary: '#b8b4a8',
      },
    },
    fonts: {
      heading: 'Cinzel Decorative',
      body: 'Cormorant',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant:wght@300;400;500;600&display=swap',
    },
  },
  'sunset-glow': {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm amber and coral sunset vibes',
    colors: {
      light: {
        primary: '#e07850',
        primaryLight: '#f0a080',
        primaryDark: '#b85830',
        secondary: '#fff8f0',
        secondaryDark: '#f5e8d8',
        text: '#3a2010',
        textLight: '#5a4030',
        background: '#fff8f0',
      },
      dark: {
        background: '#1a1008',
        backgroundSecondary: '#2a1810',
        backgroundElevated: '#3a2818',
        border: '#4a3828',
        text: '#fff8f0',
        textSecondary: '#d8c8b0',
      },
    },
    fonts: {
      heading: 'Great Vibes',
      body: 'Quicksand',
      googleFontUrl:
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Quicksand:wght@300;400;500;600&display=swap',
    },
  },
}

// Default theme settings (fallback when no data exists in DB)
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  activeThemeId: DEFAULT_THEME_ID,
}

// Get a preset theme by ID
export function getPresetTheme(id: PresetThemeId): ThemeDefinition {
  return DEFAULT_THEMES[id]
}

// Check if a theme ID is a valid preset
export function isPresetThemeId(id: string): id is PresetThemeId {
  return PRESET_THEME_IDS.includes(id as PresetThemeId)
}

// Check if a theme ID is valid (preset or custom)
export function isValidThemeId(id: string): id is ThemeId {
  return id === 'custom' || isPresetThemeId(id)
}
