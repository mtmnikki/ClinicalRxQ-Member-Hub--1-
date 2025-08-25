/**
 * ProfileGate
 * - Purpose: Previously used to enforce profile selection after auth.
 * - Updated: No longer blocks pages; kept as a utility that can be mounted where needed.
 * - Behavior: Loads profiles for the current account (localStorage-backed) but does not gate routes.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProfilesStore } from '../../stores/profilesStore';
import type { MemberProfile } from '../../types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import AddProfileModal from '../profiles/AddProfileModal';

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
              'flex w-full items-center justify-between px-3 py-2 text-left',
              active ? 'bg-blue-50' : 'hover:bg-slate-50',
            ].join(' ')}
            onClick={() => onSelect(p.id)}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-900">
                {p.firstName} {p.lastName}
              </div>
              <div className="text-xs text-slate-500">{p.roleType}</div>
            </div>
            <div
              className={[
                'h-2.5 w-2.5 rounded-full',
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

/**
 * ProfileGate component (non-blocking informational modal)
 * - You may choose to mount this on /account only, or trigger manually.
 */
export default function ProfileGate() {
  const { account, isAuthenticated } = useAuthStore();
  const {
    ensureLoaded,
    profiles,
    currentProfileId,
    setCurrentProfile,
    reset,
  } = useProfilesStore();

  const [selectOpen, setSelectOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && account?.id) {
      ensureLoaded(account.id);
    } else {
      reset();
    }
  }, [isAuthenticated, account?.id, ensureLoaded, reset]);

  // Non-blocking: only suggest selection if none exists (but do not auto-open)
  useEffect(() => {
    if (!isAuthenticated || !account?.id) {
      setSelectOpen(false);
      setAddOpen(false);
      return;
    }
    if (!currentProfileId && profiles.length > 0) {
      setPickedId(profiles[0].id);
      // keep closed; can be opened by user action if you wire a button to setSelectOpen(true)
    }
  }, [isAuthenticated, account?.id, currentProfileId, profiles]);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === pickedId) || null,
    [profiles, pickedId]
  );

  function handleConfirm() {
    if (pickedId) setCurrentProfile(pickedId);
    setSelectOpen(false);
  }

  return (
    <>
      {/* Optional selection dialog (not auto-opened) */}
      <Dialog open={selectOpen} onOpenChange={(open) => setSelectOpen(open)}>
        <DialogContent className="sm:max-w-md" hideClose>
          <DialogHeader>
            <DialogTitle>Select a profile</DialogTitle>
            <DialogDescription>
              Choose who is currently using the account. You can switch profiles later in Account Settings.
            </DialogDescription>
          </DialogHeader>

          <ProfileList profiles={profiles} selectedId={pickedId} onSelect={setPickedId} />

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              Add Profile
            </Button>
            <Button onClick={handleConfirm} disabled={!pickedId}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Profile modal */}
      <AddProfileModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(createdId) => {
          if (!currentProfileId) {
            setPickedId(createdId);
            setSelectOpen(true);
          }
        }}
      />
    </>
  );
}
