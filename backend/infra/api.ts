import { table } from './database'

const functionConfig: Omit<sst.aws.FunctionArgs, 'handler'> = {
  runtime: 'nodejs22.x',
  transform: {
    function: {
      loggingConfig: {
        logFormat: 'JSON',
      },
    },
    logGroup: (args) => {
      args.retentionInDays = 1
    },
  },
}

export const api = new sst.aws.ApiGatewayV2('WeddingApi', {
  cors: {
    allowOrigins: [
      'http://localhost:5173',
      'http://192.168.0.2:5173',
      'http://192.168.0.15:5173',
      'https://harithzainudin.github.io',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowCredentials: false,
  },
})

// ============================================
// RSVP: Public submit route (wedding slug)
// ============================================

// POST /{weddingSlug}/rsvp - Submit RSVP (public)
api.route('POST /{weddingSlug}/rsvp', {
  handler: 'src/functions/rsvp/submit.handler',
  link: [table],
  ...functionConfig,
})

// GET /{weddingSlug}/rsvps - List RSVPs for guestbook (public, wishes only)
api.route('GET /{weddingSlug}/rsvps', {
  handler: 'src/functions/rsvp/list.handler',
  link: [table],
  ...functionConfig,
})

// GET /{weddingSlug}/rsvp/settings - Get RSVP settings (public)
api.route('GET /{weddingSlug}/rsvp/settings', {
  handler: 'src/functions/rsvp/get-settings.handler',
  link: [table],
  ...functionConfig,
})

// Function to add admin routes with secrets
export function addAdminRoutes(
  adminPassword: sst.Secret,
  brevoApiKey: sst.Secret,
  senderEmail: sst.Secret,
  adminLoginUrl: sst.Secret,
  tokenSecret: sst.Secret
) {
  // POST /admin/login - Admin login
  api.route('POST /admin/login', {
    handler: 'src/functions/admin/login.handler',
    link: [adminPassword, table, tokenSecret],
    ...functionConfig,
  })

  // POST /admin/refresh - Refresh access token
  api.route('POST /admin/refresh', {
    handler: 'src/functions/admin/refresh.handler',
    link: [tokenSecret],
    ...functionConfig,
  })

  // POST /admin/users - Create admin user (with email notification, master-only)
  api.route('POST /admin/users', {
    handler: 'src/functions/admin/create.handler',
    link: [table, brevoApiKey, senderEmail, adminLoginUrl, tokenSecret],
    ...functionConfig,
  })

  // GET /admin/users - List admin users (auth required)
  api.route('GET /admin/users', {
    handler: 'src/functions/admin/list.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // DELETE /admin/users/{username} - Delete admin user (master-only)
  api.route('DELETE /admin/users/{username}', {
    handler: 'src/functions/admin/delete.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/users/password - Change admin password (auth required)
  api.route('PUT /admin/users/password', {
    handler: 'src/functions/admin/change-password.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // GET /admin/users/me - Get current user profile (auth required)
  api.route('GET /admin/users/me', {
    handler: 'src/functions/admin/get-profile.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/users/me/email - Update current user email (auth required)
  api.route('PUT /admin/users/me/email', {
    handler: 'src/functions/admin/update-email.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/users/{username}/reset-password - Force reset password (master-only)
  api.route('PUT /admin/users/{username}/reset-password', {
    handler: 'src/functions/admin/force-reset-password.handler',
    link: [table, brevoApiKey, senderEmail, adminLoginUrl, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/users/set-password - Set new password for forced password change (auth required)
  api.route('PUT /admin/users/set-password', {
    handler: 'src/functions/admin/set-new-password.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // GET /admin/resolve-slug/{slug} - Resolve wedding slug to weddingId (auth required)
  api.route('GET /admin/resolve-slug/{slug}', {
    handler: 'src/functions/admin/resolve-slug.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // GET /admin/my-weddings - Get weddings assigned to current user (auth required)
  api.route('GET /admin/my-weddings', {
    handler: 'src/functions/admin/my-weddings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add RSVP routes with token secret for protected endpoints
export function addRsvpAuthRoutes(tokenSecret: sst.Secret) {
  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/rsvps - List RSVPs (auth required)
  api.route('GET /admin/w/{weddingId}/rsvps', {
    handler: 'src/functions/rsvp/list.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/rsvps - Admin create RSVP
  api.route('POST /admin/w/{weddingId}/rsvps', {
    handler: 'src/functions/rsvp/create.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/rsvp/{id} - Update RSVP
  api.route('PUT /admin/w/{weddingId}/rsvp/{id}', {
    handler: 'src/functions/rsvp/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // DELETE /admin/w/{weddingId}/rsvp/{id} - Delete RSVP
  api.route('DELETE /admin/w/{weddingId}/rsvp/{id}', {
    handler: 'src/functions/rsvp/delete.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/rsvp/settings - Update RSVP settings
  api.route('PUT /admin/w/{weddingId}/rsvp/settings', {
    handler: 'src/functions/rsvp/update-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add image management routes
export function addImageRoutes(tokenSecret: sst.Secret, imageBucket: sst.aws.Bucket) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/gallery - Public endpoint to list images
  api.route('GET /{weddingSlug}/gallery', {
    handler: 'src/functions/images/list.handler',
    link: [table, imageBucket],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/images - List images (auth required)
  api.route('GET /admin/w/{weddingId}/images', {
    handler: 'src/functions/images/list.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/images/presigned-url - Request presigned URL for upload
  api.route('POST /admin/w/{weddingId}/images/presigned-url', {
    handler: 'src/functions/images/request-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/images/confirm - Confirm upload after successful S3 upload
  api.route('POST /admin/w/{weddingId}/images/confirm', {
    handler: 'src/functions/images/confirm-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // DELETE /admin/w/{weddingId}/images/{id} - Delete an image
  api.route('DELETE /admin/w/{weddingId}/images/{id}', {
    handler: 'src/functions/images/delete.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/images/reorder - Reorder images
  api.route('PUT /admin/w/{weddingId}/images/reorder', {
    handler: 'src/functions/images/reorder.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // GET /admin/w/{weddingId}/images/settings - Get image settings
  api.route('GET /admin/w/{weddingId}/images/settings', {
    handler: 'src/functions/images/get-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/images/settings - Update image settings
  api.route('PUT /admin/w/{weddingId}/images/settings', {
    handler: 'src/functions/images/update-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add venue routes
export function addVenueRoutes(tokenSecret: sst.Secret) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/venue - Public endpoint to fetch venue data
  api.route('GET /{weddingSlug}/venue', {
    handler: 'src/functions/venue/get.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // PUT /admin/w/{weddingId}/venue - Update venue data (auth required)
  api.route('PUT /admin/w/{weddingId}/venue', {
    handler: 'src/functions/venue/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add wedding details routes
export function addWeddingDetailsRoutes(tokenSecret: sst.Secret) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/wedding-details - Public endpoint to fetch wedding details
  api.route('GET /{weddingSlug}/wedding-details', {
    handler: 'src/functions/wedding-details/get.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // PUT /admin/w/{weddingId}/wedding-details - Update wedding details (auth required)
  api.route('PUT /admin/w/{weddingId}/wedding-details', {
    handler: 'src/functions/wedding-details/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add schedule routes
export function addScheduleRoutes(tokenSecret: sst.Secret) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/schedule - Public endpoint to fetch schedule
  api.route('GET /{weddingSlug}/schedule', {
    handler: 'src/functions/schedule/get.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/schedule - Fetch schedule (auth required)
  api.route('GET /admin/w/{weddingId}/schedule', {
    handler: 'src/functions/schedule/get.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/schedule - Update schedule (auth required)
  api.route('PUT /admin/w/{weddingId}/schedule', {
    handler: 'src/functions/schedule/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/schedule/settings - Update schedule settings (auth required)
  api.route('PUT /admin/w/{weddingId}/schedule/settings', {
    handler: 'src/functions/schedule/update-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add contacts routes
export function addContactsRoutes(tokenSecret: sst.Secret) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/contacts - Public endpoint to fetch contacts
  api.route('GET /{weddingSlug}/contacts', {
    handler: 'src/functions/contacts/get.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/contacts - Fetch contacts (auth required)
  api.route('GET /admin/w/{weddingId}/contacts', {
    handler: 'src/functions/contacts/get.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/contacts - Update contacts (auth required)
  api.route('PUT /admin/w/{weddingId}/contacts', {
    handler: 'src/functions/contacts/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/contacts/settings - Update contacts settings (auth required)
  api.route('PUT /admin/w/{weddingId}/contacts/settings', {
    handler: 'src/functions/contacts/update-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add theme routes
export function addThemeRoutes(tokenSecret: sst.Secret) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/theme - Public endpoint to fetch theme settings
  api.route('GET /{weddingSlug}/theme', {
    handler: 'src/functions/theme/get.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // PUT /admin/w/{weddingId}/theme - Update theme settings (auth required)
  api.route('PUT /admin/w/{weddingId}/theme', {
    handler: 'src/functions/theme/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add design/layout routes
export function addDesignRoutes(tokenSecret: sst.Secret) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/design - Public endpoint to fetch design settings
  api.route('GET /{weddingSlug}/design', {
    handler: 'src/functions/design/get.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // PUT /admin/w/{weddingId}/design - Update design settings (auth required)
  api.route('PUT /admin/w/{weddingId}/design', {
    handler: 'src/functions/design/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add gift registry routes
export function addGiftRoutes(tokenSecret: sst.Secret, imageBucket: sst.aws.Bucket) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/gifts - Public: list all gifts
  api.route('GET /{weddingSlug}/gifts', {
    handler: 'src/functions/gifts/list.handler',
    link: [table, imageBucket],
    ...functionConfig,
  })

  // POST /{weddingSlug}/gifts/{id}/reserve - Public: reserve a gift
  api.route('POST /{weddingSlug}/gifts/{id}/reserve', {
    handler: 'src/functions/gifts/reserve.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/gifts - Admin: list all gifts
  api.route('GET /admin/w/{weddingId}/gifts', {
    handler: 'src/functions/gifts/list.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/gifts - Admin: create gift
  api.route('POST /admin/w/{weddingId}/gifts', {
    handler: 'src/functions/gifts/create.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/gifts/{id} - Admin: update gift
  api.route('PUT /admin/w/{weddingId}/gifts/{id}', {
    handler: 'src/functions/gifts/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // DELETE /admin/w/{weddingId}/gifts/{id} - Admin: delete gift
  api.route('DELETE /admin/w/{weddingId}/gifts/{id}', {
    handler: 'src/functions/gifts/delete.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // DELETE /admin/w/{weddingId}/gifts/bulk - Admin: bulk delete gifts
  api.route('DELETE /admin/w/{weddingId}/gifts/bulk', {
    handler: 'src/functions/gifts/delete-bulk.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/gifts/bulk - Admin: bulk create gifts
  api.route('POST /admin/w/{weddingId}/gifts/bulk', {
    handler: 'src/functions/gifts/create-bulk.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/gifts/reorder - Admin: reorder gifts
  api.route('PUT /admin/w/{weddingId}/gifts/reorder', {
    handler: 'src/functions/gifts/reorder.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/gifts/presigned-url - Admin: request presigned URL for upload
  api.route('POST /admin/w/{weddingId}/gifts/presigned-url', {
    handler: 'src/functions/gifts/request-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/gifts/confirm - Admin: confirm upload
  api.route('POST /admin/w/{weddingId}/gifts/confirm', {
    handler: 'src/functions/gifts/confirm-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // GET /admin/w/{weddingId}/gifts/settings - Admin: get gift settings
  api.route('GET /admin/w/{weddingId}/gifts/settings', {
    handler: 'src/functions/gifts/get-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/gifts/settings - Admin: update gift settings
  api.route('PUT /admin/w/{weddingId}/gifts/settings', {
    handler: 'src/functions/gifts/update-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // GET /admin/w/{weddingId}/gifts/reservations - Admin: list all reservations
  api.route('GET /admin/w/{weddingId}/gifts/reservations', {
    handler: 'src/functions/gifts/reservations.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add music management routes
export function addMusicRoutes(tokenSecret: sst.Secret, imageBucket: sst.aws.Bucket) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/music - Public endpoint to fetch music settings and tracks
  api.route('GET /{weddingSlug}/music', {
    handler: 'src/functions/music/get.handler',
    link: [table, imageBucket],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/music - Admin endpoint to fetch music data
  api.route('GET /admin/w/{weddingId}/music', {
    handler: 'src/functions/music/get.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/music/settings - Update music settings (auth required)
  api.route('PUT /admin/w/{weddingId}/music/settings', {
    handler: 'src/functions/music/update-settings.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/music/upload-url - Request presigned URL for upload (auth required)
  api.route('POST /admin/w/{weddingId}/music/upload-url', {
    handler: 'src/functions/music/request-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/music/confirm - Confirm upload after S3 upload (auth required)
  api.route('POST /admin/w/{weddingId}/music/confirm', {
    handler: 'src/functions/music/confirm-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // DELETE /admin/w/{weddingId}/music/{id} - Delete a track (auth required)
  api.route('DELETE /admin/w/{weddingId}/music/{id}', {
    handler: 'src/functions/music/delete.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/music/reorder - Reorder tracks (auth required)
  api.route('PUT /admin/w/{weddingId}/music/reorder', {
    handler: 'src/functions/music/reorder.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/music/add-from-library - Add track from global library (auth required)
  api.route('POST /admin/w/{weddingId}/music/add-from-library', {
    handler: 'src/functions/music/add-from-library.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // GET /admin/music-library - List global music library for wedding admin (read-only)
  api.route('GET /admin/music-library', {
    handler: 'src/functions/admin/music-library/list.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })
}

// Function to add parking image routes
export function addParkingRoutes(tokenSecret: sst.Secret, imageBucket: sst.aws.Bucket) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/parking - List all parking images (public)
  api.route('GET /{weddingSlug}/parking', {
    handler: 'src/functions/parking/list.handler',
    link: [table, imageBucket],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/parking - List parking images (auth required)
  api.route('GET /admin/w/{weddingId}/parking', {
    handler: 'src/functions/parking/list.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/parking/presigned-url - Request presigned URL for parking image upload
  api.route('POST /admin/w/{weddingId}/parking/presigned-url', {
    handler: 'src/functions/parking/request-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/parking/confirm - Confirm parking image upload
  api.route('POST /admin/w/{weddingId}/parking/confirm', {
    handler: 'src/functions/parking/confirm-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // DELETE /admin/w/{weddingId}/parking/{id} - Delete a parking image
  api.route('DELETE /admin/w/{weddingId}/parking/{id}', {
    handler: 'src/functions/parking/delete.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/parking/reorder - Reorder parking images
  api.route('PUT /admin/w/{weddingId}/parking/reorder', {
    handler: 'src/functions/parking/reorder.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}

// Function to add QR Code Hub routes
export function addQRCodeHubRoutes(tokenSecret: sst.Secret, imageBucket: sst.aws.Bucket) {
  // ============================================
  // PUBLIC ROUTES (wedding slug in path)
  // ============================================

  // GET /{weddingSlug}/qrcode-hub - Public endpoint to fetch QR Code Hub settings
  api.route('GET /{weddingSlug}/qrcode-hub', {
    handler: 'src/functions/qrcode-hub/get.handler',
    link: [table],
    ...functionConfig,
  })

  // ============================================
  // ADMIN ROUTES (wedding ID in path)
  // ============================================

  // GET /admin/w/{weddingId}/qrcode-hub - Fetch QR Code Hub settings (auth required)
  api.route('GET /admin/w/{weddingId}/qrcode-hub', {
    handler: 'src/functions/qrcode-hub/get.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /admin/w/{weddingId}/qrcode-hub - Update QR Code Hub settings (auth required)
  api.route('PUT /admin/w/{weddingId}/qrcode-hub', {
    handler: 'src/functions/qrcode-hub/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /admin/w/{weddingId}/qrcode-hub/request-upload - Request presigned URL for Restu Digital QR image upload
  api.route('POST /admin/w/{weddingId}/qrcode-hub/request-upload', {
    handler: 'src/functions/qrcode-hub/request-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })
}

// ============================================
// MULTI-TENANT ROUTES
// ============================================

// Function to add unified auth routes (multi-tenant)
export function addAuthRoutes(adminPassword: sst.Secret, tokenSecret: sst.Secret) {
  // POST /auth/login - Unified login (supports super admin + wedding admin)
  api.route('POST /auth/login', {
    handler: 'src/functions/auth/login.handler',
    link: [adminPassword, table, tokenSecret],
    ...functionConfig,
  })

  // POST /auth/refresh - Refresh tokens (all user types)
  api.route('POST /auth/refresh', {
    handler: 'src/functions/auth/refresh.handler',
    link: [tokenSecret],
    ...functionConfig,
  })
}

// Function to add super admin routes
export function addSuperAdminRoutes(
  tokenSecret: sst.Secret,
  brevoApiKey: sst.Secret,
  senderEmail: sst.Secret,
  adminLoginUrl: sst.Secret,
  imageBucket: sst.aws.Bucket
) {
  // GET /superadmin/weddings - List all weddings
  api.route('GET /superadmin/weddings', {
    handler: 'src/functions/superadmin/weddings/list.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /superadmin/weddings - Create a new wedding
  api.route('POST /superadmin/weddings', {
    handler: 'src/functions/superadmin/weddings/create.handler',
    link: [table, tokenSecret, brevoApiKey, senderEmail, adminLoginUrl],
    ...functionConfig,
  })

  // GET /superadmin/weddings/{weddingId} - Get single wedding details
  api.route('GET /superadmin/weddings/{weddingId}', {
    handler: 'src/functions/superadmin/weddings/get.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /superadmin/weddings/{weddingId} - Update wedding details
  api.route('PUT /superadmin/weddings/{weddingId}', {
    handler: 'src/functions/superadmin/weddings/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // DELETE /superadmin/weddings/{weddingId} - Archive wedding
  api.route('DELETE /superadmin/weddings/{weddingId}', {
    handler: 'src/functions/superadmin/weddings/delete.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /superadmin/weddings/{weddingId}/users - Add owner to wedding
  api.route('POST /superadmin/weddings/{weddingId}/users', {
    handler: 'src/functions/superadmin/weddings/add-owner.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /superadmin/weddings/{weddingId}/users/{username} - Update owner details
  api.route('PUT /superadmin/weddings/{weddingId}/users/{username}', {
    handler: 'src/functions/superadmin/weddings/update-owner.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // DELETE /superadmin/weddings/{weddingId}/users/{username} - Remove owner from wedding
  api.route('DELETE /superadmin/weddings/{weddingId}/users/{username}', {
    handler: 'src/functions/superadmin/weddings/remove-owner.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /superadmin/weddings/{weddingId}/users/{username}/reset-password - Reset owner password
  api.route('POST /superadmin/weddings/{weddingId}/users/{username}/reset-password', {
    handler: 'src/functions/superadmin/weddings/reset-owner-password.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // GET /superadmin/weddings/{weddingId}/deletion-preview - Get deletion preview (counts)
  api.route('GET /superadmin/weddings/{weddingId}/deletion-preview', {
    handler: 'src/functions/superadmin/weddings/deletion-preview.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // DELETE /superadmin/weddings/{weddingId}/hard-delete - Permanently delete wedding
  api.route('DELETE /superadmin/weddings/{weddingId}/hard-delete', {
    handler: 'src/functions/superadmin/weddings/hard-delete.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // GET /superadmin/weddings/{weddingId}/limits - Get wedding limits (gallery & gift settings)
  api.route('GET /superadmin/weddings/{weddingId}/limits', {
    handler: 'src/functions/superadmin/weddings/get-limits.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /superadmin/weddings/{weddingId}/limits - Update wedding limits
  api.route('PUT /superadmin/weddings/{weddingId}/limits', {
    handler: 'src/functions/superadmin/weddings/update-limits.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /superadmin/cleanup-orphan-data - One-time cleanup of legacy/orphan data
  api.route('POST /superadmin/cleanup-orphan-data', {
    handler: 'src/functions/superadmin/cleanup-orphan-data.handler',
    link: [table, tokenSecret, imageBucket],
    timeout: '5 minutes', // Longer timeout for cleanup operation
    ...functionConfig,
  })

  // ============================================
  // STAFF MANAGEMENT
  // ============================================

  // GET /superadmin/staff - List all staff members
  api.route('GET /superadmin/staff', {
    handler: 'src/functions/superadmin/staff/list.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /superadmin/staff - Create a new staff member
  api.route('POST /superadmin/staff', {
    handler: 'src/functions/superadmin/staff/create.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // PUT /superadmin/staff/{username} - Update staff member
  api.route('PUT /superadmin/staff/{username}', {
    handler: 'src/functions/superadmin/staff/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // DELETE /superadmin/staff/{username} - Delete staff member
  api.route('DELETE /superadmin/staff/{username}', {
    handler: 'src/functions/superadmin/staff/delete.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // ============================================
  // SUPER ADMIN SETTINGS
  // ============================================

  // PUT /superadmin/password - Change own password
  api.route('PUT /superadmin/password', {
    handler: 'src/functions/superadmin/change-password.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // GET /superadmin/admins - List all super admins (master only)
  api.route('GET /superadmin/admins', {
    handler: 'src/functions/superadmin/admins/list.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // POST /superadmin/admins/{username}/reset-password - Reset super admin password (master only)
  api.route('POST /superadmin/admins/{username}/reset-password', {
    handler: 'src/functions/superadmin/admins/reset-password.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // ============================================
  // GLOBAL MUSIC LIBRARY
  // ============================================

  // GET /superadmin/music-library - List all global music tracks
  api.route('GET /superadmin/music-library', {
    handler: 'src/functions/superadmin/music-library/list.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /superadmin/music-library/upload-url - Request presigned URL for upload
  api.route('POST /superadmin/music-library/upload-url', {
    handler: 'src/functions/superadmin/music-library/request-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // POST /superadmin/music-library/confirm - Confirm upload
  api.route('POST /superadmin/music-library/confirm', {
    handler: 'src/functions/superadmin/music-library/confirm-upload.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // PUT /superadmin/music-library/{id} - Update track metadata
  api.route('PUT /superadmin/music-library/{id}', {
    handler: 'src/functions/superadmin/music-library/update.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })

  // DELETE /superadmin/music-library/{id} - Delete track (with replacement if in use)
  api.route('DELETE /superadmin/music-library/{id}', {
    handler: 'src/functions/superadmin/music-library/delete.handler',
    link: [table, tokenSecret, imageBucket],
    ...functionConfig,
  })

  // PUT /superadmin/music-library/reorder - Reorder tracks within category
  api.route('PUT /superadmin/music-library/reorder', {
    handler: 'src/functions/superadmin/music-library/reorder.handler',
    link: [table, tokenSecret],
    ...functionConfig,
  })
}
