/** 
 * ProgramDetail page (Supabase-only, storage_files_catalog backed)
 * - Purpose: Display a single clinical program by slug with grouped resources:
 *   Overview, Training Modules, Protocol Manuals, Documentation Forms, Additional Resources.
 * - Data: Supabase Storage via storageCatalog.getProgramResourcesGrouped (no Airtable).
 * - Layout: Blue→cyan gradient hero with glassmorphism container, then a horizontal Tabs nav.
 * - UX: Dense, full-width rows using ProgramResourceRow inside each tab; URL sync via ?tab=.
 * - Update: MTM forms (Forms tab) are sectioned and now collapsible (collapsed by default) with smooth transitions.
 * - New: Prescriber Communication Forms are further split into collapsible subsections (collapsed by default):
 *   General, Drug Interactions, Needs Drug Therapy, Optimize Medication Therapy, Suboptimal Drug Selection/High Risk Medication.
 * - New (this update): Test & Treat forms are separated into collapsible sections: COVID, Flu, Strep.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ChevronDown, ChevronRight, LibraryBig } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import SafeText from '../components/common/SafeText';
import AppShell from '../components/layout/AppShell';
import MemberSidebar from '../components/layout/MemberSidebar';
import ProgramResourceRow from '../components/resources/ProgramResourceRow';
import TrainingPlayer from '../components/training/TrainingPlayer';
import {
  getProgramResourcesGrouped,
  ProgramSlugs,
  listProgramsFromStorage,
  type ProgramSlug,
} from '../services/storageCatalog';
import type { StorageFileItem } from '../services/supabaseStorage';

/**
 * Tab identifiers for the ProgramDetail page
 */
type ProgramTab = 'overview' | 'training' | 'protocols' | 'forms' | 'resources';

/**
 * Normalize a query param value to a valid ProgramTab, or fallback to 'overview'.
 */
function normalizeTab(v: string | null | undefined): ProgramTab {
  const val = (v || '').toLowerCase();
  if (val === 'training' || val === 'protocols' || val === 'forms' || val === 'resources') return val;
  return 'overview';
}

/**
 * Sort items by display title then filename.
 */
function sortByTitle(a: StorageFileItem, b: StorageFileItem): number {
  const at = (a.title || a.filename || '').toLowerCase();
  const bt = (b.title || b.filename || '').toLowerCase();
  if (at < bt) return -1;
  if (at > bt) return 1;
  return (a.filename || '').localeCompare(b.filename || '');
}

/**
 * Section definition for MTM forms.
 */
interface SectionDef {
  key: 'general' | 'flowsheets' | 'outcomes' | 'prescriber';
  label: string;
  match: string[]; // lowercased path substrings to match
}

/**
 * Curated MTM section map (case-insensitive path matching).
 */
const MTM_SECTIONS: SectionDef[] = [
  { key: 'general', label: 'General Forms', match: ['/forms/utilityforms/'] },
  { key: 'flowsheets', label: 'Medical Conditions Flowsheets', match: ['/forms/medflowsheets/'] },
  { key: 'outcomes', label: 'Outcomes TIP Forms', match: ['/forms/outcomestip/'] },
  { key: 'prescriber', label: 'Prescriber Communication Forms', match: ['/forms/prescribercomm/'] },
];

/**
 * Prescriber Communication subsections (case-insensitive matching).
 * - Note: "General" is calculated as remaining items not matching any specific subfolder.
 */
type PrescriberKey =
  | 'general'
  | 'drugInteractions'
  | 'needsDrugTherapy'
  | 'optimizeMedication'
  | 'suboptimalHighRisk';

interface PrescriberSubDef {
  key: Exclude<PrescriberKey, 'general'>;
  label: string;
  match: string[];
}

/** Folder matchers for prescriber subfolders (lowercased, lenient) */
const PRESCRIBER_SUBFOLDERS: PrescriberSubDef[] = [
  {
    key: 'drugInteractions',
    label: 'Drug Interactions',
    match: ['/forms/prescribercomm/druginteractions/'],
  },
  {
    key: 'needsDrugTherapy',
    label: 'Needs Drug Therapy',
    match: ['/forms/prescribercomm/needsdrugtherapy/'],
  },
  {
    key: 'optimizeMedication',
    label: 'Optimize Medication Therapy',
    match: ['/forms/prescribercomm/optimizemedicationtherapy/'],
  },
  {
    key: 'suboptimalHighRisk',
    label: 'Suboptimal Drug Selection/ High Risk Medication',
    match: [
      '/forms/prescribercomm/suboptimaldrugselection_hrm/',
      '/forms/prescribercomm/suboptimaldrugselection/', // lenient fallback
    ],
  },
];

