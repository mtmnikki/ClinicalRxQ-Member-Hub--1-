# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClinicalRxQ Member Hub - A React/TypeScript web application for pharmacy member management with Supabase backend integration.

## Commands

```bash
# Development
npm install              # Install dependencies
npm run dev              # Start development server with esbuild
npm run build            # Production build with esbuild

# Code Quality
node scripts/lint.mjs              # Run ESLint
node scripts/lint.mjs --fix        # Run ESLint with auto-fix
```

## Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: esbuild with custom configuration
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand stores
- **Routing**: React Router v7 with hash routing
- **Forms**: React Hook Form + Zod validation
- **Backend**: Supabase (Auth + Database + Storage)
- **UI Components**: Radix UI primitives

### Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (button, card, dialog, etc.)
│   ├── auth/            # AuthContext, ProtectedRoute, ProfileGate
│   ├── layout/          # AppShell, Header, Footer, Sidebars
│   ├── common/          # ErrorBoundary, ScrollToTop, BrandLogo
│   └── [feature]/       # Feature-specific components
├── pages/               # Route components
├── services/            # External service integrations
│   ├── supabase.ts      # Supabase client configuration
│   ├── supabaseStorage.ts # Storage utilities
│   └── storageCatalog.ts  # Resource catalog management
├── stores/              # Zustand state stores
│   ├── authStore.ts     # Authentication state with account data
│   ├── profileStore.ts  # Selected member profile state
│   ├── resourceBookmarkStore.ts # Resource bookmarks per profile
│   └── uiStore.ts       # UI state (sidebar, modals, etc.)
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions
└── config/             # Configuration files
```

### Authentication Flow

1. **Supabase Auth** handles user authentication (email/password)
2. **authStore** manages session state and fetches account data from `public.accounts` table
3. **AuthContext** provides account data to components via React Context
4. **ProtectedRoute** guards member-only routes

### Data Model

- **Account** (public.accounts): Primary authenticated entity
  - Contains pharmacy details, subscription status
  - One account can have multiple profiles
- **MemberProfile** (member_profiles): Individual pharmacy staff profiles
  - Linked to account via `member_account_id`
  - Roles: Pharmacist-PIC, Pharmacist-Staff, Pharmacy Technician

### Key Implementation Details

1. **Path Aliases**: `@/` maps to `./src/` directory (configured in both tsconfig.json and build.mjs)
2. **Environment Variables**:
   - `VITE_SUPABASE_URL`: Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key
   - Variables are injected at build time via esbuild's `define` option (not runtime)
3. **Build Configuration**: 
   - esbuild with watch mode for development, serves on random port
   - IIFE format with sourcemaps in development, minified for production
   - Custom style plugin processes CSS with Tailwind + Autoprefixer
   - File loaders for images (.png, .svg, .jpg, .jpeg) and HTML copying
4. **ESLint Configuration**:
   - Uses flat config format (eslint.config.js)
   - TypeScript, React, React Hooks, and JSX A11y plugins
   - Custom lint script at `scripts/lint.mjs` with optional --fix flag

### Development Workflow

After making changes, always run:
```bash
node scripts/lint.mjs --fix    # Fix linting issues
npm run build                  # Verify build succeeds
```

### Architecture Notes

- **Account vs Profile**: Account is the authenticated pharmacy entity; Profile is individual team members
- **State Management**: Each store handles a specific domain (auth, profiles, bookmarks, UI)
- **File Processing**: Static assets are copied/processed by esbuild loaders during build
- **TypeScript**: Strict mode enabled with path mapping for clean imports

### Important Notes

1. **No Legacy Code**: Airtable and mock API references have been removed
2. **Hash Routing**: Uses HashRouter for compatibility
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **Error Handling**: Comprehensive error boundaries and try-catch blocks