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
  // Map of resource paths to their catalog IDs that are bookmarked by current profile
  bookmarkedResources: Map<string, string>; // path -> catalogId
  loading: boolean;
  
  // Actions
  isBookmarked: (resourcePath: string) => boolean;
  toggleBookmark: (profileId: string, resource: StorageFileItem) => Promise<void>;
  loadBookmarks: (profileId: string) => Promise<void>;
  clearBookmarks: () => void;
}

export const useResourceBookmarkStore = create<ResourceBookmarkState>((set, get) => ({
  bookmarkedResources: new Map(),
  loading: false,

  isBookmarked: (resourcePath: string) => {
    return get().bookmarkedResources.has(resourcePath);
  },

  toggleBookmark: async (profileId: string, resource: StorageFileItem) => {
    const { bookmarkedResources } = get();
    const wasBookmarked = bookmarkedResources.has(resource.path);

    // If no catalog ID, we need to find it from the storage_files_catalog
    let catalogId = resource.catalogId;
    if (!catalogId && !wasBookmarked) {
      // Try to find the catalog ID from the database
      const { data } = await supabase
        .from('storage_files_catalog')
        .select('id')
        .eq('file_path', resource.path)
        .eq('bucket_name', 'clinicalrxqfiles')
        .single();
      
      if (data?.id) {
        catalogId = data.id;
      } else {
        throw new Error('Resource not found in catalog');
      }
    }

    try {
      if (wasBookmarked) {
        // Get the catalog ID from our map
        const existingCatalogId = bookmarkedResources.get(resource.path);
        if (!existingCatalogId) {
          console.error('Bookmark exists but catalog ID not found');
          return;
        }

        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('profile_id', profileId)
          .eq('resource_id', existingCatalogId);

        const newResources = new Map(bookmarkedResources);
        newResources.delete(resource.path);
        set({ bookmarkedResources: newResources });
      } else {
        if (!catalogId) {
          throw new Error('Catalog ID required to create bookmark');
        }

        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            profile_id: profileId,
            resource_type: 'file',
            resource_id: catalogId,
          });

        const newResources = new Map(bookmarkedResources);
        newResources.set(resource.path, catalogId);
        set({ bookmarkedResources: newResources });
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      throw error;
    }
  },

  loadBookmarks: async (profileId: string) => {
    try {
      set({ loading: true });
      
      // Join bookmarks with storage_files_catalog to get both catalog ID and path
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          resource_id,
          storage_files_catalog (
            id,
            file_path
          )
        `)
        .eq('profile_id', profileId)
        .eq('resource_type', 'file');

      if (error) throw error;

      const resources = new Map<string, string>();
      
      // Build map of path -> catalogId
      for (const bookmark of (data || [])) {
        if (bookmark.storage_files_catalog?.file_path) {
          const path = bookmark.storage_files_catalog.file_path.replace(/^\/+/, ''); // normalize
          resources.set(path, bookmark.resource_id);
        }
      }
      
      set({ bookmarkedResources: resources });
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      set({ loading: false });
    }
  },

  clearBookmarks: () => {
    set({ bookmarkedResources: new Map() });
  },
}));