/**
 * AddProfileModal (Supabase version)
 * - Creates or edits a MemberProfile in Supabase
 * - Required fields: role, firstName
 * - Optional fields validated lightly if provided
 */

import React, { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';

/** Roles dropdown - excluding null and Pharmacy */
const ROLE_OPTIONS: Exclude<RoleType, null | 'Pharmacy'>[] = [
  'Pharmacist-PIC',
  'Pharmacist',
  'Pharmacy Technician',
  'Intern',
];

/** Zod schema */
const schema = z.object({
  role: z.enum(
    ['Pharmacist-PIC', 'Pharmacist', 'Pharmacy Technician', 'Intern', 'Pharmacy'],
    {
      required_error: 'Role is required',
    }
  ),
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9+()\-\s]{7,}$/.test(v), {
      message: 'Invalid phone number',
    }),
  profileEmail: z
    .string()
    .optional()
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), {
      message: 'Invalid email',
    }),
  dobMonth: z
    .string()
    .optional()
    .refine((v) => !v || /^(0[1-9]|1[0-2])$/.test(v), {
      message: 'Use two digits (01-12)',
    }),
  dobDay: z
    .string()
    .optional()
    .refine((v) => !v || /^(0[1-9]|[12][0-9]|3[01])$/.test(v), {
      message: 'Use two digits (01-31)',
    }),
  dobYear: z
    .string()
    .optional()
    .refine((v) => !v || /^(19|20)\d{2}$/.test(v), {
      message: 'Use four digits (YYYY)',
    }),
  licenseNumber: z.string().optional(),
  nabpEprofileId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileCreated?: () => void;
  profileToEdit?: Partial<FormValues> & { id: string };
}

export default function AddProfileModal({
  open,
  onOpenChange,
  onProfileCreated,
  profileToEdit,
}: AddProfileModalProps) {
  const account = useAuthStore((state) => state.account);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: profileToEdit || {
      role: undefined,
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

  useEffect(() => {
    if (profileToEdit) {
      reset(profileToEdit);
    } else {
      reset({
        role: undefined,
        firstName: '',
        lastName: '',
        phoneNumber: '',
        profileEmail: '',
        dobMonth: '',
        dobDay: '',
        dobYear: '',
        licenseNumber: '',
        nabpEprofileId: '',
      });
    }
  }, [profileToEdit, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!account?.id) {
      toast.error('No authenticated account found');
      return;
    }

    try {
      const profileData = {
        member_account_id: account.id,
        role: data.role,
        first_name: data.firstName,
        last_name: data.lastName || null,
        phone_number: data.phoneNumber || null,
        profile_email: data.profileEmail || null,
        dob_month: data.dobMonth || null,
        dob_day: data.dobDay || null,
        dob_year: data.dobYear || null,
        license_number: data.licenseNumber || null,
        nabp_eprofile_id: data.nabpEprofileId || null,
        is_active: true,
      };

      if (profileToEdit) {
        const { error } = await supabase
          .from('member_profiles')
          .update(profileData)
          .eq('id', profileToEdit.id)
          .eq('member_account_id', account.id);

        if (error) throw error;
        toast.success('Profile updated successfully');
      } else {
        const { error } = await supabase
          .from('member_profiles')
          .insert(profileData);

        if (error) throw error;
        toast.success('Profile created successfully');
      }

      onProfileCreated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save profile'
      );
    }
  };

  const watchedRole = watch('role');
  const isEditing = !!profileToEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit' : 'Add'} Team Member Profile
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the team member information below.'
                : 'Create a new profile for a team member.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select
                value={watchedRole}
                onValueChange={(value) => setValue('role', value as Exclude<RoleType, null>)}
                disabled={isEditing && watchedRole === 'Pharmacy'}
              >
                <SelectTrigger
                  id="role"
                  className={errors.role ? 'border-red-500' : ''}
                >
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
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

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
                  <p className="mt-1 text-sm text-red-500">
                    {errors.phoneNumber.message}
                  </p>
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
                  <p className="mt-1 text-sm text-red-500">
                    {errors.profileEmail.message}
                  </p>
                )}
              </div>
            </div>

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
                    <p className="mt-1 text-xs text-red-500">
                      {errors.dobMonth.message}
                    </p>
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
                    <p className="mt-1 text-xs text-red-500">
                      {errors.dobDay.message}
                    </p>
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
                    <p className="mt-1 text-xs text-red-500">
                      {errors.dobYear.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input id="licenseNumber" {...register('licenseNumber')} />
              </div>
              <div>
                <Label htmlFor="nabpEprofileId">NABP e-Profile ID</Label>
                <Input id="nabpEprofileId" {...register('nabpEprofileId')} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}{' '}
              Profile
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}