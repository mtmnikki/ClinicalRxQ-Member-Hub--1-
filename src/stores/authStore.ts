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

// --- State and Actions Interface ---
interface AuthState {
  session: Session | null;
  user: User | null; // Supabase refers to the auth entity as 'user'
  account: Account | null; // Your application's term for the authenticated entity
  isAuthenticated: boolean;

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
    subscriptionStatus: (row.subscription_status || 'inactive') as 'active' | 'inactive',
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    address1: row.address1 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zipcode: row.zipcode ?? null,
  };
}

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>((set) => ({
  // --- Initial State ---
  session: null,
  user: null,
  account: null,
  isAuthenticated: false,

  // --- Actions ---

  /**
   * Checks for an active session on app startup and hydrates the store.
   */
  checkSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: accountRow } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', session.user.id)
        .single();

      set({
        session,
        user: session.user,
        account: accountRow ? mapRowToAccount(accountRow) : null,
        isAuthenticated: true,
      });
    }
  },

  /**
   * Signs in an account with email and password.
   */
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      const { data: accountRow } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      set({
        session: data.session,
        user: data.user,
        account: accountRow ? mapRowToAccount(accountRow) : null,
        isAuthenticated: true,
      });
    }
  },

  /**
   * Signs out the current account and clears the state.
   */
  logout: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      account: null,
      isAuthenticated: false,
    });
  },

  /**
   * Updates the current account information.
   */
  updateAccount: async (updates) => {
    const currentUser = supabase.auth.getUser();
    const userId = (await currentUser).data.user?.id;
    
    if (!userId) {
      throw new Error('No authenticated user');
    }

    // Prepare the update payload with snake_case fields
    const updatePayload: any = {};
    if (updates.email !== undefined) updatePayload.email = updates.email;
    if (updates.pharmacyName !== undefined) updatePayload.pharmacy_name = updates.pharmacyName;
    if (updates.pharmacyPhone !== undefined) updatePayload.pharmacy_phone = updates.pharmacyPhone;
    if (updates.address1 !== undefined) updatePayload.address1 = updates.address1;
    if (updates.city !== undefined) updatePayload.city = updates.city;
    if (updates.state !== undefined) updatePayload.state = updates.state;
    if (updates.zipcode !== undefined) updatePayload.zipcode = updates.zipcode;

    const { data, error } = await supabase
      .from('accounts')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    const updatedAccount = data ? mapRowToAccount(data) : null;
    set({ account: updatedAccount });
    return updatedAccount;
  },
}));
