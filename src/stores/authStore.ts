/**
 * Authentication state management store using Zustand.
 * - Manages the account session and account data from Supabase Auth.
 * - Fetches and stores the corresponding account profile from the public.accounts table.
 * - Exposes actions for login, logout, and checking the session on startup.
 */
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { Account } from '@/types';
import { useProfileStore } from './profileStore';

// --- State and Actions Interface ---
interface AuthState {
  session: Session | null;
  user: User | null;
  account: Account | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // To track if the initial session check is complete
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  updateAccount: (updates: Partial<Account>) => Promise<Account | null>;
}

/**
 * Maps a database row (snake_case) to the Account UI type (camelCase).
 */
function mapRowToAccount(row: any): Account {
  return {
    id: row.id,
    email: row.email,
    pharmacyName: row.pharmacy_name,
    pharmacyPhone: row.pharmacy_phone ?? null,
    subscriptionStatus: (row.subscription_status || 'inactive') as
      | 'active'
      | 'inactive',
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    address1: row.address1 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zipcode: row.zipcode ?? null,
  };
}

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set) => {
  // Set up the listener outside the main return object
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const { data: accountRow } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (accountRow) {
        set({
          session,
          user: session.user,
          account: mapRowToAccount(accountRow),
          isAuthenticated: true,
          isInitialized: true,
        });
        await useProfileStore.getState().loadProfilesAndSetDefault(session.user.id);
      } else {
        // If no account row is found, the session is invalid, so sign out.
        await supabase.auth.signOut();
      }
    } else {
      set({
        session: null,
        user: null,
        account: null,
        isAuthenticated: false,
        isInitialized: true,
      });
      useProfileStore.getState().clearProfile();
    }
  });

  return {
    session: null,
    user: null,
    account: null,
    isAuthenticated: false,
    isInitialized: false,

    checkSession: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // If there's no session, we can immediately mark initialization as complete.
      // If there is a session, the onAuthStateChange listener will handle setting the state.
      if (!session) {
        set({ isInitialized: true });
      }
    },

    login: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    updateAccount: async (updates) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const updatePayload: any = {};
      if (updates.email !== undefined) updatePayload.email = updates.email;
      if (updates.pharmacyName !== undefined)
        updatePayload.pharmacy_name = updates.pharmacyName;
      if (updates.pharmacyPhone !== undefined)
        updatePayload.pharmacy_phone = updates.pharmacyPhone;
      if (updates.address1 !== undefined)
        updatePayload.address1 = updates.address1;
      if (updates.city !== undefined) updatePayload.city = updates.city;
      if (updates.state !== undefined) updatePayload.state = updates.state;
      if (updates.zipcode !== undefined)
        updatePayload.zipcode = updates.zipcode;

      const { data, error } = await supabase
        .from('accounts')
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedAccount = data ? mapRowToAccount(data) : null;
      set({ account: updatedAccount });
      return updatedAccount;
    },
  };
});
