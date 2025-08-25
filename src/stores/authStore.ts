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
  user: User | null; // Supabase refers to the auth entity as 'user'
  account: Account | null; // Your application's term for the authenticated entity
  isAuthenticated: boolean;
  isInitialized: boolean; // To track if the initial session check is complete

  // Actions
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
  // Set up the listener outside the return object
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
        // If no account row is found, treat as logged out
        await supabase.auth.signOut(); // Clean up Supabase session
        set({
          session: null,
          user: null,
          account: null,
          isAuthenticated: false,
          isInitialized: true,
        });
        useProfileStore.getState().clearProfile();
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
    // --- Initial State ---
    session: null,
    user: null,
    account: null,
    isAuthenticated: false,
    isInitialized: false,

    // --- Actions ---

    /**
     * Checks for an active session on app startup.
     * The onAuthStateChange listener will handle the state update.
     */
    checkSession: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ isInitialized: true }); // Ensure initialization is marked complete if no session
      }
    },

    /**
     * Signs in an account with email and password.
     */
    login: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },

    /**
     * Signs out the current account and clears the state.
     */
    logout: async () => {
      await supabase.auth.signOut();
    },

    /**
     * Updates the current account information.
     */
    updateAccount: async (updates: Partial<Account>) => {
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