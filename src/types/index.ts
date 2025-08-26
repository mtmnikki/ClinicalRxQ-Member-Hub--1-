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

export type RoleType = 'Pharmacist-PIC' | 'Pharmacist' | 'Pharmacy Technician' | 'Intern' | 'Pharmacy'

export interface MemberProfile {
  id: string
  memberAccountId: string             // db: member_account_id
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
    pharmacyName: row.pharmacy_name ?? null,
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
    memberAccountId: row.member_account_id,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    role: row.role,
    email: row.profile_email ?? null,
    phone: row.phone_number ?? null,
    dobMonth: row.dob_month ?? null,
    dobDay: row.dob_day ?? null,
    dobYear: row.dob_year ?? null,
    licenseNumber: row.license_number ?? null,
    nabpeprofileId: row.nabp_eprofile_id ?? null,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  }
}
export type PharmacyProfile = MemberProfile;

/**
 * Remaining domain types (unchanged)
 */

export interface Program {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  modules: Module[];
  resources: Resource[];
  thumbnail: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  content: string;
  duration: string;
  order: number;
  completed?: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'document' | 'link';
  url: string;
  description: string;
  category: string;
}
