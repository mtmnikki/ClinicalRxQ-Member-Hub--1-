/**
 * ProfileSelectionModal
 * - Displays when user logs in and needs to select or create a profile
 * - Shows existing profiles in a dropdown if any exist
 * - Otherwise shows only "Create New Profile" button
 */

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { useAuthStore } from '@/stores/authStore';
import type { MemberProfile } from '@/types';
import AddProfileModalSupabase from './AddProfileModalSupabase';
import { UserCircle } from 'lucide-react';
import { useProfileStore } from '@/stores/profileStore';

interface ProfileSelectionModalProps {
  open: boolean;
  onProfileSelected: (profile: MemberProfile) => void;
}

export default function ProfileSelectionModal({ open, onProfileSelected }: ProfileSelectionModalProps) {
  const account = useAuthStore((state) => state.account);
  const { profiles, loadProfilesAndSetDefault } = useProfileStore();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddProfile, setShowAddProfile] = useState(false);

  // Fetch profiles from Supabase
  useEffect(() => {
    if (!account?.id || !open) return;

    const fetchProfiles = async () => {
      try {
        setLoading(true);
        await loadProfilesAndSetDefault(account.id);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [account?.id, open, loadProfilesAndSetDefault]);

  const handleSelectProfile = () => {
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (profile) {
      onProfileSelected(profile);
    }
  };

  const handleProfileCreated = async () => {
    // Refresh profiles after creation
    if (account?.id) {
      await loadProfilesAndSetDefault(account.id);
      const newProfile = useProfileStore.getState().profiles.slice(-1)[0];
      if (newProfile) {
        setShowAddProfile(false);
        onProfileSelected(newProfile);
      }
    }
  };

  if (showAddProfile) {
    return (
      <AddProfileModalSupabase
        open={showAddProfile}
        onOpenChange={setShowAddProfile}
        onProfileCreated={handleProfileCreated}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Select Your Profile
          </DialogTitle>
          <DialogDescription>
            {loading ? (
              'Loading profiles...'
            ) : profiles.length > 0 ? (
              'Select an existing profile or create a new one to continue.'
            ) : (
              'You need to create a profile to access the member portal.'
            )}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : profiles.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Select Profile</label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.displayName} - {profile.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSelectProfile}
                    disabled={!selectedProfileId}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddProfile(true)}
                  >
                    Create New Profile
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  No profiles found for your account.
                </p>
                <Button onClick={() => setShowAddProfile(true)} className="w-full">
                  Create New Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}