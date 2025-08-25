// src/types/index.ts

export type SubscriptionStatus = 'active' | 'inactive'

export interface Account {
  id: string
  email: string
  pharmacyName: string          // db: pharmacy_name
  pharmacyPhone?: string | null // db: pharmacy_phone
  subscriptionStatus: SubscriptionStatus // db: subscription_status
  createdAt: string             // db: created_at
  updatedAt?: string | null     // db: updated_at
  address1?: string | null
  city?: string | null
  state?: string | null
  zipcode?: string | null       // store ZIPs as string (keeps leading zeros)
}

export type RoleType = 'Pharmacist' | 'Technician' | 'Owner' | 'Manager'

export interface MemberProfile {
  id: string
  accountId: string             // db: account_id
  fullName: string              // db: full_name
  role: RoleType
  email?: string | null
  phone?: string | null
  isActive: boolean             // db: is_active
  createdAt: string             // db: created_at
  updatedAt?: string | null     // db: updated_at
}

// DB → app mappers (snake_case → camelCase)
export function mapRowToAccount(row: any): Account {
  return {
    id: row.id,
    email: row.email,
    pharmacyName: row.pharmacy_name,
    pharmacyPhone: row.pharmacy_phone ?? null,
    subscriptionStatus: (row.subscription_status ?? 'inactive') as SubscriptionStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    address1: row.address1 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zipcode: row.zipcode ?? null,
  }
}

export function mapRowToProfile(row: any): MemberProfile {
  return {
    id: row.id,
    accountId: row.account_id,
    fullName: row.full_name,
    role: row.role,
    email: row.email ?? null,
    phone: row.phone ?? null,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  }
}
