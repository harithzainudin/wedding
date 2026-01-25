/**
 * Design/Layout Types for Wedding Website
 *
 * These types define the layout options and section configuration
 * for customizing the public wedding website presentation.
 */

// Layout type identifiers
export type LayoutId =
  | 'classic-scroll' // Default vertical scroll
  | 'invitation-card' // Opening card animation
  | 'page-slideshow' // Horizontal slides
  | 'storybook' // Vertical page-snap
  | 'elegant-reveal' // Enhanced scroll reveal

// Animation speed options
export type AnimationSpeed = 'none' | 'subtle' | 'normal' | 'dramatic'

// Background feature identifiers (not layout sections)
export type BackgroundFeatureId = 'music'

// Background feature configuration
export interface BackgroundFeatureConfig {
  id: BackgroundFeatureId
  enabled: boolean
}

// Section identifiers matching existing components
export type SectionId =
  | 'hero' // Cannot be hidden or reordered (always first)
  | 'details'
  | 'gallery'
  | 'schedule'
  | 'contact'
  | 'qrcodehub'
  | 'guestbook'
  | 'wishlist'
  | 'rsvp'

// Section visibility and order configuration
export interface SectionConfig {
  id: SectionId
  visible: boolean
  order: number
}

// Layout definition for UI display
export interface LayoutDefinition {
  id: LayoutId
  name: string
  description: string
  mobileSupport: 'full' | 'simplified' | 'fallback'
}

// Layout-specific settings
export interface InvitationCardSettings {
  showCoverText: boolean // Show couple names on cover
  showCoverDate: boolean // Show wedding date on cover
  autoOpenDelay: number // 0 = manual only, >0 = auto-open after X seconds
}

export interface PageSlideshowSettings {
  showDots: boolean
  showArrows: boolean
  autoPlay: boolean
  autoPlayInterval: number // Seconds between slides
}

export interface StorybookSettings {
  showPageNumbers: boolean
}

export interface MagazineGridSettings {
  gridStyle: 'balanced' | 'featured'
}

// Design settings stored in database
export interface DesignSettings {
  layoutId: LayoutId
  animationSpeed: AnimationSpeed
  sections: SectionConfig[]

  // Layout-specific settings (only present if that layout is selected)
  invitationCard?: InvitationCardSettings
  pageSlideshow?: PageSlideshowSettings
  storybook?: StorybookSettings

  // Background features (music, etc.)
  backgroundFeatures?: BackgroundFeatureConfig[]

  // Metadata
  updatedAt?: string
  updatedBy?: string
}

// API request type
export interface DesignUpdateRequest {
  layoutId: LayoutId
  animationSpeed?: AnimationSpeed
  sections?: SectionConfig[]
  invitationCard?: InvitationCardSettings
  pageSlideshow?: PageSlideshowSettings
  storybook?: StorybookSettings
  backgroundFeatures?: BackgroundFeatureConfig[]
}

// API response type
export interface DesignResponse {
  success: boolean
  data?: DesignSettings
  error?: string
}

// Default section order (matches current HomeView order)
export const DEFAULT_SECTION_ORDER: SectionConfig[] = [
  { id: 'hero', visible: true, order: 0 },
  { id: 'details', visible: true, order: 1 },
  { id: 'gallery', visible: true, order: 2 },
  { id: 'schedule', visible: true, order: 3 },
  { id: 'contact', visible: true, order: 4 },
  { id: 'qrcodehub', visible: true, order: 5 },
  { id: 'guestbook', visible: true, order: 6 },
  { id: 'wishlist', visible: true, order: 7 },
  { id: 'rsvp', visible: true, order: 8 },
]

// Default background features
export const DEFAULT_BACKGROUND_FEATURES: BackgroundFeatureConfig[] = [
  { id: 'music', enabled: true },
]

// Default design settings
export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  layoutId: 'classic-scroll',
  animationSpeed: 'normal',
  sections: [...DEFAULT_SECTION_ORDER],
  backgroundFeatures: [...DEFAULT_BACKGROUND_FEATURES],
}

// Layout definitions for admin UI
export const LAYOUT_DEFINITIONS: LayoutDefinition[] = [
  {
    id: 'classic-scroll',
    name: 'Classic Scroll',
    description: 'Traditional vertical scrolling layout',
    mobileSupport: 'full',
  },
  {
    id: 'invitation-card',
    name: 'Invitation Card',
    description: 'Opens like a physical invitation card',
    mobileSupport: 'simplified',
  },
  {
    id: 'page-slideshow',
    name: 'Page Slideshow',
    description: 'Horizontal slides with swipe navigation',
    mobileSupport: 'full',
  },
  {
    id: 'storybook',
    name: 'Storybook',
    description: 'Vertical page-by-page navigation',
    mobileSupport: 'full',
  },
  {
    id: 'elegant-reveal',
    name: 'Elegant Reveal',
    description: 'Sections animate as you scroll',
    mobileSupport: 'full',
  },
]

// All layout IDs for validation
export const LAYOUT_IDS: LayoutId[] = [
  'classic-scroll',
  'invitation-card',
  'page-slideshow',
  'storybook',
  'elegant-reveal',
]

// All section IDs for validation
export const SECTION_IDS: SectionId[] = [
  'hero',
  'details',
  'gallery',
  'schedule',
  'contact',
  'qrcodehub',
  'guestbook',
  'wishlist',
  'rsvp',
]

// Animation speed values in milliseconds
export const ANIMATION_DURATIONS: Record<AnimationSpeed, number> = {
  none: 0,
  subtle: 150,
  normal: 300,
  dramatic: 600,
}
