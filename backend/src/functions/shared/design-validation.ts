import {
  type LayoutId,
  type AnimationSpeed,
  type SectionConfig,
  type DesignUpdateRequest,
  type InvitationCardSettings,
  type PageSlideshowSettings,
  type StorybookSettings,
  isValidLayoutId,
  isValidAnimationSpeed,
  isValidSectionId,
  VALID_SECTION_IDS,
  DEFAULT_SECTION_ORDER,
} from './design-constants'

// Validation result type
export type ValidationResult =
  | { valid: true; data: DesignUpdateRequest }
  | { valid: false; error: string }

// Validate section configuration array
function validateSections(
  sections: unknown
): { valid: true; data: SectionConfig[] } | { valid: false; error: string } {
  if (!Array.isArray(sections)) {
    return { valid: false, error: 'Sections must be an array' }
  }

  if (sections.length === 0) {
    return { valid: false, error: 'Sections array cannot be empty' }
  }

  if (sections.length > VALID_SECTION_IDS.length) {
    return { valid: false, error: `Too many sections. Maximum is ${VALID_SECTION_IDS.length}` }
  }

  const validatedSections: SectionConfig[] = []
  const seenIds = new Set<string>()
  const seenOrders = new Set<number>()

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]

    if (typeof section !== 'object' || section === null) {
      return { valid: false, error: `Section at index ${i} must be an object` }
    }

    const s = section as Record<string, unknown>

    // Validate id
    if (!isValidSectionId(s.id)) {
      return {
        valid: false,
        error: `Invalid section id at index ${i}. Must be one of: ${VALID_SECTION_IDS.join(', ')}`,
      }
    }

    // Check for duplicate ids
    if (seenIds.has(s.id as string)) {
      return { valid: false, error: `Duplicate section id: ${s.id}` }
    }
    seenIds.add(s.id as string)

    // Validate visible
    if (typeof s.visible !== 'boolean') {
      return { valid: false, error: `Section at index ${i} must have a boolean 'visible' property` }
    }

    // Hero section must be visible
    if (s.id === 'hero' && !s.visible) {
      return { valid: false, error: 'Hero section cannot be hidden' }
    }

    // Validate order
    if (typeof s.order !== 'number' || !Number.isInteger(s.order) || s.order < 0) {
      return {
        valid: false,
        error: `Section at index ${i} must have a non-negative integer 'order' property`,
      }
    }

    // Hero section must be first (order 0)
    if (s.id === 'hero' && s.order !== 0) {
      return { valid: false, error: 'Hero section must have order 0' }
    }

    // Check for duplicate orders
    if (seenOrders.has(s.order as number)) {
      return { valid: false, error: `Duplicate section order: ${s.order}` }
    }
    seenOrders.add(s.order as number)

    validatedSections.push({
      id: s.id as SectionConfig['id'],
      visible: s.visible as boolean,
      order: s.order as number,
    })
  }

  // Sort by order
  validatedSections.sort((a, b) => a.order - b.order)

  return { valid: true, data: validatedSections }
}

// Validate invitation card settings
function validateInvitationCardSettings(
  settings: unknown
): { valid: true; data: InvitationCardSettings } | { valid: false; error: string } {
  if (typeof settings !== 'object' || settings === null) {
    return { valid: false, error: 'Invitation card settings must be an object' }
  }

  const s = settings as Record<string, unknown>

  if (typeof s.showCoverText !== 'boolean') {
    return { valid: false, error: 'showCoverText must be a boolean' }
  }

  if (typeof s.showCoverDate !== 'boolean') {
    return { valid: false, error: 'showCoverDate must be a boolean' }
  }

  if (typeof s.autoOpenDelay !== 'number' || s.autoOpenDelay < 0 || s.autoOpenDelay > 30) {
    return { valid: false, error: 'autoOpenDelay must be a number between 0 and 30' }
  }

  return {
    valid: true,
    data: {
      showCoverText: s.showCoverText,
      showCoverDate: s.showCoverDate,
      autoOpenDelay: s.autoOpenDelay,
    },
  }
}

