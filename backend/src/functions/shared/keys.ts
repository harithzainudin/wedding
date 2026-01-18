/**
 * DynamoDB Key Helpers for Multi-Tenant Wedding Platform
 *
 * All wedding-specific data MUST use these key helpers to ensure
 * proper data isolation between weddings.
 *
 * Key Structure:
 * - Wedding metadata: WEDDING#{weddingId} / META
 * - Wedding settings: WEDDING#{weddingId}#SETTINGS / {type}
 * - Wedding entities: WEDDING#{weddingId}#{ENTITY}#{entityId} / META
 */

export interface DynamoKey {
  pk: string
  sk: string
}

export interface GsiKey {
  gsi1pk: string
  gsi1sk: string
}

export interface Gsi2Key {
  gsi2pk: string
  gsi2sk: string
}

export const Keys = {
  // ============================================
  // WEDDING REGISTRY
  // ============================================

  /**
   * Wedding metadata record
   * pk: WEDDING#{weddingId}, sk: META
   */
  wedding: (weddingId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}`,
    sk: 'META',
  }),

  /**
   * Wedding slug lookup (for resolving slug -> weddingId)
   * pk: WEDDING_SLUG#{slug}, sk: LOOKUP
   */
  weddingSlug: (slug: string): DynamoKey => ({
    pk: `WEDDING_SLUG#${slug.toLowerCase()}`,
    sk: 'LOOKUP',
  }),

  // ============================================
  // WEDDING-SCOPED SETTINGS
  // ============================================

  /**
   * Wedding settings (venue, theme, schedule, contacts, etc.)
   * pk: WEDDING#{weddingId}#SETTINGS, sk: {type}
   */
  settings: (weddingId: string, type: SettingsType): DynamoKey => ({
    pk: `WEDDING#${weddingId}#SETTINGS`,
    sk: type,
  }),

  // ============================================
  // WEDDING-SCOPED ENTITIES
  // ============================================

  /**
   * RSVP record
   * pk: WEDDING#{weddingId}#RSVP#{rsvpId}, sk: META
   */
  rsvp: (weddingId: string, rsvpId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#RSVP#${rsvpId}`,
    sk: 'META',
  }),

  /**
   * Gallery image record
   * pk: WEDDING#{weddingId}#IMAGE#{imageId}, sk: META
   */
  image: (weddingId: string, imageId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#IMAGE#${imageId}`,
    sk: 'META',
  }),

  /**
   * Music track record
   * pk: WEDDING#{weddingId}#MUSIC#{musicId}, sk: META
   */
  music: (weddingId: string, musicId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#MUSIC#${musicId}`,
    sk: 'META',
  }),

  /**
   * Gift record
   * pk: WEDDING#{weddingId}#GIFT#{giftId}, sk: META
   */
  gift: (weddingId: string, giftId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#GIFT#${giftId}`,
    sk: 'META',
  }),

  /**
   * Gift reservation record
   * pk: WEDDING#{weddingId}#GIFT#{giftId}, sk: RESERVATION#{reservationId}
   */
  giftReservation: (weddingId: string, giftId: string, reservationId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#GIFT#${giftId}`,
    sk: `RESERVATION#${reservationId}`,
  }),

  /**
   * Parking image record
   * pk: WEDDING#{weddingId}#PARKING#{imageId}, sk: META
   */
  parking: (weddingId: string, imageId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#PARKING#${imageId}`,
    sk: 'META',
  }),

  /**
   * QR Code Hub image record
   * pk: WEDDING#{weddingId}#QRCODE#{imageId}, sk: META
   */
  qrCode: (weddingId: string, imageId: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#QRCODE#${imageId}`,
    sk: 'META',
  }),

  // ============================================
  // USER ACCOUNTS
  // ============================================

  /**
   * Super admin user profile
   * pk: SUPERADMIN#{username}, sk: PROFILE
   */
  superAdmin: (username: string): DynamoKey => ({
    pk: `SUPERADMIN#${username.toLowerCase()}`,
    sk: 'PROFILE',
  }),

  /**
   * Wedding admin/owner user profile
   * pk: ADMIN#{username}, sk: PROFILE
   */
  weddingAdmin: (username: string): DynamoKey => ({
    pk: `ADMIN#${username.toLowerCase()}`,
    sk: 'PROFILE',
  }),

  /**
   * Link between wedding and admin user
   * pk: WEDDING#{weddingId}#ADMINS, sk: {username}
   */
  weddingAdminLink: (weddingId: string, username: string): DynamoKey => ({
    pk: `WEDDING#${weddingId}#ADMINS`,
    sk: username.toLowerCase(),
  }),

  // ============================================
  // GSI KEYS
  // ============================================
  gsi: {
    /**
     * List all weddings (for super admin)
     * gsi1pk: WEDDINGS, gsi1sk: {createdAt}
     */
    allWeddings: (createdAt: string): GsiKey => ({
      gsi1pk: 'WEDDINGS',
      gsi1sk: createdAt,
    }),

    /**
     * List RSVPs by status for a wedding
     * gsi1pk: WEDDING#{weddingId}#RSVP_STATUS#{status}, gsi1sk: {submittedAt}
     */
    weddingRsvpsByStatus: (
      weddingId: string,
      status: 'attending' | 'not_attending',
      submittedAt: string
    ): GsiKey => ({
      gsi1pk: `WEDDING#${weddingId}#RSVP_STATUS#${status}`,
      gsi1sk: submittedAt,
    }),

    /**
     * List all RSVPs for a wedding
     * gsi1pk: WEDDING#{weddingId}#RSVPS, gsi1sk: {submittedAt}
     */
    weddingRsvps: (weddingId: string, submittedAt: string): GsiKey => ({
      gsi1pk: `WEDDING#${weddingId}#RSVPS`,
      gsi1sk: submittedAt,
    }),

    /**
     * List images for a wedding
     * gsi1pk: WEDDING#{weddingId}#IMAGES, gsi1sk: {order}#{imageId}
     */
    weddingImages: (weddingId: string, order: number, imageId: string): GsiKey => ({
      gsi1pk: `WEDDING#${weddingId}#IMAGES`,
      gsi1sk: `${String(order).padStart(5, '0')}#${imageId}`,
    }),

    /**
     * List music tracks for a wedding
     * gsi1pk: WEDDING#{weddingId}#MUSIC, gsi1sk: {order}#{musicId}
     */
    weddingMusic: (weddingId: string, order: number, musicId: string): GsiKey => ({
      gsi1pk: `WEDDING#${weddingId}#MUSIC`,
      gsi1sk: `${String(order).padStart(5, '0')}#${musicId}`,
    }),

    /**
     * List gifts for a wedding
     * gsi1pk: WEDDING#{weddingId}#GIFTS, gsi1sk: {order}#{giftId}
     */
    weddingGifts: (weddingId: string, order: number, giftId: string): GsiKey => ({
      gsi1pk: `WEDDING#${weddingId}#GIFTS`,
      gsi1sk: `${String(order).padStart(5, '0')}#${giftId}`,
    }),

    /**
     * List parking images for a wedding
     * gsi1pk: WEDDING#{weddingId}#PARKING, gsi1sk: {order}#{imageId}
     */
    weddingParking: (weddingId: string, order: number, imageId: string): GsiKey => ({
      gsi1pk: `WEDDING#${weddingId}#PARKING`,
      gsi1sk: `${String(order).padStart(5, '0')}#${imageId}`,
    }),

    /**
     * List gift reservations
     * gsi1pk: WEDDING#{weddingId}#RESERVATIONS, gsi1sk: {reservedAt}
     */
    weddingReservations: (weddingId: string, reservedAt: string): GsiKey => ({
      gsi1pk: `WEDDING#${weddingId}#RESERVATIONS`,
      gsi1sk: reservedAt,
    }),

    /**
     * List all admins (for super admin)
     * gsi1pk: ADMINS, gsi1sk: {createdAt}
     */
    allAdmins: (createdAt: string): GsiKey => ({
      gsi1pk: 'ADMINS',
      gsi1sk: createdAt,
    }),

    /**
     * List all staff members (for super admin)
     * gsi1pk: STAFF, gsi1sk: {createdAt}
     */
    allStaff: (createdAt: string): GsiKey => ({
      gsi1pk: 'STAFF',
      gsi1sk: createdAt,
    }),

    /**
     * List user's weddings
     * gsi1pk: USER#{username}#WEDDINGS, gsi1sk: {weddingId}
     */
    userWeddings: (username: string, weddingId: string): GsiKey => ({
      gsi1pk: `USER#${username.toLowerCase()}#WEDDINGS`,
      gsi1sk: weddingId,
    }),
  },

  /**
   * GSI2 keys for slug lookup
   */
  gsi2: {
    /**
     * Wedding slug lookup
     * gsi2pk: SLUG#{slug}, gsi2sk: WEDDING
     */
    bySlug: (slug: string): Gsi2Key => ({
      gsi2pk: `SLUG#${slug.toLowerCase()}`,
      gsi2sk: 'WEDDING',
    }),
  },

  // ============================================
  // QUERY PREFIXES (for query operations)
  // ============================================
  prefixes: {
    weddingSettings: (weddingId: string) => `WEDDING#${weddingId}#SETTINGS`,
    weddingRsvps: (weddingId: string) => `WEDDING#${weddingId}#RSVP#`,
    weddingImages: (weddingId: string) => `WEDDING#${weddingId}#IMAGE#`,
    weddingMusic: (weddingId: string) => `WEDDING#${weddingId}#MUSIC#`,
    weddingGifts: (weddingId: string) => `WEDDING#${weddingId}#GIFT#`,
    weddingParking: (weddingId: string) => `WEDDING#${weddingId}#PARKING#`,
    giftReservations: (weddingId: string, giftId: string) => `WEDDING#${weddingId}#GIFT#${giftId}`,
  },
}

/**
 * Settings types for wedding configuration
 */
export type SettingsType =
  | 'VENUE'
  | 'WEDDING_DETAILS'
  | 'THEME'
  | 'SCHEDULE'
  | 'CONTACTS'
  | 'MUSIC'
  | 'IMAGES'
  | 'GIFTS'
  | 'QRCODE_HUB'
  | 'PARKING'
