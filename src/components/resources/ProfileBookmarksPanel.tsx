/**
 * ProfileBookmarksPanel
 * - Floating bookmark button with profile-specific resource file bookmarks
 * - Right-side drawer panel for quick access to bookmarked files
 * - Search, open, and remove actions for individual resource files
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck, Download, File, FileSpreadsheet, FileText, Play, Search, Trash2, X } from 'lucide-react';
import { useResourceBookmarkStore } from '../../stores/resourceBookmarkStore';
import { useProfileStore } from '../../stores/profileStore';
import { cn } from '../../lib/utils';
import { isDoc, isPdf, isSpreadsheet, isVideo } from '../../services/supabaseStorage';
import type { StorageFileItem } from '../../services/supabaseStorage';

interface ProfileBookmarksPanelProps {
  className?: string;
}

/**
 * Get appropriate icon for file type
 */
function getFileIcon(item: StorageFileItem) {
  if (isVideo(item)) return <Play className="h-4 w-4 text-blue-600" />;
  if (isSpreadsheet(item)) return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
  if (isPdf(item) || isDoc(item)) return <FileText className="h-4 w-4 text-slate-700" />;
  return <File className="h-4 w-4 text-slate-700" />;
}

/**
 * Get program display name from path
 */
function getProgramDisplay(path: string): string {
  const programSlug = path.split('/')[0];
  const programMap: Record<string, string> = {
    'mtmthefuturetoday': 'MTM The Future Today',
    'timemymeds': 'Time My Meds',
    'testandtreat': 'Test and Treat',
    'hba1c': 'HbA1c',
    'oralcontraceptives': 'Oral Contraceptives'
  };
  return programMap[programSlug] || programSlug.toUpperCase();
}

export default function ProfileBookmarksPanel({ className }: ProfileBookmarksPanelProps) {
  const { currentProfile } = useProfileStore();
  const { bookmarkedResources, loadBookmarks, toggleBookmark } = useResourceBookmarkStore();
  
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedFiles, setBookmarkedFiles] = useState<StorageFileItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load bookmarks when profile changes
  useEffect(() => {
    if (currentProfile?.id) {
      loadBookmarks(currentProfile.id);
    }
  }, [currentProfile?.id, loadBookmarks]);

  // Convert bookmarked resources to file items
  useEffect(() => {
    if (!bookmarkedResources) {
      setBookmarkedFiles([]);
      return;
    }

    const files: StorageFileItem[] = Array.from(bookmarkedResources.entries()).map(([path, catalogId]) => {
      const filename = path.split('/').pop() || path;
      const extension = filename.split('.').pop()?.toLowerCase() || '';
      
      return {
        path,
        title: filename.replace(/\.[^/.]+$/, ''), // Remove extension
        filename,
        url: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/clinicalrxqfiles/${encodeURI(path)}`,
        mimeType: getMimeTypeFromExtension(extension),
        size: 0,
        catalogId,
      };
    });
    
    setBookmarkedFiles(files);
  }, [bookmarkedResources]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Filter bookmarks by search query
  const filteredBookmarks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bookmarkedFiles;
    
    return bookmarkedFiles.filter(file => {
      const searchText = [
        file.title,
        file.filename,
        getProgramDisplay(file.path),
        file.path
      ].join(' ').toLowerCase();
      
      return searchText.includes(query);
    });
  }, [bookmarkedFiles, searchQuery]);

  const handleRemoveBookmark = async (file: StorageFileItem) => {
    if (!currentProfile?.id) return;
    
    try {
      await toggleBookmark(currentProfile.id, file);
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };

  const total = bookmarkedFiles.length;

  if (!currentProfile) return null;

  return (
    <>
      {/* Floating bookmark button */}
      <button
        type="button"
        aria-label="Open bookmarked resources"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-24 right-5 z-40 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-3 text-slate-700 shadow-lg transition hover:bg-slate-50',
          className
        )}
      >
        <Bookmark className="h-5 w-5" />
        {total > 0 && (
          <span
            className="absolute -right-1 -top-1 min-w-5 rounded-full bg-blue-500 px-1 text-center text-[11px] font-semibold leading-5 text-white"
            aria-label={`${total} bookmarked ${total === 1 ? 'file' : 'files'}`}
          >
            {total}
          </span>
        )}
      </button>

      {/* Overlay + Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bookmarked Resources"
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="text-blue-600 h-5 w-5" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Bookmarked Resources
                </h2>
                <span className="text-xs text-slate-500">({total})</span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-slate-200 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookmarked files..."
                  className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none ring-0 transition focus:border-blue-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex h-[calc(100%-124px)] flex-col overflow-hidden">
              {filteredBookmarks.length > 0 ? (
                <ul className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredBookmarks.map((file) => (
                    <BookmarkFileRow
                      key={file.path}
                      file={file}
                      onRemove={() => handleRemoveBookmark(file)}
                    />
                  ))}
                </ul>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center">
                  <div>
                    <div className="mb-2 text-sm font-medium text-slate-900">
                      {searchQuery ? 'No results' : 'No bookmarked files yet'}
                    </div>
                    <p className="mx-auto max-w-xs text-xs text-slate-600">
                      {searchQuery
                        ? 'Try a different search term.'
                        : 'Look for the bookmark icon on resource files to save them here.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-200 p-3">
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 w-full"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * Individual bookmark file row
 */
function BookmarkFileRow({
  file,
  onRemove,
}: {
  file: StorageFileItem;
  onRemove: () => void;
}) {
  const programDisplay = getProgramDisplay(file.path);
  const isVideoFile = isVideo(file);

  return (
    <li className="group flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {getFileIcon(file)}
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {programDisplay}
          </span>
        </div>
        <div className="truncate text-sm font-medium text-slate-900 mb-1">
          {file.title}
        </div>
        <div className="text-xs text-slate-500">
          {file.filename}
        </div>
      </div>
      
      <div className="flex shrink-0 items-center gap-2">
        {/* Open/Download button */}
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 hover:bg-slate-50"
          title={isVideoFile ? "Play video" : "Download file"}
        >
          {isVideoFile ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
        </a>
        
        {/* Remove bookmark button */}
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 items-center justify-center rounded-md border border-red-300 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100"
          title="Remove bookmark"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

// Helper to get MIME type from file extension
function getMimeTypeFromExtension(extension: string): string | undefined {
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'webm': 'video/webm',
  };
  return mimeMap[extension];
}