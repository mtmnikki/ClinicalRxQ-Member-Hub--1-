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
  - Roles: Pharmacist, Pharmacist-PIC, Pharmacy Technician, Intern, Pharmacy

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

### Critical Requirements & Potential Crash Points

#### Environment Variables (CRITICAL)
- **REQUIRED**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set
- Missing these will crash the app on startup (src/services/supabase.ts:14-16)

#### Form Validation
- Forms use React Hook Form with Zod validation
- **AddProfileModalSupabase**: All fields are optional, but at least one of role/firstName/lastName must be provided
- Validation errors are handled gracefully

#### Common Crash Scenarios to Avoid
1. **Array Operations**: Always check arrays before `.map()`, `.filter()`, `.find()`
   - Dashboard.tsx has multiple array operations that need null checks
   - ProfileGate.tsx maps over profiles array without validation
2. **Property Access**: Use optional chaining (`?.`) for potentially null objects
   - authStore.ts accesses `session.user.id` directly
   - Dashboard.tsx accesses `currentProfile.displayName` without checks
3. **JSON Parsing**: Wrap `JSON.parse()` in try-catch blocks
   - profileStore.ts parses sessionStorage without error handling
4. **Path Manipulation**: Check strings before `.split()` operations
   - Multiple components split file paths without null validation

#### Database Considerations
- Supabase queries may return null for JOINed tables
- Always use `data || []` pattern for array results
- Check nested properties from database relations with optional chaining