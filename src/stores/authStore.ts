import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import type { Account, SubscriptionStatus } from '@/types'
import { mapRowToAccount } from '@/types'

type AuthState = {
  isInitialized: boolean
  session: Session | null
  user: User | null
  account: Account | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  updateAccount: (patch: Partial<Account>) => Promise<Account | null>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isInitialized: false,
  session: null,
  user: null,
  account: null,

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ session: data.session ?? null, user: data.user ?? null })
    await get().checkSession()
  },

  async logout() {
    await supabase.auth.signOut()
    set({ session: null, user: null, account: null })
  },

  async checkSession() {
    try {
      // 1) read auth session
      const { data: sess } = await supabase.auth.getSession()
      set({ session: sess.session ?? null, user: sess.session?.user ?? null })

      // 2) fetch account row → camelCase
      const user = sess.session?.user
      if (!user) {
        set({ account: null, isInitialized: true })
        return
      }
      const { data, error } = await supabase
        .from('accounts')
        .select('id,email,pharmacy_name,pharmacy_phone,subscription_status,created_at,updated_at,address1,city,state,zipcode')
        .eq('id', user.id)
        .single()

      if (error) throw error
      const account = mapRowToAccount(data)
      set({ account, isInitialized: true })
    } catch (e) {
      console.error('[checkSession]', e)
      set({ isInitialized: true })
    }
  },

  async updateAccount(patch) {
    const user = get().user
    if (!user) return null

    const payload = {
      pharmacy_name: patch.pharmacyName,
      pharmacy_phone: patch.pharmacyPhone ?? null,
      subscription_status: (patch.subscriptionStatus as SubscriptionStatus) ?? undefined,
      address1: patch.address1 ?? null,
      city: patch.city ?? null,
      state: patch.state ?? null,
      zipcode: patch.zipcode ?? null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    const account = mapRowToAccount(data)
    set({ account })
    return account
  },
}))
