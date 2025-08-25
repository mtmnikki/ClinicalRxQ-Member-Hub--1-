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
│   ├── authStore.ts     # Authentication state
│   ├── profilesStore.ts # Member profiles management
│   ├── bookmarkStore.ts # Resource bookmarks
│   └── uiStore.ts       # UI state (sidebar, etc.)
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

1. **Path Aliases**: `@/` maps to `./src/` directory
2. **Environment Variables**:
   - `VITE_SUPABASE_URL`: Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key
3. **Build Configuration**: 
   - esbuild configured for IIFE format
   - Environment variables injected via `define` option
   - CSS processed with Tailwind + Autoprefixer

### Current State

- **Dashboard**: Contains placeholder data arrays that need Supabase integration
- **Authentication**: Fully functional with Supabase Auth
- **Profile Management**: Complete CRUD operations for member profiles
- **Storage**: Supabase storage integration for resources

### Important Notes

1. **No Legacy Code**: Airtable and mock API references have been removed
2. **Hash Routing**: Uses HashRouter for compatibility
3. **Type Safety**: Full TypeScript coverage with strict mode
4. **Error Handling**: Comprehensive error boundaries and try-catch blocks