/**
 * Return true if a file path matches any of the substrings.
 */
function pathMatches(path: string, substrings: string[]): boolean {
  const p = (path || '').toLowerCase();
  return substrings.some((s) => p.includes(s));
}

/**
 * Build sectioned lists for MTM forms based on folder structure.
 * - Any unmatched items are excluded from the four curated sections.
 * - Returns only sections that have items.
 */
function buildMtmFormSections(
  items: StorageFileItem[]
): Array<{ key: SectionDef['key']; label: string; items: StorageFileItem[] }> {
  const bySection = MTM_SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    items: items
      .filter((it) => pathMatches(it.path || '', s.match))
      .slice()
      .sort(sortByTitle),
  }));
  return bySection.filter((s) => s.items.length > 0);
}

/**
 * Build Prescriber Communication subsections:
 * - Splits the given prescriber items into 5 groups:
 *   Drug Interactions, Needs Drug Therapy, Optimize Medication Therapy, Suboptimal/HRM, and General (remaining).
 * - Only returns non-empty groups.
 */
function buildPrescriberSubsections(
  items: StorageFileItem[]
): Array<{ key: PrescriberKey; label: string; items: StorageFileItem[] }> {
  const lowerPath = (s: string) => (s || '').toLowerCase();

  // 1) Compute explicit subfolder groups
  const buckets: Record<Exclude<PrescriberKey, 'general'>, StorageFileItem[]> = {
    drugInteractions: [],
    needsDrugTherapy: [],
    optimizeMedication: [],
    suboptimalHighRisk: [],
  };

  const matched = new Set<string>();
  for (const item of items) {
    const p = lowerPath(item.path);
    let placed = false;
    for (const sub of PRESCRIBER_SUBFOLDERS) {
      if (pathMatches(p, sub.match)) {
        buckets[sub.key].push(item);
        matched.add(item.path);
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Will be considered under "General" later
    }
  }

  // 2) General = items not matched by any explicit subfolder
  const general: StorageFileItem[] = items.filter((i) => !matched.has(i.path));

  // 3) Assemble, sorting each
  const out: Array<{ key: PrescriberKey; label: string; items: StorageFileItem[] }> = [];

  // General first
  if (general.length > 0) {
    out.push({
      key: 'general',
      label: 'General',
      items: general.slice().sort(sortByTitle),
    });
  }

  // Then explicit groups in the curated order
  for (const sub of PRESCRIBER_SUBFOLDERS) {
    const arr = buckets[sub.key].slice().sort(sortByTitle);
    if (arr.length > 0) {
      out.push({ key: sub.key, label: sub.label, items: arr });
    }
  }

  return out;
}

/**
 * NEW: Test & Treat section definitions
 */
type TntSectionKey = 'covid' | 'flu' | 'strep';

interface TntSectionDef {
  key: TntSectionKey;
  label: string;
  match: string[];
}

/** Curated TnT section matchers (case-insensitive) */
const TNT_SECTIONS: TntSectionDef[] = [
  { key: 'covid', label: 'COVID', match: ['/forms/covid/'] },
  { key: 'flu', label: 'Flu', match: ['/forms/flu/'] },
  { key: 'strep', label: 'Strep', match: ['/forms/strep/'] },
];

/**
 * Build Test & Treat (TnT) sections based on folder structure.
 * - Returns only sections that have items.
 */
function buildTntFormSections(
  items: StorageFileItem[]
): Array<{ key: TntSectionKey; label: string; items: StorageFileItem[] }> {
  const grouped = TNT_SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    items: items
      .filter((it) => pathMatches(it.path || '', s.match))
      .slice()
      .sort(sortByTitle),
  }));
  return grouped.filter((g) => g.items.length > 0);
}

/**
 * ProgramDetail page component (tabbed, dense layout)
 */
