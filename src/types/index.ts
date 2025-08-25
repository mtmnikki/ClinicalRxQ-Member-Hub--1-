// src/types/index.ts

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
 * - Mirrors member_profiles.role enum
 */
export type RoleType =
  | 'Pharmacist'
  | 'Pharmacist-PIC'
  | 'Pharmacy Technician'
  | 'Intern'
  | 'Pharmacy'
  | null;

/**
 * Member profile associated with an account (member_profiles table)
 */
export interface MemberProfile {
  id: string;
  /** FK to accounts.id (member_profiles.member_account_id) */
  accountId: string;
  role: RoleType;
  firstName: string;
  lastName: string | null;
  phoneNumber?: string;
  profileEmail?: string;
  dobMonth?: number;
  dobDay?: number;
  dobYear?: number;
  licenseNumber?: string;
  nabpEprofileId?: string;
  isActive?: boolean;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  displayName: string;
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