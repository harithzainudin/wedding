# Wedding Website Project

## Project Overview

A wedding website with a Vue 3 frontend and AWS serverless backend using SST.

## Project Structure

```
wedding/
├── frontend/          # Vue 3 + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── components/   # Vue components (admin/, sections/, ui/)
│       ├── composables/  # Vue composables (hooks)
│       ├── config/       # App configuration
│       ├── constants/    # Constants (themes, etc.)
│       ├── i18n/         # Internationalization translations
│       ├── router/       # Vue Router configuration
│       ├── services/     # API services
│       ├── types/        # TypeScript types
│       ├── utils/        # Helper utilities
│       └── views/        # Page views
├── backend/           # SST (AWS Serverless Stack)
│   ├── infra/            # Infrastructure definitions
│   └── src/
│       └── functions/    # Lambda functions
└── .claude/           # Claude Code configuration
```

## Code Quality Standards

**Before pushing to git, run checks to prevent CI failures:**

1. **TypeScript**: Must pass type checking
2. **Prettier**: Code must be formatted
3. **Build**: Frontend build must succeed

### Strict TypeScript Configuration

The frontend uses strict TypeScript settings that cause common CI failures:

#### `exactOptionalPropertyTypes: true`

Optional properties cannot be explicitly set to `undefined`. Omit the property instead.

```typescript
// BAD - will fail
const obj: { name?: string } = { name: undefined }

// GOOD - omit the property
const obj: { name?: string } = {}

// GOOD - conditionally spread
const obj = { ...(value ? { name: value } : {}) }
```

#### `noUncheckedIndexedAccess: true`

Array access returns `T | undefined`. Always check for undefined or use non-null assertion when safe.

```typescript
const arr = ['a', 'b', 'c']

// BAD - arr[0] is string | undefined
const first: string = arr[0]

// GOOD - use non-null assertion when you know index is valid
const first = arr[0]!

// GOOD - use optional chaining
const first = arr[0]?.toUpperCase()
```

#### `noUnusedLocals: true` / `noUnusedParameters: true`

Remove unused imports, variables, and parameters to avoid build failures.

### Common CI Failure Patterns

1. **Missing i18n translations**: When adding new UI text, update THREE places:

   - The interface (e.g., `AdminTranslations` or `Translations`)
   - The `en` translation object
   - The `ms` translation object

2. **Passing `undefined` to optional props in Vue templates**: Use `v-bind` with conditional object:

   ```vue
   <!-- BAD - weddingSlug can be undefined -->
   <Component :wedding-slug="weddingSlug" />

   <!-- GOOD - only pass prop if it has a value -->
   <Component v-bind="weddingSlug ? { weddingSlug } : {}" />
   ```

3. **Using `.value` in Vue templates**: Refs are auto-unwrapped in templates:

   ```vue
   <!-- BAD - don't use .value in templates -->
   @click="fetchData(someRef.value)"

   <!-- GOOD - refs are auto-unwrapped -->
   @click="fetchData(someRef)"
   ```

4. **Unused imports after refactoring**: Remove imports that are no longer used

5. **Type mismatches with readonly arrays**: Cast readonly arrays when passing to components:

   ```typescript
   :prop="(readonlyArray as MutableType[]) ?? []"
   ```

6. **Optional properties with `| undefined` values**: Use conditional spread, not direct assignment:

   ```typescript
   // BAD - compressionInfo can be undefined
   uploadProgress.set(id, {
     progress: 10,
     compression: compressionInfo, // ❌ Type error
   })

   // GOOD - conditionally spread
   uploadProgress.set(id, {
     progress: 10,
     ...(compressionInfo && { compression: compressionInfo }), // ✅
   })
   ```

7. **Missing type properties**: When using a property in code/template, ensure it exists in the type:

   ```typescript
   // If template uses `{{ wedding.plan }}`, the Wedding interface must have:
   interface Wedding {
     plan?: string // Add this!
   }
   ```

8. **TabType mismatches between components**: When emitting tab changes, ensure the `TabType` union matches between parent and child components

