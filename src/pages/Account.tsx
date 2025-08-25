/**
 * My Account page (editable)
 * - Authenticated accounts can update their own account information.
 * - Allows selecting, editing, and deleting team member profiles.
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

export default function Account() {
  const { account } = useAuth();
  const { profiles, currentProfile, setCurrentProfile, loadProfilesAndSetDefault } = useProfileStore();
  const updateAccount = useAuthStore((state) => state.updateAccount);
  
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<MemberProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<MemberProfile | null>(null);

  const [form, setForm] = useState({
    email: account?.email || '',
    pharmacyName: account?.pharmacyName || '',
    pharmacyPhone: account?.pharmacyPhone || '',
    address1: account?.address1 || '',
    city: account?.city || '',
    state: account?.state || '',
    zipcode: account?.zipcode?.toString() ?? '',
  });

  useEffect(() => {
    if (account?.id) {
      loadProfilesAndSetDefault(account.id);
    }
  }, [account?.id, loadProfilesAndSetDefault]);

  useEffect(() => {
    if (account) {
      setForm({
        email: account.email || '',
        pharmacyName: account.pharmacyName || '',
        pharmacyPhone: account.pharmacyPhone || '',
        address1: account.address1 || '',
        city: account.city || '',
        state: account.state || '',
        zipcode: account.zipcode?.toString() ?? '',
      });
    }
  }, [account]);

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

  async function handleSave() {
    try {
      await updateAccount({
        email: form.email,
        pharmacyName: form.pharmacyName,
        pharmacyPhone: form.pharmacyPhone || null,
        address1: form.address1 || null,
        city: form.city || null,
        state: form.state || null,
        zipcode: form.zipcode ? parseInt(form.zipcode, 10) : null,
      });
      toast.success('Account updated successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update account');
    }
  }

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
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Pharmacy Name
                    </label>
                    <input
                      type="text"
                      value={form.pharmacyName}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, pharmacyName: e.target.value }))
                      }
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Status
                    </label>
                    <div className="flex h-10 items-center">{statusBadge}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, email: e.target.value }))
                        }
                        className="w-full rounded-md border p-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Phone
                    </label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={form.pharmacyPhone ?? ''}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            pharmacyPhone: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border p-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Address
                    </label>
                    <input
                      type="text"
                      value={form.address1 ?? ''}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, address1: e.target.value }))
                      }
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city ?? ''}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, city: e.target.value }))
                      }
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state ?? ''}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, state: e.target.value }))
                      }
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={form.zipcode ?? ''}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, zipcode: e.target.value }))
                      }
                      className="w-full rounded-md border p-2"
                    />
                  </div>
                </div>

                <Button onClick={handleSave}>
                  <Settings className="mr-2 h-4 w-4" />
                  Save changes
                </Button>
              </div>
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
              <Button onClick={() => setAddModalOpen(true)}>
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