// Validate page slideshow settings
function validatePageSlideshowSettings(
  settings: unknown
): { valid: true; data: PageSlideshowSettings } | { valid: false; error: string } {
  if (typeof settings !== 'object' || settings === null) {
    return { valid: false, error: 'Page slideshow settings must be an object' }
  }

  const s = settings as Record<string, unknown>

  if (typeof s.showDots !== 'boolean') {
    return { valid: false, error: 'showDots must be a boolean' }
  }

  if (typeof s.showArrows !== 'boolean') {
    return { valid: false, error: 'showArrows must be a boolean' }
  }

  if (typeof s.autoPlay !== 'boolean') {
    return { valid: false, error: 'autoPlay must be a boolean' }
  }

  if (typeof s.autoPlayInterval !== 'number' || s.autoPlayInterval < 1 || s.autoPlayInterval > 30) {
    return { valid: false, error: 'autoPlayInterval must be a number between 1 and 30' }
  }

  return {
    valid: true,
    data: {
      showDots: s.showDots,
      showArrows: s.showArrows,
      autoPlay: s.autoPlay,
      autoPlayInterval: s.autoPlayInterval,
    },
  }
}

// Validate storybook settings
function validateStorybookSettings(
  settings: unknown
): { valid: true; data: StorybookSettings } | { valid: false; error: string } {
  if (typeof settings !== 'object' || settings === null) {
    return { valid: false, error: 'Storybook settings must be an object' }
  }

  const s = settings as Record<string, unknown>

  if (typeof s.showPageNumbers !== 'boolean') {
    return { valid: false, error: 'showPageNumbers must be a boolean' }
  }

  return {
    valid: true,
    data: {
      showPageNumbers: s.showPageNumbers,
    },
  }
}

// Main validation function for design update request
export function validateDesignUpdate(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) {
    return { valid: false, error: 'Invalid request body' }
  }

  const body = input as Record<string, unknown>

  // Validate layoutId (required)
  if (!isValidLayoutId(body.layoutId)) {
    return {
      valid: false,
      error: `Invalid layoutId. Must be one of: classic-scroll, invitation-card, page-slideshow, storybook, elegant-reveal`,
    }
  }

  const layoutId = body.layoutId as LayoutId

  // Build validated request
  const validatedData: DesignUpdateRequest = { layoutId }

  // Validate animationSpeed (optional)
  if (body.animationSpeed !== undefined) {
    if (!isValidAnimationSpeed(body.animationSpeed)) {
      return {
        valid: false,
        error: 'Invalid animationSpeed. Must be one of: none, subtle, normal, dramatic',
      }
    }
    validatedData.animationSpeed = body.animationSpeed as AnimationSpeed
  }

  // Validate sections (optional - use default if not provided)
  if (body.sections !== undefined) {
    const sectionsResult = validateSections(body.sections)
    if (!sectionsResult.valid) {
      return { valid: false, error: sectionsResult.error }
    }
    validatedData.sections = sectionsResult.data
  } else {
    // Use default section order
    validatedData.sections = DEFAULT_SECTION_ORDER
  }

  // Validate layout-specific settings
  if (layoutId === 'invitation-card' && body.invitationCard !== undefined) {
    const result = validateInvitationCardSettings(body.invitationCard)
    if (!result.valid) {
      return { valid: false, error: result.error }
    }
    validatedData.invitationCard = result.data
  }

  if (layoutId === 'page-slideshow' && body.pageSlideshow !== undefined) {
    const result = validatePageSlideshowSettings(body.pageSlideshow)
    if (!result.valid) {
      return { valid: false, error: result.error }
    }
    validatedData.pageSlideshow = result.data
  }

  if (layoutId === 'storybook' && body.storybook !== undefined) {
    const result = validateStorybookSettings(body.storybook)
    if (!result.valid) {
      return { valid: false, error: result.error }
    }
    validatedData.storybook = result.data
  }

  return { valid: true, data: validatedData }
}
