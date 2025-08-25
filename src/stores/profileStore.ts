/**
 * Profile Store (Supabase version)
 * - Manages the current selected member profile for the authenticated account
 * - Stores profile selection in sessionStorage for the current session
 * - All user activity tracking is done at the profile level
 */

import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import type { MemberProfile } from '@/types';

interface ProfileState {
  currentProfile: MemberProfile | null;
  profiles: MemberProfile[];
  loading: boolean;
  
  // Actions
  setCurrentProfile: (profile: MemberProfile) => void;
  loadProfiles: (accountId: string) => Promise<void>;
  clearProfile: () => void;
  refreshCurrentProfile: () => Promise<void>;
}

// Session storage key for current profile
const CURRENT_PROFILE_KEY = 'crxq_current_profile';

// Helper to save current profile to sessionStorage
function saveCurrentProfile(profile: MemberProfile | null) {
  try {
    if (profile) {
      sessionStorage.setItem(CURRENT_PROFILE_KEY, JSON.stringify(profile));
    } else {
      sessionStorage.removeItem(CURRENT_PROFILE_KEY);
    }
  } catch (error) {
    console.warn('Failed to save current profile to sessionStorage:', error);
  }
}

// Helper to load current profile from sessionStorage
function loadCurrentProfile(): MemberProfile | null {
  try {
    const stored = sessionStorage.getItem(CURRENT_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load current profile from sessionStorage:', error);
    return null;
  }
}

// Map database row to MemberProfile type
function mapRowToProfile(row: any): MemberProfile {
  return {
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
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  currentProfile: loadCurrentProfile(),
  profiles: [],
  loading: false,

  setCurrentProfile: (profile: MemberProfile) => {
    saveCurrentProfile(profile);
    set({ currentProfile: profile });
  },

  loadProfiles: async (accountId: string) => {
    try {
      set({ loading: true });
      
      const { data, error } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('member_account_id', accountId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const profiles = (data || []).map(mapRowToProfile);
      set({ profiles });

      return profiles;
    } catch (error) {
      console.error('Failed to load profiles:', error);
      set({ profiles: [] });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearProfile: () => {
    saveCurrentProfile(null);
    set({ currentProfile: null, profiles: [] });
  },

  refreshCurrentProfile: async () => {
    const { currentProfile } = get();
    if (!currentProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('id', currentProfile.id)
        .single();

      if (error) throw error;

      const updatedProfile = mapRowToProfile(data);
      set({ currentProfile: updatedProfile });
      saveCurrentProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to refresh current profile:', error);
    }
  },
}));