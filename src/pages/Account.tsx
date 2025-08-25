/**
 * My Account page (editable)
 * - Authenticated accounts can update their own account information.
 * - Allows selecting, editing, and deleting team member profiles.
 * - Refactored to use React Hook Form and Zod for validation.
 */

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Settings,
  Plus,
  Building,
  Mail,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import Breadcrumbs from '../components/common/Breadcrumbs';
import AppShell from '../components/layout/AppShell';
import MemberSidebar from '../components/layout/MemberSidebar';
import AddProfileModalSupabase from '../components/profiles/AddProfileModalSupabase';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useProfileStore } from '../stores/profileStore';
import { useAuth } from '../components/auth/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { MemberProfile } from '@/types';
import { supabase } from '@/services/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// Zod schema for account form validation
const accountSchema = z.object({
  pharmacyName: z.string().min(1, 'Pharmacy name is required'),
  email: z.string().email('Invalid email address'),
  pharmacyPhone: z.string().optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export default function Account() {
  const { account } = useAuth();
  const { profiles, currentProfile, setCurrentProfile, loadProfilesAndSetDefault } = useProfileStore();
  const updateAccount = useAuthStore((state) => state.updateAccount);
  
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<MemberProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<MemberProfile | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
  });

  useEffect(() => {
    if (account?.id) {
      loadProfilesAndSetDefault(account.id);
    }
  }, [account?.id, loadProfilesAndSetDefault]);

  useEffect(() => {
    if (account) {
      reset({
        email: account.email || '',
        pharmacyName: account.pharmacyName || '',
        pharmacyPhone: account.pharmacyPhone || '',
        address1: account.address1 || '',
        city: account.city || '',
        state: account.state || '',
        zipcode: account.zipcode?.toString() ?? '',
      });
    }
  }, [account, reset]);

  const handleSetActive = (profile: MemberProfile) => {
    setCurrentProfile(profile);
    toast.success(`Active profile switched to ${profile.displayName}`);
  };

  const handleEdit = (profile: MemberProfile) => {
    setProfileToEdit(profile);
  };
  
  const handleDelete = async () => {
    if (!profileToDelete || !account?.id) return;
  
    try {
      const { error } = await supabase
        .from('member_profiles')
        .delete()
        .eq('id', profileToDelete.id);
  
      if (error) throw error;
  
      toast.success(`Profile "${profileToDelete.displayName}" has been deleted.`);
      
      if (currentProfile?.id === profileToDelete.id) {
        const remainingProfiles = profiles.filter(p => p.id !== profileToDelete.id);
        setCurrentProfile(remainingProfiles[0] || null);
      }
  
      await loadProfilesAndSetDefault(account.id);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete profile.');
    } finally {
      setProfileToDelete(null);
    }
  };

  const onSaveAccount = async (data: AccountFormValues) => {
    try {
      await updateAccount({
        ...data,
        zipcode: data.zipcode ? parseInt(data.zipcode, 10) : null,
      });
      toast.success('Account updated successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update account');
    }
  };

  const header = (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-4">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'My Account' },
        ]}
        className="mb-2"
      />
      <div className="mb-1 text-2xl font-bold">My Account</div>
      <div className="text-sm text-gray-600">
        Manage your pharmacy account and team profiles.
      </div>
    </div>
  );

  const statusBadge =
    account?.subscriptionStatus === 'active' ? (
      <Badge
        variant="default"
        className="bg-green-100 text-green-700 hover:bg-green-100"
      >
        Active
      </Badge>
    ) : (
      <Badge
        variant="secondary"
        className="bg-red-100 text-red-700 hover:bg-red-100"
      >
        Inactive
      </Badge>
    );

  return (
    <AppShell sidebar={<MemberSidebar />} header={header}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSaveAccount)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="pharmacyName">Pharmacy Name</Label>
                    <Input id="pharmacyName" {...register('pharmacyName')} />
                    {errors.pharmacyName && <p className="mt-1 text-xs text-red-600">{errors.pharmacyName.message}</p>}
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex h-10 items-center">{statusBadge}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input id="email" {...register('email')} className="pl-9" />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="pharmacyPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <Input id="pharmacyPhone" {...register('pharmacyPhone')} className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="address1">Address</Label>
                    <Input id="address1" {...register('address1')} />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register('city')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register('state')} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="zipcode">Zip Code</Label>
                    <Input id="zipcode" {...register('zipcode')} />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  <Settings className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pharmacy Team Profiles
              </CardTitle>
              <Button onClick={() => { setProfileToEdit(null); setAddModalOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Profile
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profiles.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No team profiles yet. Click "Add Profile" to get started.
                  </div>
                ) : (
                  profiles.map((profile) => {
                    const isActive = currentProfile?.id === profile.id;
                    const isDefaultPharmacyProfile = profile.role === 'Pharmacy';
                    return (
                      <div
                        key={profile.id}
                        className={`rounded-md border p-3 transition-all ${
                          isActive ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{profile.displayName}</div>
                            <div className="text-sm text-slate-500">{profile.role}</div>
                          </div>
                          {isActive && (
                            <Badge variant="default" className="bg-green-600 text-white">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleEdit(profile)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          {!isDefaultPharmacyProfile && (
                             <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => setProfileToDelete(profile)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSetActive(profile)}
                            disabled={isActive}
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Set Active
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddProfileModalSupabase
        open={isAddModalOpen || !!profileToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setAddModalOpen(false);
            setProfileToEdit(null);
          }
        }}
        onProfileCreated={() => {
          setAddModalOpen(false);
          setProfileToEdit(null);
          if (account?.id) loadProfilesAndSetDefault(account.id);
        }}
        profileToEdit={profileToEdit || undefined}
      />
      
      <AlertDialog open={!!profileToDelete} onOpenChange={() => setProfileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the profile for "{profileToDelete?.displayName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProfileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}