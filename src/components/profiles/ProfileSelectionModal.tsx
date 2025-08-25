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
import { supabase } from '@/services/supabase';
import type { MemberProfile } from '@/types';
import AddProfileModal from './AddProfileModalSupabase';
import { UserCircle } from 'lucide-react';

interface ProfileSelectionModalProps {
  open: boolean;
  onProfileSelected: (profile: MemberProfile) => void;
}

export default function ProfileSelectionModal({ open, onProfileSelected }: ProfileSelectionModalProps) {
  const { account } = useAuthStore();
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddProfile, setShowAddProfile] = useState(false);

  // Fetch profiles from Supabase
  useEffect(() => {
    if (!account?.id || !open) return;

    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('member_profiles')
          .select('*')
          .eq('member_account_id', account.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const mappedProfiles: MemberProfile[] = (data || []).map(row => ({
          id: row.id,
          accountId: row.member_account_id,
          roleType: row.role_type,
          firstName: row.first_name,
          lastName: row.last_name,
          phoneNumber: row.phone_number,
          profileEmail: row.profile_email,
          dobMonth: row.dob_month,
          dobDay: row.dob_day,
          dobYear: row.dob_year,
          licenseNumber: row.license_number,
          nabpEprofileId: row.nabp_eprofile_id,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        setProfiles(mappedProfiles);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [account?.id, open]);

  const handleSelectProfile = () => {
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (profile) {
      onProfileSelected(profile);
    }
  };

  const handleProfileCreated = async () => {
    // Refresh profiles after creation
    if (account?.id) {
      const { data } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('member_account_id', account.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const newProfile: MemberProfile = {
          id: data.id,
          accountId: data.member_account_id,
          roleType: data.role_type,
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: data.phone_number,
          profileEmail: data.profile_email,
          dobMonth: data.dob_month,
          dobDay: data.dob_day,
          dobYear: data.dob_year,
          licenseNumber: data.license_number,
          nabpEprofileId: data.nabp_eprofile_id,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        
        setShowAddProfile(false);
        onProfileSelected(newProfile);
      }
    }
  };

  if (showAddProfile) {
    return (
      <AddProfileModal
        open={showAddProfile}
        onClose={() => setShowAddProfile(false)}
        onSuccess={handleProfileCreated}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : profiles.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Profile</label>
                  <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.firstName} {profile.lastName} - {profile.roleType}
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
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
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