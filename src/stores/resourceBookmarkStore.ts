/**
 * Resource Bookmark Store
 * - Manages bookmarks for individual resource files (PDFs, videos, documents)
 * - Bookmarks are stored per profile in Supabase bookmarks table
 * - Used by resource cards to show bookmark icon and toggle bookmark state
 */

import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import type { StorageFileItem } from '@/services/supabaseStorage';

interface ResourceBookmarkState {
  // Set of resource paths that are bookmarked by current profile
  bookmarkedPaths: Set<string>;
  loading: boolean;
  
  // Actions
  isBookmarked: (resourcePath: string) => boolean;
  toggleBookmark: (profileId: string, resource: StorageFileItem) => Promise<void>;
  loadBookmarks: (profileId: string) => Promise<void>;
  clearBookmarks: () => void;
}

export const useResourceBookmarkStore = create<ResourceBookmarkState>((set, get) => ({
  bookmarkedPaths: new Set(),
  loading: false,

  isBookmarked: (resourcePath: string) => {
    return get().bookmarkedPaths.has(resourcePath);
  },

  toggleBookmark: async (profileId: string, resource: StorageFileItem) => {
    const { bookmarkedPaths } = get();
    const wasBookmarked = bookmarkedPaths.has(resource.path);

    try {
      if (wasBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('profile_id', profileId)
          .eq('resource_id', resource.path);

        const newPaths = new Set(bookmarkedPaths);
        newPaths.delete(resource.path);
        set({ bookmarkedPaths: newPaths });
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            profile_id: profileId,
            resource_type: 'file',
            resource_id: resource.path,
          });

        const newPaths = new Set(bookmarkedPaths);
        newPaths.add(resource.path);
        set({ bookmarkedPaths: newPaths });
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      throw error;
    }
  },

  loadBookmarks: async (profileId: string) => {
    try {
      set({ loading: true });
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('resource_id')
        .eq('profile_id', profileId);

      if (error) throw error;

      const paths = new Set((data || []).map(row => row.resource_id));
      set({ bookmarkedPaths: paths });
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      set({ loading: false });
    }
  },

  clearBookmarks: () => {
    set({ bookmarkedPaths: new Set() });
  },
}));