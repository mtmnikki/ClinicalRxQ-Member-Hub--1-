/**
 * AuthContext
 * - Purpose: Provide the authenticated Account and a minimal display adapter.
 * - Aligns with Supabase: only accounts are authenticated; profiles are separate.
 */

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { Account } from '../../types';

/**
 * Minimal display adapter used by some UI components.
 */
export interface MemberView {
  pharmacyName?: string;
  subscriptionStatus?: 'active' | 'inactive';
  email?: string;
  lastLoginISO?: string; // using account.createdAt as placeholder for demo
}

/**
 * Context value shape for auth.
 */
interface AuthContextValue {
  account: Account | null;
  member: MemberView | null; // derived, for convenience in existing UI
}

/**
 * Internal React context.
 */
const AuthContext = createContext<AuthContextValue>({ account: null, member: null });

/**
 * AuthProvider
 * - Supplies the current account and a derived MemberView.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { account, isAuthenticated, checkSession } = useAuthStore();

  // Initialize session on first mount (restores user on refresh)
  useEffect(() => {
    checkSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const member = useMemo<MemberView | null>(() => {
    if (!isAuthenticated || !account) return null;
    return {
      pharmacyName: account.pharmacyName,
      subscriptionStatus: account.subscriptionStatus,
      email: account.email,
      lastLoginISO: account.createdAt,
    };
  }, [isAuthenticated, account]);

  return <AuthContext.Provider value={{ account: account ?? null, member }}>{children}</AuthContext.Provider>;
}

/**
 * Hook: useAuth
 * - Return current auth context value.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