9. **Closure type narrowing with async callbacks**: TypeScript can't track variable assignments inside Promise callbacks:

   ```typescript
   // BAD - TypeScript narrows criticalError to 'never' after Promise.all
   let criticalError: ErrorType | null = null
   await Promise.all([
     promise.catch((err) => {
       criticalError = err
     }),
   ])
   if (criticalError) {
     console.log(criticalError.message) // ❌ Property 'message' does not exist on type 'never'
   }

   // GOOD - use type assertion
   if (criticalError !== null) {
     const error = criticalError as ErrorType
     console.log(error.message) // ✅
   }
   ```

10. **Undefined functions/variables in Vue templates**: Ensure functions used in templates are actually defined or imported in `<script setup>`. Typos like `@click="discardAllChanges"` when only `discardChanges` exists will fail in CI but may pass locally due to vue-tsc caching:

    ```vue
    <!-- BAD - function name typo, discardAllChanges doesn't exist -->
    <button @click="discardAllChanges">Discard</button>

    <!-- GOOD - use the actual function name from script setup -->
    <button @click="discardChanges">Discard</button>
    ```

    **Tip**: If CI fails but local build passes, clear the TypeScript build cache:

    ```bash
    rm -rf node_modules/.tmp node_modules/.vite && pnpm type-check
    ```

## Commands

### Frontend

```bash
cd frontend
pnpm dev          # Start dev server
pnpm build        # Build for production (includes type-check)
pnpm check        # Run all checks (TypeScript + Prettier + Build)
pnpm type-check   # TypeScript only
pnpm format       # Auto-format all files
pnpm format:check # Check formatting without fixing
```

### Backend

```bash
cd backend
pnpm dev          # Start SST dev
pnpm deploy       # Deploy to AWS
pnpm check        # Run all checks (TypeScript + Prettier)
pnpm type-check   # TypeScript only
pnpm format       # Auto-format all files
pnpm format:check # Check formatting without fixing
```

### Pre-Push Workflow

Before pushing, run checks in both frontend and backend:

```bash
cd frontend && pnpm check && cd ../backend && pnpm check
```

**Important**: If you've made significant changes or want to ensure CI won't fail, clear the TypeScript build cache first to match CI's fresh environment:

```bash
cd frontend && rm -rf node_modules/.tmp node_modules/.vite && pnpm check
```

This prevents the common issue where local builds pass (due to caching) but CI fails.

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Vite, Tailwind CSS 4
- **Backend**: SST, AWS Lambda, DynamoDB, S3
- **Package Manager**: pnpm

## Key Features

- Admin CMS for managing wedding content
- Super Admin dashboard for platform management
- Multi-tenant architecture (multiple weddings)
- RSVP management
- Gift registry with reservations
- Image gallery with drag-and-drop reordering
- Music player with autoplay settings
- Parking guide (images, step-by-step directions, video walkthrough)
- QR Code Hub for sharing links
- Multi-language support (i18n - 4 public, 2 admin)
- Theme customization with presets
- Dark mode support
- Countdown timer
- Image compression on upload

## Frontend Views

| View                 | Path                      | Purpose                        |
| -------------------- | ------------------------- | ------------------------------ |
| `LoginView.vue`      | `/login`                  | Unified admin login page       |
| `HomeView.vue`       | `/{slug}` or `/`          | Public wedding landing page    |
| `RsvpView.vue`       | `/{slug}/rsvp` or `/rsvp` | Public RSVP submission         |
| `AdminView.vue`      | `/{slug}/admin/:tab?`     | Wedding admin CMS              |
| `SuperAdminView.vue` | `/superadmin/:tab?`       | Platform super admin dashboard |
| `NotFoundView.vue`   | `*`                       | 404 page                       |

### Navigation Guards

The router includes authentication guards (`router/index.ts`):

- **Unauthenticated users** accessing protected routes → Redirected to `/login`
- **Authenticated users** accessing `/login` → Redirected based on user type:
  - Super Admin / Staff → `/superadmin`
  - Client → `/{primaryWeddingSlug}/admin`
- **Client users** accessing `/superadmin` → Redirected to their wedding admin

