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

## Important Notes

- Use `pnpm` for package management (not npm)
- Frontend uses Vue 3 Composition API with `<script setup>`
- Backend uses SST v3 with AWS CDK
