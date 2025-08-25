/**
 * Dashboard page (account-based auth)
 * - Removes legacy User/Subscription concepts.
 * - Uses account from AuthContext; subscriptionStatus is 'active' | 'inactive'.
 * - Recently Accessed + Announcements are already positioned at the top.
 */

import React, { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/layout/AppShell';
import { useAuth } from '../components/auth/AuthContext';
// Legacy API imports removed - to be replaced with Supabase queries
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  ArrowRight,
  Download,
  PlayCircle,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MemberSidebar from '../components/layout/MemberSidebar';
import ProfileSelectionModal from '../components/profiles/ProfileSelectionModal';
import { useProfileStore } from '../stores/profileStore';
import { 
  getDashboardPrograms, 
  getRecentActivity, 
  getAnnouncements, 
  getBookmarkedResources 
} from '../services/profileDashboardService';
import type { MemberProfile } from '../types';

/**
 * Helper: map string icon names to lucide-react components safely.
 */
function iconByName(name?: string) {
  switch ((name || '').trim()) {
    case 'ClipboardCheck':
      return require('lucide-react').ClipboardCheck;
    case 'CalendarCheck':
      return require('lucide-react').CalendarCheck;
    case 'Stethoscope':
      return require('lucide-react').Stethoscope;
    case 'Activity':
      return require('lucide-react').Activity;
    case 'FileText':
      return require('lucide-react').FileText;
    case 'FileSpreadsheet':
      return require('lucide-react').FileSpreadsheet;
    case 'TestTubes':
      return require('lucide-react').TestTubes;
    case 'PlayCircle':
      return require('lucide-react').PlayCircle;
    case 'Star':
      return require('lucide-react').Star;
    default:
      return ArrowRight;
  }
}

/** Helper UI chips (compact) */
const StatChip: React.FC<{ label: string }> = ({ label }) => (
  <div className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">{label}</div>
);


/**
 * Dashboard component
 */
export default function Dashboard() {
  const { account } = useAuth();
  const { currentProfile, setCurrentProfile, loadProfiles } = useProfileStore();
  const [showProfileSelection, setShowProfileSelection] = useState(false);
  
  // Dashboard data state
  const [programs, setPrograms] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user needs to select a profile
  useEffect(() => {
    if (account?.id && !currentProfile) {
      setShowProfileSelection(true);
    }
  }, [account?.id, currentProfile]);

  // Load dashboard data when profile is selected
  useEffect(() => {
    if (!currentProfile?.id) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [programsData, activityData, announcementsData, bookmarksData] = await Promise.all([
          getDashboardPrograms(),
          getRecentActivity(currentProfile.id),
          getAnnouncements(),
          getBookmarkedResources(currentProfile.id),
        ]);
        
        setPrograms(programsData);
        setActivity(activityData);
        setAnnouncements(announcementsData);
        setBookmarks(bookmarksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentProfile?.id]);

  const handleProfileSelected = (profile: MemberProfile) => {
    setCurrentProfile(profile);
    setShowProfileSelection(false);
  };

  /** Compute subscription chip color from account.subscriptionStatus */
  const subColor = useMemo(() => {
    switch (account?.subscriptionStatus) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
      default:
        return 'bg-red-100 text-red-700';
    }
  }, [account?.subscriptionStatus]);

  // Show loading state while profile selection is happening or data is loading
  if (showProfileSelection || !currentProfile) {
    return (
      <>
        <ProfileSelectionModal
          open={showProfileSelection}
          onProfileSelected={handleProfileSelected}
        />
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </AppShell>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Failed to load dashboard</div>
            <div className="text-sm text-gray-600">{error}</div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-3 py-3 text-[13px]">
          <div>
            <div className="text-lg font-semibold">
              Welcome back, {currentProfile.firstName} {currentProfile.lastName}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
              <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[11px]">
                {currentProfile.roleType}
              </span>
              <span className="text-slate-500">at</span>
              <span className="font-medium">{account?.pharmacyName ?? 'Pharmacy'}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${subColor}`}>
                {(account?.subscriptionStatus ?? 'inactive').replace(/^\w/, (c) => c.toUpperCase())}
              </span>
            </div>
          </div>
          <Link to="/resources">
            <Button variant="outline" className="bg-transparent h-8 px-3">
              Browse Resources
            </Button>
          </Link>
        </div>
      }
      sidebar={<MemberSidebar />}
    >
      {/* Recently Accessed + Announcements at the top */}
      <section className="mb-6 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-1.5">
              <CardTitle className="text-sm">Recently Accessed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-[13px] font-medium">{a.name}</div>
                      <div className="text-[12px] text-slate-500">
                        {a.program?.toUpperCase()} • {new Date(a.accessedAtISO).toLocaleString()}
                      </div>
                    </div>
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="bg-transparent h-8 px-3">
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Re-download
                        </Button>
                      </a>
                    ) : (
                      <Link to="/resources">
                        <Button size="sm" variant="outline" className="bg-transparent h-8 px-3">
                          <Download className="mr-2 h-3.5 w-3.5" />
                          View in Library
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-1.5">
              <CardTitle className="text-sm">Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-md border p-2.5">
                    <div className="text-[13px] font-semibold">{announcement.title}</div>
                    <div className="text-[12px] text-slate-500">
                      {new Date(announcement.dateISO).toLocaleDateString()}
                    </div>
                    <div className="mt-0.5 text-[13px] text-slate-700">{announcement.body}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Programs overview */}
      <section className="mb-6">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Clinical Programs</h2>
          <div className="flex items-center gap-1.5">
            <StatChip label="49+ Active Pharmacies" />
            <StatChip label="HIPAA Compliant" />
            <StatChip label="Updated Monthly" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => {
            const Icon = iconByName(p.icon);
            return (
              <Link key={p.slug} to={`/program/${p.slug}`}>
                <Card className="group border-blue-50 hover:border-blue-200 hover:shadow-md">
                  <CardHeader className="pb-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        <CardTitle className="text-sm">{p.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[11px]">
                        {p.resourceCount} resources
                      </Badge>
                    </div>
                    <div className="text-[12px] text-slate-500">
                      Updated {p.lastUpdatedISO ? new Date(p.lastUpdatedISO).toLocaleDateString() : '—'}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[13px] text-slate-600">{p.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>


      {/* Bookmarked resources */}
      <section className="mb-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-base font-semibold">Your Bookmarked Resources</h2>
          <Link to="/resources" className="text-[12px] text-blue-700 hover:underline">
            View All
          </Link>
        </div>
        {bookmarks.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-[13px] text-slate-600">
            No bookmarks yet. Explore the Resource Library and add bookmarks for quick access.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {bookmarks.map((b) => {
              const isVideo =
                (b as any)?.mediaType === 'video' ||
                typeof (b as any)?.duration === 'string' ||
                String((b as any)?.type || '').toLowerCase() === 'video' ||
                (b.url || '').toLowerCase().match(/\.(mp4|mov|m4v|webm)$/) != null;
              const duration = (b as any)?.duration as string | undefined;

              return (
                <Card key={b.id} className="hover:shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {isVideo ? (
                        <PlayCircle className="h-4 w-4 text-slate-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-600" />
                      )}
                      <CardTitle className="text-[13px]">{b.name}</CardTitle>
                    </div>
                    {isVideo && duration ? (
                      <div className="text-[11px] text-slate-500">{duration}</div>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    {b.url ? (
                      <a href={b.url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="secondary" className="h-8 w-full px-3">
                          <Download className="mr-2 h-3.5 w-3.5" />
                          Download
                        </Button>
                      </a>
                    ) : (
                      <Link to="/resources">
                        <Button size="sm" variant="secondary" className="h-8 w-full px-3">
                          <Download className="mr-2 h-3.5 w-3.5" />
                          View in Library
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