## URL Structure & Base URL Configuration

The frontend is configured with a base URL of `/wedding` in `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/wedding',
  // ...
})
```

### Why Base URL `/wedding`?

This allows the wedding site to be served from a subpath (e.g., `yourdomain.com/wedding/`) rather than the root. This is useful when deploying alongside other applications on the same domain.

### Development URLs

When running `pnpm dev`, all URLs must include the `/wedding` prefix:

| Page                  | URL                                               |
| --------------------- | ------------------------------------------------- |
| Login                 | `http://localhost:5173/wedding/login`             |
| Public Wedding        | `http://localhost:5173/wedding/ahmad-sarah`       |
| RSVP Page             | `http://localhost:5173/wedding/ahmad-sarah/rsvp`  |
| Wedding Admin         | `http://localhost:5173/wedding/ahmad-sarah/admin` |
| Super Admin Dashboard | `http://localhost:5173/wedding/superadmin`        |

### Multi-Tenant Route Structure

The app supports multi-tenant weddings with path-based routing:

```
/wedding/login                      # Unified admin login page
/wedding/                           # Landing/home (legacy)
/wedding/{weddingSlug}              # Public wedding page (e.g., /wedding/ahmad-sarah)
/wedding/{weddingSlug}/rsvp         # RSVP page for a wedding
/wedding/{weddingSlug}/admin        # Admin panel dashboard
/wedding/{weddingSlug}/admin/{tab}  # Admin panel specific tab (venue, gallery, etc.)
/wedding/superadmin                 # Super admin dashboard
/wedding/superadmin/{tab}           # Super admin specific tab (weddings, staff)
```

### Admin Tab URLs

Admin panel uses path-based tabs for proper browser navigation (back/forward buttons work):

| Tab             | URL Example                            |
| --------------- | -------------------------------------- |
| Dashboard       | `/wedding/ahmad-sarah/admin`           |
| Wedding Details | `/wedding/ahmad-sarah/admin/wedding`   |
| Venue           | `/wedding/ahmad-sarah/admin/venue`     |
| Schedule        | `/wedding/ahmad-sarah/admin/schedule`  |
| Gallery         | `/wedding/ahmad-sarah/admin/gallery`   |
| Music           | `/wedding/ahmad-sarah/admin/music`     |
| Gifts           | `/wedding/ahmad-sarah/admin/gifts`     |
| Theme           | `/wedding/ahmad-sarah/admin/theme`     |
| Contacts        | `/wedding/ahmad-sarah/admin/contacts`  |
| RSVPs           | `/wedding/ahmad-sarah/admin/rsvps`     |
| QR Hub          | `/wedding/ahmad-sarah/admin/qrcodehub` |

### Super Admin Tab URLs

| Tab      | URL Example                 |
| -------- | --------------------------- |
| Weddings | `/wedding/superadmin`       |
| Staff    | `/wedding/superadmin/staff` |

### User Types

- **Super Admin**: Platform owner who can create/manage all weddings. Access via `/wedding/superadmin`
- **Staff**: Colleagues who help manage weddings. Can be assigned to multiple weddings. Created in Super Admin → Staff tab
- **Client**: Wedding couples/families who manage their own wedding. Usually assigned to 1 wedding. Has optional role label (Bride, Groom, Parent, etc.)
- **Guest**: Public visitors viewing wedding pages

Note: Staff and Client are both stored as `ADMIN#{username}` with a `userType` field distinguishing them.

### Super Admin Capabilities

The super admin dashboard (`/wedding/superadmin`) provides platform-wide management:

| Feature              | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| List Weddings        | View all weddings with status, owner, and dates                       |
| Create Wedding       | Create new wedding with slug, display name, and initial owner account |
| Edit Wedding         | Update display name, wedding date, status, and plan                   |
| Archive Wedding      | Soft-delete a wedding (sets status to 'archived')                     |
| Hard Delete Wedding  | Permanently delete archived wedding + all data (DynamoDB + S3)        |
| Manage Owners        | Add/remove owners (co-owners) for a wedding                           |
| Reset Password       | Generate temporary password for wedding owners                        |
| Cleanup Orphan Data  | One-time cleanup of legacy single-tenant data (dry run supported)     |
| **Staff Management** | Create/edit/delete staff members who can manage multiple weddings     |

