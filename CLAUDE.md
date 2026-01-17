# Wedding Website Project

## Project Overview
A wedding website with a Vue 3 frontend and AWS serverless backend using SST.

## Project Structure

```
wedding/
├── frontend/          # Vue 3 + TypeScript + Vite + Tailwind CSS
│   └── src/
│       ├── components/   # Vue components
│       ├── composables/  # Vue composables (hooks)
│       ├── i18n/         # Internationalization translations
│       ├── services/     # API services
│       ├── views/        # Page views
│       └── types/        # TypeScript types
├── backend/           # SST (AWS Serverless Stack)
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

1. **Missing i18n translations**: When adding new UI text, update both:
   - The `AdminTranslations` interface (type definition)
   - Both `en` and `ms` objects in `adminTranslations`

2. **Passing `undefined` to optional props**: Use nullish coalescing (`?? []`) or spread patterns instead

3. **Unused imports after refactoring**: Remove imports that are no longer used

4. **Type mismatches with readonly arrays**: Cast readonly arrays when passing to components:
   ```typescript
   :prop="(readonlyArray as MutableType[]) ?? []"
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

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Vite, Tailwind CSS 4
- **Backend**: SST, AWS Lambda, DynamoDB, S3
- **Package Manager**: pnpm

## Key Features

- Admin CMS for managing wedding content
- RSVP management
- Gift registry
- Image gallery
- Music player
- Parking guide (images, step-by-step directions, video walkthrough)
- Multi-language support (i18n)
- Theme customization

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

## Important Notes

- Use `pnpm` for package management (not npm)
- Frontend uses Vue 3 Composition API with `<script setup>`
- Backend uses SST v3 with AWS CDK
- **Always run `pnpm build` locally before pushing** to catch TypeScript errors early
- Theme types: `PresetThemeId` for actual themes with definitions, `LegacyThemeId` for old theme IDs used in translations, `ThemeId` for all possible IDs
- When adding new types to interfaces (e.g., `VenueData`), ensure all usages handle the new property correctly
