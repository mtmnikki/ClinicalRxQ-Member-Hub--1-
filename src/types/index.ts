/**
 * Type definitions for ClinicalRxQ application
 * - Authenticated entity is an Account (public.accounts)
 * - Profiles belong to accounts (member_profiles)
 * - Removes legacy User/Subscription concepts; aligns with Supabase schema
 */

export interface Account {
  /** Primary key from public.accounts */
  id: string;
  /** Login identity */
  email: string;
  /** Pharmacy display name */
  pharmacyName: string; // maps to pharmacy_name
  /** Pharmacy phone number */
  pharmacyPhone?: string | null; // pharmacy_phone
  /** Subscription status for access gating */
  subscriptionStatus: 'active' | 'inactive';
  /** Timestamps */
  createdAt: string; // ISO string
  updatedAt?: string | null; // ISO string
  /** Address metadata */
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: number | null;
}

/**
 * Role that a pharmacy profile can assume.
 * - Mirrors member_profiles.role_type with camelCase mapping
 */
export type RoleType = 'Pharmacist-PIC' | 'Pharmacist-Staff' | 'Pharmacy Technician';

/**
 * Member profile associated with an account (member_profiles table)
 * - Only required: roleType, firstName, lastName
 */
export interface MemberProfile {
  id: string;
  /** FK to accounts.id (member_profiles.member_account_id) */
  accountId: string;
  roleType: RoleType;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileEmail?: string;
  dobMonth?: string; // MM
  dobDay?: string; // DD
  dobYear?: string; // YYYY
  licenseNumber?: string;
  nabpEprofileId?: string;
  isActive?: boolean;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

/**
 * Temporary compatibility alias used by existing components.
 * - Prefer MemberProfile elsewhere.
 */
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