export default function ProgramDetail() {
  const { programSlug = '' } = useParams();
  const [name, setName] = useState<string>(programSlug);
  const [description, setDescription] = useState<string | undefined>(undefined);

  const [training, setTraining] = useState<StorageFileItem[]>([]);
  const [protocols, setProtocols] = useState<StorageFileItem[]>([]);
  const [forms, setForms] = useState<StorageFileItem[]>([]);
  const [resources, setResources] = useState<StorageFileItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // URL tab sync
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab: ProgramTab = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return normalizeTab(qs.get('tab'));
  }, [location.search]);

  /**
   * Count helpers for quick labels
   */
  const counts = {
    training: training.length,
    protocols: protocols.length,
    forms: forms.length,
    resources: resources.length,
  };

  /**
   * Collapsible state for MTM forms sections (default: collapsed)
   */
  const [mtmOpen, setMtmOpen] = useState<{
    general: boolean;
    flowsheets: boolean;
    outcomes: boolean;
    prescriber: boolean;
  }>({
    general: false,
    flowsheets: false,
    outcomes: false,
    prescriber: false,
  });

  /**
   * Collapsible state for MTM Prescriber subsections (default: collapsed)
   */
  const [mtmPrescOpen, setMtmPrescOpen] = useState<{
    general: boolean;
    drugInteractions: boolean;
    needsDrugTherapy: boolean;
    optimizeMedication: boolean;
    suboptimalHighRisk: boolean;
  }>({
    general: false,
    drugInteractions: false,
    needsDrugTherapy: false,
    optimizeMedication: false,
    suboptimalHighRisk: false,
  });

  /**
   * NEW: Collapsible state for Test & Treat sections (default: collapsed)
   */
  const [tntOpen, setTntOpen] = useState<{
    covid: boolean;
    flu: boolean;
    strep: boolean;
  }>({
    covid: false,
    flu: false,
    strep: false,
  });

  /**
   * Toggle a specific MTM section open/closed
   * @param key - Section key to toggle
   */
  function toggleMtmSection(key: SectionDef['key']) {
    setMtmOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /**
   * Toggle a specific Prescriber subsection open/closed
   * @param key - Subsection key to toggle
   */
  function toggleMtmPrescriber(key: PrescriberKey) {
    setMtmPrescOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /**
   * NEW: Toggle a specific Test & Treat section open/closed
   * @param key - TnT section key to toggle
   */
  function toggleTntSection(key: TntSectionKey) {
    setTntOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /**
   * Load metadata + grouped files from Supabase storage_files_catalog
   */
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        // Friendly name/description from curated list
        try {
          const list = await listProgramsFromStorage();
          const meta = list.find((p) => p.slug === programSlug);
          if (mounted) {
            setName(meta?.name || programSlug);
            setDescription(meta?.description || undefined);
          }
        } catch {
          if (mounted) {
            setName(programSlug);
            setDescription(undefined);
          }
        }

        // Only load grouped files if slug is recognized
        if ((ProgramSlugs as readonly string[]).includes(programSlug)) {
          const grouped = await getProgramResourcesGrouped(programSlug as ProgramSlug);
          if (!mounted) return;
          setTraining(grouped.training || []);
          setProtocols(grouped.protocols || []);
          setForms(grouped.forms || []);
          setResources(grouped.resources || []);
        } else {
          throw new Error('Program not found.');
        }
      } catch (e: any) {
        if (mounted) setErr(e?.message || 'Failed to load program.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [programSlug]);

  /**
   * Handle tab change by writing it into the URL (?tab=...)
   */
  function handleTabChange(next: string) {
    const tab = normalizeTab(next);
    const qs = new URLSearchParams(location.search);
    qs.set('tab', tab);
    navigate({ pathname: location.pathname, search: qs.toString() }, { replace: false });
  }

  /**
   * Render list rows for a group, or an empty state (dense style)
   */
  function renderRows(items: StorageFileItem[], emptyHint: string) {
    if (items.length === 0) {
      return (
        <div className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-slate-600">
          {emptyHint}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {items.map((i) => (
          <ProgramResourceRow key={i.path} item={i} />
        ))}
      </div>
    );
  }

  /**
   * Render the Prescriber Communication subsections as nested collapsibles.
   * - Default collapsed; smooth transitions using max-height.
   * - Only shown when the Prescriber section is open.
   */
  function renderPrescriberSubsections(items: StorageFileItem[]) {
    const subs = buildPrescriberSubsections(items);
    if (subs.length === 0) {
      return renderRows(items, 'No prescriber communication forms available yet.');
    }

    return (
      <div className="space-y-3">
        {subs.map((sub) => {
          const open = mtmPrescOpen[sub.key as PrescriberKey];
          const panelId = `mtm-presc-${sub.key}`;
          return (
            <div key={sub.key} className="rounded-md border bg-white">
              {/* Subsection header */}
              <button
                type="button"
                className="relative flex w-full items-center justify-between px-3 py-2 text-left rounded-t-md bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-transparent hover:from-blue-600/15 hover:via-cyan-500/15 hover:to-transparent transition-colors"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggleMtmPrescriber(sub.key)}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-600" aria-hidden />
                  <h4 className="text-sm font-semibold text-slate-800">
                    {sub.label}{' '}
                    <span className="ml-1 text-xs font-normal text-slate-500">({sub.items.length})</span>
                  </h4>
                </div>
                <div className="text-slate-500">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {/* Subsection collapsible content */}
              <div
                id={panelId}
                aria-hidden={!open}
                className={[
                  'overflow-hidden px-3',
                  open ? 'max-h-[100000px] py-3' : 'max-h-0',
                  'transition-[max-height] duration-300 ease-in-out',
                ].join(' ')}
              >
                <div className="space-y-3">
                  {sub.items.map((i) => (
                    <ProgramResourceRow key={i.path} item={i} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /**
   * Render MTM The Future Today forms as four sections with headers and counts.
   * - Sections: General Forms, Medical Conditions Flowsheets, Outcomes TIP Forms, Prescriber Communication Forms.
   * - Collapsible: Each section is collapsed by default; toggled open on header click.
   * - New: Prescriber section contains nested collapsible subsections (default: collapsed).
   */
  function renderMtmForms(items: StorageFileItem[]) {
    const sections = buildMtmFormSections(items);
    if (sections.length === 0) {
      return renderRows(items, 'No documentation forms available yet.');
    }

    return (
      <div className="space-y-4">
        {sections.map((section) => {
          const open = mtmOpen[section.key];
          const panelId = `mtm-${section.key}`;
          return (
            <div key={section.key} className="rounded-md border bg-white">
              {/* Header */}
              <button
                type="button"
                className="relative flex w-full items-center justify-between px-3 py-2 text-left rounded-t-md bg-gradient-to-r from-cyan-600/10 via-teal-500/10 to-transparent hover:from-cyan-600/15 hover:via-teal-500/15 hover:to-transparent transition-colors"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggleMtmSection(section.key)}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden />
                  <h3 className="text-sm font-semibold text-slate-800">
                    {section.label}{' '}
                    <span className="ml-1 text-xs font-normal text-slate-500">({section.items.length})</span>
                  </h3>
                </div>
                <div className="text-slate-500">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {/* Collapsible content with smooth max-height transition */}
              <div
                id={panelId}
                aria-hidden={!open}
                className={[
                  'overflow-hidden px-3',
                  open ? 'py-3' : 'max-h-0',
                  'transition-[max-height] duration-300 ease-in-out',
                ].join(' ')}
              >
                {/* For Prescriber section, render nested subsections; else render flat rows */}
                {section.key === 'prescriber' ? (
                  renderPrescriberSubsections(section.items)
                ) : (
                  <div className="space-y-3">
                    {section.items.map((i) => (
                      <ProgramResourceRow key={i.path} item={i} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /**
   * NEW: Render Test & Treat forms as three sections with headers and counts.
   * - Sections: COVID, Flu, Strep.
   * - Collapsible: Each section is collapsed by default; toggled open on header click.
   */
  function renderTntForms(items: StorageFileItem[]) {
    const sections = buildTntFormSections(items);
    if (sections.length === 0) {
      return renderRows(items, 'No documentation forms available yet.');
    }

    return (
      <div className="space-y-4">
        {sections.map((section) => {
          const open = tntOpen[section.key];
          const panelId = `tnt-${section.key}`;
          return (
            <div key={section.key} className="rounded-md border bg-white">
              {/* Header */}
              <button
                type="button"
                className="relative flex w-full items-center justify-between px-3 py-2 text-left rounded-t-md bg-gradient-to-r from-cyan-600/10 via-teal-500/10 to-transparent hover:from-cyan-600/15 hover:via-teal-500/15 hover:to-transparent transition-colors"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggleTntSection(section.key)}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden />
                  <h3 className="text-sm font-semibold text-slate-800">
                    {section.label}{' '}
                    <span className="ml-1 text-xs font-normal text-slate-500">({section.items.length})</span>
                  </h3>
                </div>
                <div className="text-slate-500">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </button>

              {/* Collapsible content with smooth max-height transition (large to avoid clipping) */}
              <div
                id={panelId}
                aria-hidden={!open}
                className={[
                  'overflow-hidden px-3',
                  open ? 'max-h-[100000px] py-3' : 'max-h-0',
                  'transition-[max-height] duration-300 ease-in-out',
                ].join(' ')}
              >
                <div className="space-y-3">
                  {section.items.map((i) => (
                    <ProgramResourceRow key={i.path} item={i} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <AppShell sidebar={<MemberSidebar />}>
      {/* Gradient hero with glass container */}
      <section className="relative -mx-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300 px-3 py-10 text-white">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="w-full max-w-none">
            <Breadcrumbs
              variant="light"
              items={[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Clinical Programs', to: '/member-content' },
                { label: name || 'Program' },
              ]}
              className="mb-4"
            />

            {/* Glassmorphism container */}
            <div className="w-full rounded-xl border border-white/25 bg-white/10 p-6 shadow-lg backdrop-blur-md">
              <h1 className="text-3xl font-bold leading-tight">
                <SafeText value={name} />
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  Supabase Storage • storage_files_catalog
                </Badge>
                {!loading ? (
                  <span className="text-xs text-white/80">
                    {counts.training} training • {counts.protocols} protocols • {counts.forms} forms • {counts.resources}{' '}
                    resources
                  </span>
                ) : null}
              </div>
              {description ? (
                <p className="mt-3 max-w-3xl text-sm text-white/90">
                  <SafeText value={description} />
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Loading or error */}
      <section className="py-6">
        {loading ? (
          <div className="rounded-md border p-6 text-sm text-slate-600">Loading program…</div>
        ) : err ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">{err}</div>
        ) : (
          <div className="space-y-6">
            {/* Tabs nav */}
            <Card className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300" />
              <CardContent className="p-0">
                <Tabs value={currentTab} onValueChange={handleTabChange}>
                  <div className="sticky top-0 z-20 border-b bg-white/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <TabsList className="h-9">
                      <TabsTrigger value="overview" className="text-sm">
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="training" className="text-sm">
                        Training {counts.training ? `(${counts.training})` : ''}
                      </TabsTrigger>
                      <TabsTrigger value="protocols" className="text-sm">
                        Protocols {counts.protocols ? `(${counts.protocols})` : ''}
                      </TabsTrigger>
                      <TabsTrigger value="forms" className="text-sm">
                        Forms {counts.forms ? `(${counts.forms})` : ''}
                      </TabsTrigger>
                      <TabsTrigger value="resources" className="text-sm">
                        Additional Resources {counts.resources ? `(${counts.resources})` : ''}
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Overview */}
                  <TabsContent value="overview" className="px-4 py-4">
                    <div className="space-y-4">
                      {description ? (
                        <p className="text-sm text-slate-700">
                          <SafeText value={description} />
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600">
                          This program includes training modules, protocols, documentation forms, and additional
                          resources.
                        </p>
                      )}

                      {/* Compact summary blocks */}
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-md border bg-white p-3 text-center text-sm">
                          <div className="text-2xl font-semibold text-slate-900">{counts.training}</div>
                          <div className="text-slate-600">Training</div>
                        </div>
                        <div className="rounded-md border bg-white p-3 text-center text-sm">
                          <div className="text-2xl font-semibold text-slate-900">{counts.protocols}</div>
                          <div className="text-slate-600">Protocols</div>
                        </div>
                        <div className="rounded-md border bg-white p-3 text-center text-sm">
                          <div className="text-2xl font-semibold text-slate-900">{counts.forms}</div>
                          <div className="text-slate-600">Forms</div>
                        </div>
                        <div className="rounded-md border bg-white p-3 text-center text-sm">
                          <div className="text-2xl font-semibold text-slate-900">{counts.resources}</div>
                          <div className="text-slate-600">Resources</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Training */}
                  <TabsContent value="training" className="px-4 py-4">
                    {training.some((t) => (t as any).mimeType?.startsWith('video/') || /\\.(mp4|webm|ogg)$/i.test(t.filename || t.title || '')) ? (
  <TrainingPlayer
    programSlug={programSlug}
    programName={name}
    programDescription={description}
    items={training}
  />
) : (
  renderRows(training, 'No training modules available yet.')
)}
                  </TabsContent>

                  {/* Protocols */}
                  <TabsContent value="protocols" className="px-4 py-4">
                    {renderRows(protocols, 'No protocol manuals available yet.')}
                  </TabsContent>

                  {/* Forms */}
                  <TabsContent value="forms" className="px-4 py-4">
                    {programSlug === 'mtmthefuturetoday'
                      ? renderMtmForms(forms)
                      : programSlug === 'testandtreat'
                      ? renderTntForms(forms)
                      : renderRows(forms, 'No documentation forms available yet.')}
                  </TabsContent>

                  {/* Additional Resources */}
                  <TabsContent value="resources" className="px-4 py-4">
                    {renderRows(resources, 'No additional resources available yet.')}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </AppShell>
  );
}
