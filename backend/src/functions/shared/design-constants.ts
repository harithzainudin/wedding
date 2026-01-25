/**
 * Design/Layout Constants for Wedding Website
 *
 * These constants define the layout options and default settings
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

// Layout-specific settings
export interface InvitationCardSettings {
  showCoverText: boolean
  showCoverDate: boolean
  autoOpenDelay: number
}

export interface PageSlideshowSettings {
  showDots: boolean
  showArrows: boolean
  autoPlay: boolean
  autoPlayInterval: number
}

export interface StorybookSettings {
  showPageNumbers: boolean
}

// Background feature identifiers (not layout sections)
export type BackgroundFeatureId = 'music'

// Background feature configuration
export interface BackgroundFeatureConfig {
  id: BackgroundFeatureId
  enabled: boolean
}

// Design settings stored in database
export interface DesignSettings {
  layoutId: LayoutId
  animationSpeed: AnimationSpeed
  sections: SectionConfig[]
  invitationCard?: InvitationCardSettings
  pageSlideshow?: PageSlideshowSettings
  storybook?: StorybookSettings
  backgroundFeatures?: BackgroundFeatureConfig[]
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

// Valid layout IDs
export const VALID_LAYOUT_IDS: LayoutId[] = [
  'classic-scroll',
  'invitation-card',
  'page-slideshow',
  'storybook',
  'elegant-reveal',
]

// Valid animation speeds
export const VALID_ANIMATION_SPEEDS: AnimationSpeed[] = ['none', 'subtle', 'normal', 'dramatic']

// Valid section IDs
export const VALID_SECTION_IDS: SectionId[] = [
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

// Valid background feature IDs
export const VALID_BACKGROUND_FEATURE_IDS: BackgroundFeatureId[] = ['music']

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
  sections: DEFAULT_SECTION_ORDER,
  backgroundFeatures: DEFAULT_BACKGROUND_FEATURES,
}

// Default invitation card settings
export const DEFAULT_INVITATION_CARD_SETTINGS: InvitationCardSettings = {
  showCoverText: true,
  showCoverDate: true,
  autoOpenDelay: 0, // Manual open only
}

// Default page slideshow settings
export const DEFAULT_PAGE_SLIDESHOW_SETTINGS: PageSlideshowSettings = {
  showDots: true,
  showArrows: true,
  autoPlay: false,
  autoPlayInterval: 5,
}

// Default storybook settings
export const DEFAULT_STORYBOOK_SETTINGS: StorybookSettings = {
  showPageNumbers: true,
}

// Type guards
export function isValidLayoutId(value: unknown): value is LayoutId {
  return typeof value === 'string' && VALID_LAYOUT_IDS.includes(value as LayoutId)
}

export function isValidAnimationSpeed(value: unknown): value is AnimationSpeed {
  return typeof value === 'string' && VALID_ANIMATION_SPEEDS.includes(value as AnimationSpeed)
}

export function isValidSectionId(value: unknown): value is SectionId {
  return typeof value === 'string' && VALID_SECTION_IDS.includes(value as SectionId)
}

export function isValidBackgroundFeatureId(value: unknown): value is BackgroundFeatureId {
  return (
    typeof value === 'string' && VALID_BACKGROUND_FEATURE_IDS.includes(value as BackgroundFeatureId)
  )
}