### Staff Management

The Staff tab in Super Admin allows managing reusable team accounts:

- **Create Staff**: Add colleagues with username, email, password
- **Assign to Weddings**: When creating a wedding, choose "Assign Staff" to link existing staff
- **Multi-Wedding Access**: Staff can manage multiple weddings with one account
- **Auto-Cleanup**: Deleting a staff member removes them from all assigned weddings

### Super Admin API Endpoints

```
# Wedding Management
GET    /superadmin/weddings                              # List all weddings
POST   /superadmin/weddings                              # Create wedding + owner (staff or client)
GET    /superadmin/weddings/{weddingId}                  # Get wedding details + admins
PUT    /superadmin/weddings/{weddingId}                  # Update wedding
DELETE /superadmin/weddings/{weddingId}                  # Archive wedding (soft delete)
DELETE /superadmin/weddings/{weddingId}/hard-delete      # Permanently delete (archived only)
GET    /superadmin/weddings/{weddingId}/deletion-preview # Preview deletion counts
POST   /superadmin/weddings/{weddingId}/users            # Add owner
PUT    /superadmin/weddings/{weddingId}/users/{username} # Update owner details
DELETE /superadmin/weddings/{weddingId}/users/{username} # Remove owner
POST   /superadmin/weddings/{weddingId}/users/{username}/reset-password # Reset password

# Staff Management
GET    /superadmin/staff                                 # List all staff members
POST   /superadmin/staff                                 # Create staff member
PUT    /superadmin/staff/{username}                      # Update staff (email/password)
DELETE /superadmin/staff/{username}                      # Delete staff (removes from all weddings)

# Utilities
POST   /superadmin/cleanup-orphan-data                   # Cleanup legacy orphan data
```

### Admin API Endpoints

Admin endpoints support both legacy (single-tenant) and multi-tenant patterns:

```
# Authentication
POST   /admin/login                                      # Login (returns userType, adminUserType, weddingIds)
POST   /admin/refresh                                    # Refresh token
GET    /admin/profile                                    # Get current user profile
POST   /admin/set-new-password                           # Set password after forced reset

# Wedding Context
GET    /admin/my-weddings                                # List weddings assigned to current user
GET    /admin/resolve-slug/{slug}                        # Resolve slug to weddingId

# Multi-Tenant Feature Endpoints (use /admin/w/{weddingId}/...)
GET    /admin/w/{weddingId}/rsvps                        # List RSVPs for wedding
GET    /admin/w/{weddingId}/images                       # List images for wedding
GET    /admin/w/{weddingId}/gifts                        # List gifts for wedding
# ... all feature endpoints follow this pattern
```

### Common Mistake

If you access `http://localhost:5173/admin` without the `/wedding` prefix, Vite will show:

> "The server is configured with a public base URL of /wedding - did you mean to visit /wedding/admin instead?"

Always include the `/wedding` prefix in development URLs.

## Internationalization (i18n)

The project uses a custom lightweight i18n implementation with TypeScript for type safety.

### Public Site (4 languages)

- **Languages**: Malay (ms), English (en), Chinese (zh), Tamil (ta)
- **Default**: Malay
- **Storage**: `localStorage` key `wedding-language`
- **Composable**: `useLanguage()` from `@/composables/useLanguage`
- **Toggle**: `LanguageToggle.vue` component

### Admin CMS (2 languages)

- **Languages**: English (en), Malay (ms)
- **Default**: English
- **Storage**: `localStorage` key `wedding-admin-language`
- **Composable**: `useAdminLanguage()` from `@/composables/useAdminLanguage`
- **Toggle**: `AdminLanguageToggle.vue` component

### Translation Files

- **Location**: `/frontend/src/i18n/translations.ts`
- **Structure**: TypeScript interfaces for type-safe translations
- **Public translations**: `Translations` interface, `translations` object
- **Admin translations**: `AdminTranslations` interface, `adminTranslations` object

