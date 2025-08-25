/**
 * ProfileSelectionModal
 * - Non-blocking modal that appears on dashboard after authentication
 * - Allows users to select which team member profile they're using
 * - Account access is never blocked - profiles are optional
 * - Errors in profile loading don't prevent site access
 */

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProfileStore } from '../../stores/profileStore';
import type { MemberProfile } from '../../types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import AddProfileModalSupabase from '../profiles/AddProfileModalSupabase';
import { toast } from 'sonner';

/** Render a compact profile selection list. */
function ProfileList({
  profiles,
  selectedId,
  onSelect,
}: {
  profiles: MemberProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-3 divide-y rounded-md border bg-white">
      {profiles.map((p) => {
        const active = selectedId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            className={[
              'flex w-full items-center justify-between px-3 py-2 text-left transition-colors',
              active ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50',
            ].join(' ')}
            onClick={() => onSelect(p.id)}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-900">
                {p.displayName}
              </div>
              <div className="text-xs text-slate-500">{p.role}</div>
            </div>
            <div
              className={[
                'h-2.5 w-2.5 rounded-full transition-colors',
                active ? 'bg-blue-600' : 'bg-slate-300',
              ].join(' ')}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

interface ProfileSelectionModalProps {
  /** Whether to show the modal */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Force show even if profile already selected */
  forceShow?: boolean;
}

/**
 * ProfileSelectionModal - Non-blocking profile selection
 * - Only shows on dashboard after authentication
 * - Never blocks account access
 * - Gracefully handles errors
 */
export default function ProfileSelectionModal({
  open,
  onClose,
  forceShow = false,
}: ProfileSelectionModalProps) {
  const { account } = useAuthStore();
  const { currentProfile, profiles, loadProfilesAndSetDefault, setCurrentProfile } = useProfileStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  // Load profiles when modal opens
  useEffect(() => {
    if (open && account?.id) {
      loadProfilesSafely();
    }
  }, [open, account?.id]);

  // Set initial selection when profiles load
  useEffect(() => {
    if (profiles.length > 0 && !pickedId) {
      setPickedId(currentProfile?.id || profiles[0].id);
    }
  }, [profiles, currentProfile, pickedId]);

  async function loadProfilesSafely() {
    if (!account?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      await loadProfilesAndSetDefault(account.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profiles';
      setError(message);
      toast.error('Profile loading failed: ' + message);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (pickedId) {
      const profile = profiles.find((p) => p.id === pickedId);
      if (profile) {
        setCurrentProfile(profile);
        toast.success(`Switched to ${profile.displayName}`);
      }
    }
    onClose();
  }

  function handleSkip() {
    onClose();
  }

  function handleAddProfileSuccess() {
    setAddOpen(false);
    // Reload profiles after adding new one
    if (account?.id) {
      loadProfilesSafely();
    }
  }

  // Don't show if no account
  if (!account?.id) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Team Member Profile</DialogTitle>
            <DialogDescription>
              {currentProfile
                ? 'Switch to a different team member profile, or continue with current selection.'
                : 'Choose which team member is using the system. This is optional - you can always select a profile later.'}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center">
              <div className="text-sm text-slate-600">Loading profiles...</div>
            </div>
          ) : error ? (
            <div className="py-4">
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <div className="text-sm text-red-800">
                  Error loading profiles:
                </div>
                <div className="mt-1 text-xs text-red-600">{error}</div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                You can continue using the application without selecting a
                profile.
              </div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-6 text-center">
              <div className="mb-3 text-sm text-slate-600">
                No team member profiles found.
              </div>
              <div className="text-xs text-slate-500">
                You can create profiles later in Account Settings if needed.
              </div>
            </div>
          ) : (
            <ProfileList
              profiles={profiles}
              selectedId={pickedId}
              onSelect={setPickedId}
            />
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {profiles.length === 0 && !error && (
                <Button variant="outline" onClick={() => setAddOpen(true)}>
                  Add Profile
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkip}>
                {currentProfile ? 'Keep Current' : 'Skip'}
              </Button>
              {profiles.length > 0 && (
                <Button onClick={handleConfirm} disabled={!pickedId}>
                  {currentProfile ? 'Switch Profile' : 'Select Profile'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Profile modal */}
      <AddProfileModalSupabase
        open={addOpen}
        onOpenChange={setAddOpen}
        onProfileCreated={handleAddProfileSuccess}
      />
    </>
  );
}

// Utility hook for dashboard to manage profile selection
export function useProfileSelection() {
  const { currentProfile, profiles } = useProfileStore();
  const [showModal, setShowModal] = useState(false);

  // Auto-show modal on dashboard if no profile selected and profiles exist
  const shouldShowModal = !currentProfile && profiles.length > 0;

  useEffect(() => {
    if (shouldShowModal) {
      // Small delay to let dashboard render first
      const timer = setTimeout(() => setShowModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowModal]);

  return {
    showModal,
    setShowModal,
    currentProfile,
    profileCount: profiles.length,
  };
}