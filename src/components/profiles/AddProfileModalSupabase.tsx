/**
 * AddProfileModal (Supabase version)
 * - Creates or edits a MemberProfile in Supabase
 * - Required fields: roleType, firstName, lastName
 * - Optional fields validated lightly if provided
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '@/services/supabase';
import type { RoleType } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

/** Roles dropdown */
const ROLE_OPTIONS: RoleType[] = ['Pharmacist-PIC', 'Pharmacist-Staff', 'Pharmacy Technician'];

/** Zod schema */
const schema = z.object({
  roleType: z.enum(['Pharmacist-PIC', 'Pharmacist-Staff', 'Pharmacy Technician'], {
    required_error: 'Role is required',
  }),
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  phoneNumber: z.string().optional().refine((v) => !v || /^[0-9+()\-\s]{7,}$/.test(v), { message: 'Invalid phone number' }),
  profileEmail: z.string().optional().refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: 'Invalid email' }),
  dobMonth: z.string().optional().refine((v) => !v || /^(0[1-9]|1[0-2])$/.test(v), { message: 'Use two digits (01-12)' }),
  dobDay: z.string().optional().refine((v) => !v || /^(0[1-9]|[12][0-9]|3[01])$/.test(v), { message: 'Use two digits (01-31)' }),
  dobYear: z.string().optional().refine((v) => !v || /^(19|20)\d{2}$/.test(v), { message: 'Use four digits (YYYY)' }),
  licenseNumber: z.string().optional(),
  nabpEprofileId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  profileId?: string;
  defaultValues?: Partial<FormValues>;
}

export default function AddProfileModal({ 
  open, 
  onClose, 
  onSuccess,
  profileId,
  defaultValues 
}: AddProfileModalProps) {
  const { account } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      roleType: undefined,
      firstName: '',
      lastName: '',
      phoneNumber: '',
      profileEmail: '',
      dobMonth: '',
      dobDay: '',
      dobYear: '',
      licenseNumber: '',
      nabpEprofileId: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!account?.id) {
      toast.error('No authenticated account found');
      return;
    }

    try {
      const profileData = {
        member_account_id: account.id,
        role_type: data.roleType,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber || null,
        profile_email: data.profileEmail || null,
        dob_month: data.dobMonth || null,
        dob_day: data.dobDay || null,
        dob_year: data.dobYear || null,
        license_number: data.licenseNumber || null,
        nabp_eprofile_id: data.nabpEprofileId || null,
        is_active: true,
      };

      if (profileId) {
        // Update existing profile
        const { error } = await supabase
          .from('member_profiles')
          .update(profileData)
          .eq('id', profileId)
          .eq('member_account_id', account.id);

        if (error) throw error;
        toast.success('Profile updated successfully');
      } else {
        // Create new profile
        const { error } = await supabase
          .from('member_profiles')
          .insert(profileData);

        if (error) throw error;
        toast.success('Profile created successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    }
  };

  const watchedRole = watch('roleType');

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{profileId ? 'Edit' : 'Add'} Team Member Profile</DialogTitle>
            <DialogDescription>
              {profileId ? 'Update the team member information below.' : 'Create a new profile for a team member.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Role Type */}
            <div>
              <Label htmlFor="roleType">Role *</Label>
              <Select
                value={watchedRole}
                onValueChange={(value: RoleType) => setValue('roleType', value)}
              >
                <SelectTrigger id="roleType" className={errors.roleType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleType && (
                <p className="text-sm text-red-500 mt-1">{errors.roleType.message}</p>
              )}
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Contact fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phoneNumber')}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="profileEmail">Email</Label>
                <Input
                  id="profileEmail"
                  type="email"
                  placeholder="john.doe@pharmacy.com"
                  {...register('profileEmail')}
                  className={errors.profileEmail ? 'border-red-500' : ''}
                />
                {errors.profileEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.profileEmail.message}</p>
                )}
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <Label>Date of Birth</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Input
                    placeholder="MM"
                    maxLength={2}
                    {...register('dobMonth')}
                    className={errors.dobMonth ? 'border-red-500' : ''}
                  />
                  {errors.dobMonth && (
                    <p className="text-xs text-red-500 mt-1">{errors.dobMonth.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="DD"
                    maxLength={2}
                    {...register('dobDay')}
                    className={errors.dobDay ? 'border-red-500' : ''}
                  />
                  {errors.dobDay && (
                    <p className="text-xs text-red-500 mt-1">{errors.dobDay.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="YYYY"
                    maxLength={4}
                    {...register('dobYear')}
                    className={errors.dobYear ? 'border-red-500' : ''}
                  />
                  {errors.dobYear && (
                    <p className="text-xs text-red-500 mt-1">{errors.dobYear.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* License fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  {...register('licenseNumber')}
                />
              </div>
              <div>
                <Label htmlFor="nabpEprofileId">NABP e-Profile ID</Label>
                <Input
                  id="nabpEprofileId"
                  {...register('nabpEprofileId')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : profileId ? 'Update' : 'Create'} Profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}