### Usage in Components

```typescript
// Public pages
const { t, setLanguage } = useLanguage()
// Access: t.value.section.key

// Admin pages
const { adminT, setAdminLanguage } = useAdminLanguage()
// Access: adminT.value.section.key

// String interpolation for dynamic values
import { interpolate } from '@/i18n/translations'
interpolate(adminT.value.rsvps.deleteGuestConfirm, { name: 'John' })
```

### Adding New Translation Keys

When adding new UI text, you must update 3 places in `/frontend/src/i18n/translations.ts`:

1. **Interface**: Add the key to the appropriate interface (e.g., `AdminTranslations`)
2. **English translations**: Add the English value in `adminTranslations.en`
3. **Malay translations**: Add the Malay value in `adminTranslations.ms`

Example - adding a new button label:

```typescript
// 1. In AdminTranslations interface under 'common'
common: {
  // ... existing keys
  newButton: string  // Add this
}

// 2. In adminTranslations.en.common
newButton: 'New Button',

// 3. In adminTranslations.ms.common
newButton: 'Butang Baharu',
```

## Key Composables

The frontend uses Vue composables for state management and API interactions:

### Admin & Auth

| Composable            | Purpose                              | Location                           |
| --------------------- | ------------------------------------ | ---------------------------------- |
| `useSuperAdmin()`     | Super admin wedding/user management  | `composables/useSuperAdmin.ts`     |
| `useStaff()`          | Staff member CRUD operations         | `composables/useStaff.ts`          |
| `useAdminAuth()`      | Admin authentication state and login | `composables/useAdminAuth.ts`      |
| `useAdminUsers()`     | Admin user CRUD operations           | `composables/useAdminUsers.ts`     |
| `useWeddingContext()` | Multi-tenant wedding context/slug    | `composables/useWeddingContext.ts` |
| `useProfile()`        | Admin profile management             | `composables/useProfile.ts`        |
| `usePasswordChange()` | Password change modal handling       | `composables/usePasswordChange.ts` |

### Feature Management

| Composable               | Purpose                             | Location                              |
| ------------------------ | ----------------------------------- | ------------------------------------- |
| `useWeddingDetails()`    | Wedding details (names, date, etc.) | `composables/useWeddingDetails.ts`    |
| `useVenue()`             | Venue/location settings             | `composables/useVenue.ts`             |
| `useVenueConfig()`       | Venue configuration                 | `composables/useVenueConfig.ts`       |
| `useSchedule()`          | Schedule/timeline management        | `composables/useSchedule.ts`          |
| `useGallery()`           | Image gallery management            | `composables/useGallery.ts`           |
| `useMusic()`             | Music player settings               | `composables/useMusic.ts`             |
| `useGifts()`             | Gift registry management            | `composables/useGifts.ts`             |
| `usePublicGifts()`       | Public gift viewing (guests)        | `composables/usePublicGifts.ts`       |
| `useRsvps()`             | RSVP management                     | `composables/useRsvps.ts`             |
| `useContacts()`          | Contacts management                 | `composables/useContacts.ts`          |
| `useTheme()`             | Theme customization                 | `composables/useTheme.ts`             |
| `useQRCodeHub()`         | QR code hub settings                | `composables/useQRCodeHub.ts`         |
| `useParkingImages()`     | Parking guide image management      | `composables/useParkingImages.ts`     |
| `usePublicWeddingData()` | Public wedding data loading         | `composables/usePublicWeddingData.ts` |

### UI & Utilities

| Composable           | Purpose                        | Location                          |
| -------------------- | ------------------------------ | --------------------------------- |
| `useLanguage()`      | Public site i18n (4 languages) | `composables/useLanguage.ts`      |
| `useAdminLanguage()` | Admin CMS i18n (2 languages)   | `composables/useAdminLanguage.ts` |
| `useDarkMode()`      | Dark mode toggle               | `composables/useDarkMode.ts`      |
| `useDocumentTitle()` | Page title management          | `composables/useDocumentTitle.ts` |
| `useScrollReveal()`  | Scroll-based animations        | `composables/useScrollReveal.ts`  |
| `useThemePreview()`  | Theme preview in customizer    | `composables/useThemePreview.ts`  |
| `useCalendar()`      | Calendar utilities             | `composables/useCalendar.ts`      |
| `useNameOrder()`     | Display name ordering          | `composables/useNameOrder.ts`     |
| `useCrudList()`      | Generic CRUD list operations   | `composables/useCrudList.ts`      |

