import { create } from 'zustand'
import { supabase } from '@/services/supabase'
import type { MemberProfile } from '@/types'
import { mapRowToProfile } from '@/types'

const KEY = 'crxq.currentProfile'

function loadSavedProfile(): MemberProfile | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as MemberProfile) : null
  } catch {
    return null
  }
}
function saveProfile(p: MemberProfile | null) {
  try {
    if (p) sessionStorage.setItem(KEY, JSON.stringify(p))
    else sessionStorage.removeItem(KEY)
  } catch { /* ignore */ }
}

type ProfileState = {
  currentProfile: MemberProfile | null
  profiles: MemberProfile[]
  loadProfiles: (accountId: string) => Promise<void>
  setCurrentProfile: (p: MemberProfile | null) => void
  addProfile: (p: Omit<MemberProfile, 'id'|'createdAt'|'updatedAt'>) => Promise<MemberProfile>
  refreshCurrentProfile: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  currentProfile: loadSavedProfile(),
  profiles: [],

  async loadProfiles(accountId) {
    const { data, error } = await supabase
      .from('member_profiles')
      .select('id,account_id,full_name,role,email,phone,is_active,created_at,updated_at')
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })

    if (error) throw error
    const profiles = (data ?? []).map(mapRowToProfile)
    set({ profiles })
  },

  setCurrentProfile(p) {
    set({ currentProfile: p })
    saveProfile(p)
  },

  async addProfile(p) {
    const payload = {
      account_id: p.accountId,
      full_name: p.fullName,
      role: p.role,
      email: p.email ?? null,
      phone: p.phone ?? null,
      is_active: p.isActive ?? true,
    }
    const { data, error } = await supabase
      .from('member_profiles')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    const created = mapRowToProfile(data)
    set({ profiles: [...get().profiles, created] })
    return created
  },

  async refreshCurrentProfile() {
    const p = get().currentProfile
    if (!p) return
    const { data, error } = await supabase
      .from('member_profiles')
      .select('id,account_id,full_name,role,email,phone,is_active,created_at,updated_at')
      .eq('id', p.id)
      .single()
    if (error) throw error
    const updated = mapRowToProfile(data)
    set({ currentProfile: updated })
    saveProfile(updated)
  },
}))
