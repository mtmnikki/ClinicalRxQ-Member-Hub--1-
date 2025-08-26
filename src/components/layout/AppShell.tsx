/**
 * AppShell
 * - Purpose: Provide a fixed left sidebar layout for gated/member pages.
 * - Desktop-dense pass:
 *   - Sidebar remains fixed; width transitions smoothly when toggled.
 *   - Main content uses a compact, desktop-first scale.
 *   - Wider container to use horizontal space on large screens.
 */

import React from 'react';
import ProfileBookmarksPanel from '../resources/ProfileBookmarksPanel';

interface AppShellProps {
  /** Left sidebar content (e.g., MemberSidebar) */
  sidebar?: React.ReactNode;
  /** Optional top header bar for the page */
  header?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
}

/**
 * AppShell component
 */
export default function AppShell({ sidebar, header, children }: AppShellProps) {
  const sidebarWidth = sidebar ? (sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Fixed left sidebar with smooth width transition */}
      {sidebar ? (
        <aside
          className="fixed inset-y-0 left-0 z-40 border-r border-slate-800 bg-slate-900 transition-[width] duration-300 ease-in-out"
          aria-label="Primary member navigation"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Inner scroll area for long menus while keeping the frame static */}
          <div className="h-full overflow-y-auto">{sidebar}</div>
        </aside>
      ) : null}

      {/* Main area offset by the sidebar width */}
      <div
        className="min-h-screen transition-[padding-left] duration-300 ease-in-out"
        style={{ paddingLeft: sidebar ? `${sidebarWidth}px` : undefined }}
      >
        {/* Optional sticky header bar (page-level) */}
        {header ? (
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            {header}
          </div>
        ) : null}

        {/* Page content container */}
        <main className="mx-auto w-full max-w-[1440px] px-3 py-4 text-[13px]">{children}</main>
      </div>
      
      {/* Profile Bookmarks Panel - floating button + drawer */}
      <ProfileBookmarksPanel />
    </div>
  );
}