## Wedding Slug Handling (Important!)

The project has two different sources for wedding slug that serve different purposes. Using the wrong one causes API 404 errors.

### Slug Sources

| Source | Use Case | Scope |
|--------|----------|-------|
| `route.params.weddingSlug` | **Public pages** - Use this in views like `GiftsView`, `RsvpView` | Page-level |
| `usePublicWeddingData().currentWeddingSlug` | Section components on `HomeView` | Singleton state |
| `useWeddingContext().weddingSlug` | **Admin pages only** - For admin panel operations | Singleton state |

### ⚠️ Common Mistake

**DO NOT** use `useWeddingContext()` in public-facing views (GiftsView, RsvpView, etc.). It's designed for admin pages and is **never set** for public page navigation.

```typescript
// ❌ BAD - useWeddingContext is for admin pages, not public views
import { useWeddingContext } from '@/composables/useWeddingContext'
const { weddingSlug } = useWeddingContext()  // Will be null!

// ✅ GOOD - Get slug from route params for public views
import { useRoute } from 'vue-router'
const route = useRoute()
const weddingSlug = computed(() => {
  const slug = route.params.weddingSlug
  return typeof slug === 'string' ? slug : null
})
```

### Correct Patterns by View Type

**Public dedicated pages** (GiftsView, RsvpView):
```typescript
// Get slug from route params
const route = useRoute()
const weddingSlug = computed(() => {
  const slug = route.params.weddingSlug
  return typeof slug === 'string' ? slug : null
})

// Use for back links
const backPath = computed(() => weddingSlug.value ? `/${weddingSlug.value}` : '/')

// Use for API calls
onMounted(() => {
  fetchData(weddingSlug.value ?? undefined)
})
```

**Section components in HomeView** (GallerySection, QRCodeHubSection, etc.):
```typescript
// Use the singleton from usePublicWeddingData (set by HomeView)
const { currentWeddingSlug } = usePublicWeddingData()

// Use for API calls
const data = await listGalleryImagesCached(currentWeddingSlug.value ?? undefined)
```

**Admin views**:
```typescript
// Use useWeddingContext for admin operations
const { weddingId, weddingSlug } = useWeddingContext()

// Use weddingId for admin API calls
const data = await listGalleryImages(weddingId.value ?? undefined)
```

### API URL Patterns

| Context | API URL Helper | URL Pattern |
|---------|----------------|-------------|
| Public endpoints | `buildPublicUrl(endpoint, slug)` | `/{slug}/endpoint` |
| Admin endpoints | `buildAdminUrl(endpoint, weddingId)` | `/admin/w/{weddingId}/endpoint` |

When slug/weddingId is `undefined`, the API falls back to legacy single-tenant routes.

## Frontend Utilities

Helper utilities in `/frontend/src/utils/`:

| Utility               | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `imageCompression.ts` | Client-side image compression before upload     |
| `apiCache.ts`         | API response caching system                     |
| `qrCodeFormats.ts`    | QR code format generators for various platforms |
| `themeInjector.ts`    | Dynamic theme CSS injection                     |

## Backend Architecture

### Authentication & Authorization

- **JWT tokens** with access (15min) and refresh (7d) tokens
- **Token types**: `super` (super admin), `wedding` (wedding owner), `legacy` (backward compat)
- **Auth middleware**: `requireSuperAdmin()` for super admin routes, `requireWeddingAccess(weddingId)` for wedding routes

### DynamoDB Key Patterns

