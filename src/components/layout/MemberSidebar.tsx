/**
 * MemberSidebar
 * - Purpose: App-level left sidebar for the member area (fixed inside AppShell aside).
 * - Uses account (not user) for display; no profile-based gating.
 */

import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LibraryBig,
  Settings as SettingsIcon,
  CalendarCheck,
  ClipboardCheck,
  Stethoscope,
  Activity,
  TestTubes,
  LogOut,
  FileText,
  FileSpreadsheet,
  BookText,
  PanelLeftClose,
  PanelRightOpen,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import BrandLogo from '../common/BrandLogo';
import { useAuthStore } from '../../stores/authStore';

/** Sidebar item descriptor */
interface ProgramNavItem {
  slug: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/** Clinical Programs (labels updated to official names) */
const PROGRAM_ITEMS: ProgramNavItem[] = [
  { slug: 'timemymeds', label: 'TimeMyMeds', Icon: CalendarCheck },
  { slug: 'mtmthefuturetoday', label: 'MTM The Future Today', Icon: ClipboardCheck },
  { slug: 'testandtreat', label: 'Test and Treat: Strep, Flu, COVID', Icon: Stethoscope },
  { slug: 'hba1c', label: 'HbA1c Testing', Icon: Activity },
  { slug: 'oralcontraceptives', label: 'Oral Contraceptives', Icon: TestTubes },
];

export default function MemberSidebar() {
  const location = useLocation();
  const { account } = useAuth();
  const { logout } = useAuthStore();

  const [openPrograms, setOpenPrograms] = useState(false);
  const [openResources, setOpenResources] = useState(false);

  const isDashboard = location.pathname === '/dashboard';
  const isResources = location.pathname.startsWith('/resources');
  const isAccount = location.pathname.startsWith('/account');
  const activeProgramSlug = (location.pathname.match(/^\/program\/([^/]+)/) || [])[1];

  const activeResourceCat = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const cat = (qs.get('cat') || '').toLowerCase();
    return cat === 'handouts' || cat === 'billing' || cat === 'clinical' ? cat : null;
  }, [location.search]);

  const itemBase = 'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors';
  const itemIdle = 'text-slate-300 hover:bg-slate-800 hover:text-white';
  const itemActive = 'bg-slate-800 text-white';

  const programGroupActive = openPrograms || Boolean(activeProgramSlug);

  useEffect(() => {
    if (activeProgramSlug && !openPrograms) {
      setOpenPrograms(true);
    }
  }, [activeProgramSlug, openPrograms]);

  useEffect(() => {
    if (isResources && !openResources) {
      setOpenResources(true);
    }
  }, [isResources, openResources]);

  const showLabels = !sidebarCollapsed;

  return (
    <nav
      aria-label="Member navigation"
      className="flex h-full flex-col p-2 text-slate-100 text-[13px]"
      aria-expanded={!sidebarCollapsed}
    >
      {/* Top bar: brand + collapse toggle */}
      <div className="mb-2 flex items-center justify-between px-1.5">
        <div className="flex items-center gap-2">
          <BrandLogo />
          {showLabels ? (
            <div className="min-w-0">
              <div className="text-[13px] font-semibold leading-5">ClinicalRxQ</div>
              <div className="truncate text-[11px] text-slate-400">{account?.pharmacyName ?? 'Member'}</div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/60 text-slate-200 hover:bg-slate-800"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Scrollable primary section */}
      <div className="flex-1 overflow-y-auto">
        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={[itemBase, isDashboard ? itemActive : itemIdle, 'mb-1', sidebarCollapsed ? 'justify-center' : ''].join(' ')}
          title="Dashboard"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          {showLabels ? <span>Dashboard</span> : <span className="sr-only">Dashboard</span>}
        </Link>

        {/* Clinical Programs group */}
        <div className="mt-1">
          <button
            type="button"
            className={[
              itemBase,
              'w-full',
              sidebarCollapsed ? 'justify-center' : 'justify-between',
              programGroupActive ? itemActive : itemIdle,
            ].join(' ')}
            onClick={() => setOpenPrograms((v) => !v)}
            aria-expanded={openPrograms}
            aria-controls="programs-group"
            title="Clinical Programs"
          >
            <span className="inline-flex items-center gap-2">
              <LibraryBig className="h-3.5 w-3.5" />
              {showLabels ? <span>Clinical Programs</span> : <span className="sr-only">Clinical Programs</span>}
            </span>
            {showLabels ? openPrograms ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : null}
          </button>

          {showLabels && openPrograms && (
            <div id="programs-group" className="mt-1 space-y-0.5 pl-2">
              {PROGRAM_ITEMS.map(({ slug, label, Icon }) => {
                const active = activeProgramSlug === slug;
                return (
                  <Link
                    key={slug}
                    to={`/program/${slug}`}
                    className={[itemBase, active ? itemActive : itemIdle, 'justify-between'].join(' ')}
                    title={label}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="truncate">{label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Resource Library group */}
        <div className="mt-2">
          <button
            type="button"
            className={[
              itemBase,
              'w-full',
              sidebarCollapsed ? 'justify-center' : 'justify-between',
              isResources || openResources ? itemActive : itemIdle,
            ].join(' ')}
            onClick={() => setOpenResources((v) => !v)}
            aria-expanded={openResources}
            aria-controls="resources-group"
            title="Resource Library"
          >
            <span className="inline-flex items-center gap-2">
              <LibraryBig className="h-3.5 w-3.5" />
              {showLabels ? <span>Resource Library</span> : <span className="sr-only">Resource Library</span>}
            </span>
            {showLabels ? openResources ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : null}
          </button>

          {showLabels && openResources && (
            <div id="resources-group" className="mt-1 space-y-0.5 pl-2">
              <Link
                to="/resources?cat=handouts"
                className={[itemBase, activeResourceCat === 'handouts' ? itemActive : itemIdle, 'justify-between'].join(' ')}
                title="Patient Handouts"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="truncate">Patient Handouts</span>
                </span>
              </Link>
              <Link
                to="/resources?cat=billing"
                className={[itemBase, activeResourceCat === 'billing' ? itemActive : itemIdle, 'justify-between'].join(' ')}
                title="Medical Billing"
              >
                <span className="inline-flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span className="truncate">Medical Billing</span>
                </span>
              </Link>
              <Link
                to="/resources?cat=clinical"
                className={[itemBase, activeResourceCat === 'clinical' ? itemActive : itemIdle, 'justify-between'].join(' ')}
                title="Clinical Resources"
              >
                <span className="inline-flex items-center gap-2">
                  <BookText className="h-3.5 w-3.5" />
                  <span className="truncate">Clinical Resources</span>
                </span>
              </Link>
              <Link
                to="/resources"
                className={[itemBase, activeResourceCat === null ? itemActive : itemIdle, 'justify-between'].join(' ')}
                title="All Resources"
              >
                <span className="inline-flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="truncate">All Resources</span>
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <Link
          to="/account"
          className={[itemBase, isAccount ? itemActive : itemIdle, 'mt-0.5', sidebarCollapsed ? 'justify-center' : ''].join(' ')}
          title="Account Settings"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          {showLabels ? <span>Account Settings</span> : <span className="sr-only">Account Settings</span>}
        </Link>
      </div>

      {/* Bottom Sign out bar */}
      <div className="border-t border-slate-800 pt-2">
        <button
          type="button"
          onClick={logout}
          className={[
            'flex w-full items-center rounded-md bg-slate-800/60 px-3 py-1.5 text-[12px] text-slate-200 hover:bg-slate-800',
            sidebarCollapsed ? 'justify-center gap-0' : 'justify-center gap-2',
          ].join(' ')}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          {showLabels ? <span>Sign Out</span> : <span className="sr-only">Sign Out</span>}
        </button>
      </div>
    </nav>
  );
}
