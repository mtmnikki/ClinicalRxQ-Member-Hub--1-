/** 
 * uiStore
 * - Purpose: Manage global UI state such as the collapsible member sidebar.
 * - Persists to localStorage so the user’s preference survives reloads.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Sidebar width constants (px) */
export const SIDEBAR_WIDTH_EXPANDED = 256;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

interface UiState {
  /** Whether the member sidebar is collapsed into an icon rail */
  sidebarCollapsed: boolean;
  /** Toggle collapse */
  toggleSidebar: () => void;
  /** Explicitly set collapse */
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    { name: 'ui:state' }
  )
);