```
# User profiles
SUPERADMIN#{username}/PROFILE            # Super admin profile
ADMIN#{username}/PROFILE                 # Wedding admin profile (staff or client)
                                         # - userType: 'staff' | 'client'
                                         # - roleLabel: 'Bride' | 'Groom' | 'Parent' | custom (clients only)

# Wedding core
WEDDING#{weddingId}/META                 # Wedding metadata
WEDDING_SLUG#{slug}/LOOKUP               # Slug → weddingId lookup
WEDDING#{weddingId}#ADMINS/{username}    # Wedding-Admin link (role: owner/coowner)
WEDDING#{weddingId}#SETTINGS/{type}      # Settings: VENUE, THEME, SCHEDULE, CONTACTS, etc.

# Wedding items
WEDDING#{weddingId}#RSVP#{id}/META       # RSVP entry
WEDDING#{weddingId}#IMAGE#{id}/META      # Gallery image
WEDDING#{weddingId}#MUSIC#{id}/META      # Music track
WEDDING#{weddingId}#GIFT#{id}/META       # Gift item
WEDDING#{weddingId}#PARKING#{id}/META    # Parking image
WEDDING#{weddingId}#QRCODE#{id}/META     # QR code image

# GSI patterns for queries
WEDDINGS/{createdAt}                     # All weddings list
STAFF/{createdAt}                        # All staff members list (gsi1pk='STAFF')
USER#{username}#WEDDINGS/{weddingId}     # User's weddings
WEDDING#{weddingId}#RSVPS/{submittedAt}  # Wedding RSVPs
WEDDING#{weddingId}#IMAGES/{order}#{id}  # Ordered images
```

### Handler Location Pattern

Backend handlers follow this structure:

```
backend/src/functions/
├── superadmin/              # Super admin endpoints
│   ├── weddings/            # Wedding management
│   │   ├── list.ts, create.ts, get.ts, update.ts, delete.ts
│   │   ├── hard-delete.ts, deletion-preview.ts
│   │   ├── add-owner.ts, remove-owner.ts, update-owner.ts
│   │   └── reset-owner-password.ts
│   ├── staff/               # Staff management
│   │   ├── list.ts, create.ts, update.ts, delete.ts
│   └── cleanup-orphan-data.ts # Legacy data cleanup (dry run supported)
├── admin/                   # Admin user management
│   ├── login.ts, refresh.ts, get-profile.ts
│   ├── create.ts, delete.ts, list.ts
│   ├── change-password.ts, set-new-password.ts
│   ├── force-reset-password.ts, update-email.ts
│   ├── my-weddings.ts, resolve-slug.ts
├── auth/                    # Public authentication
│   └── login.ts, refresh.ts
├── wedding-details/         # Wedding details (names, date)
├── venue/                   # Venue/location endpoints
├── schedule/                # Schedule/timeline endpoints
├── contacts/                # Contact information endpoints
├── images/                  # Gallery endpoints
├── music/                   # Music endpoints
├── gifts/                   # Gift registry endpoints
├── rsvp/                    # RSVP endpoints
├── parking/                 # Parking guide endpoints
├── qrcode-hub/              # QR code hub endpoints
├── theme/                   # Theme customization endpoints
└── shared/                  # Shared utilities
    ├── auth.ts              # JWT auth helpers
    ├── keys.ts              # DynamoDB key generators
    ├── s3-keys.ts           # S3 key generators
    ├── wedding-middleware.ts # Wedding context/status middleware
    ├── validation.ts        # Common validation
    ├── response.ts          # API response helpers
    ├── logger.ts            # Logging utility
    └── *-validation.ts      # Feature-specific validation
```

## Important Notes

- Use `pnpm` for package management (not npm)
- Frontend uses Vue 3 Composition API with `<script setup>`
- Backend uses SST v3 with AWS CDK
- **Always run `pnpm build` locally before pushing** to catch TypeScript errors early
- Theme types: `PresetThemeId` for actual themes with definitions, `LegacyThemeId` for old theme IDs used in translations, `ThemeId` for all possible IDs
- When adding new types to interfaces (e.g., `VenueData`), ensure all usages handle the new property correctly
- Backend type-check (`pnpm type-check`) may show errors from SST platform files - these are internal to SST and don't affect deployment
