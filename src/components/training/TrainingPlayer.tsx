/**
 * TrainingPlayer
 * - Purpose: Rich training layout for clinical programs, inspired by course/lesson page templates.
 * - Layout: Two-column (main video + sidebar playlist), responsive.
 * - Behavior:
 *   - Filters training items into videos vs. other files.
 *   - Select and play a video; supports prev/next.
 *   - Remembers last watched video per program using localStorage.
 *   - Lists non-video files as related downloads.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { ChevronLeft, ChevronRight, Download, Film, CheckCircle2 } from 'lucide-react';
import type { StorageFileItem } from '../../services/supabaseStorage';
import { isVideo } from '../../services/supabaseStorage';
import { useProfileStore } from '../../stores/profileStore';
import { 
  startTrainingModule, 
  updateTrainingProgress, 
  completeTrainingModule,
  getModuleProgress,
  type TrainingProgress 
} from '../../services/profileDashboardService';

/**
 * Props for TrainingPlayer
 */
export interface TrainingPlayerProps {
  /** Current program slug (used to key localStorage for last watched) */
  programSlug: string;
  /** Program display name */
  programName: string;
  /** Optional program description to show above player */
  programDescription?: string;
  /** All training files (videos and other related files) */
  items: StorageFileItem[];
}

/**
 * Convert a value to a simple, human-friendly text.
 * Lightweight helper to avoid importing SafeText here.
 */
function safeText(v: unknown): string {
  if (v === null || v === undefined) return '';
  try {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    if (v instanceof Date) return v.toLocaleString();
    return '';
  } catch {
    return '';
  }
}

/**
 * Extract a leading numeric index from a string to enable natural-ish ordering.
 * Example: "2 Module.mp4" => 2; "10 Intro.mp4" => 10; default => Infinity
 */
function leadingIndex(s: string): number {
  const m = (s || '').trim().match(/^(\d{1,3})\b/);
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
}

/**
 * Sort by index if present, else by title/filename case-insensitively.
 */
function sortTraining(a: StorageFileItem, b: StorageFileItem): number {
  const at = a.title || a.filename || '';
  const bt = b.title || b.filename || '';
  const ai = leadingIndex(at || a.filename || '');
  const bi = leadingIndex(bt || b.filename || '');
  if (ai !== bi) return ai - bi;
  return (at || a.filename || '').toLowerCase().localeCompare((bt || b.filename || '').toLowerCase());
}

/**
 * Infer a duration string like "12:34" from title if present (e.g., "Intro [12:34]").
 */
function inferDurationLabel(name: string): string | undefined {
  const m = (name || '').match(/[(\\[\\]([0-5]?\\d:[0-5]\\d)[\\]\\]/);
  return m?.[1];
}

/**
 * Generate unique training module ID from program slug
 */
function getTrainingModuleId(programSlug: string): string {
  return `training_${programSlug}`;
}

/**
 * Single playlist row
 */
function PlaylistRow({
  item,
  active,
  index,
  completed,
  onSelect,
}: {
  item: StorageFileItem;
  active: boolean;
  index: number;
  completed: boolean;
  onSelect: () => void;
}) {
  const title = item.title || item.filename || `Lesson ${index + 1}`;
  const duration = inferDurationLabel(title);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'group w-full rounded-md border px-3 py-2 text-left transition-colors',
        active ? 'border-blue-600 bg-blue-50' : 'hover:bg-slate-50',
      ].join(' ')}
      aria-current={active ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {completed ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Film className={['h-4 w-4', active ? 'text-blue-600' : 'text-slate-400'].join(' ')} />
            )}
            <span className={['truncate text-sm', active ? 'text-slate-900 font-medium' : 'text-slate-800'].join(' ')}>
              {title}
            </span>
          </div>
          {item.filename ? (
            <div className="mt-0.5 truncate text-[11px] text-slate-500">{item.filename}</div>
          ) : null}
        </div>
        {duration ? <span className="shrink-0 text-xs text-slate-500">{duration}</span> : null}
      </div>
    </button>
  );
}

/**
 * TrainingPlayer component
 */
export default function TrainingPlayer({
  programSlug,
  programName,
  programDescription,
  items,
}: TrainingPlayerProps) {
  const { currentProfile } = useProfileStore();
  const trainingModuleId = getTrainingModuleId(programSlug);
  
  // Partition items into videos and related files
  const { videos, related } = useMemo(() => {
    const sorted = (items || []).slice().sort(sortTraining);
    const v = sorted.filter((it) => isVideo(it));
    const r = sorted.filter((it) => !isVideo(it));
    return { videos: v, related: r };
  }, [items]);

  const [index, setIndex] = useState<number>(0);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);

  // Load training progress when profile or program changes
  useEffect(() => {
    if (!currentProfile?.id) return;
    
    const loadProgress = async () => {
      try {
        const moduleProgress = await getModuleProgress(currentProfile.id, trainingModuleId);
        setProgress(moduleProgress);
        
        // If no progress exists, start the training module
        if (!moduleProgress && videos.length > 0) {
          await startTrainingModule(currentProfile.id, trainingModuleId, programName);
          const newProgress = await getModuleProgress(currentProfile.id, trainingModuleId);
          setProgress(newProgress);
        }
      } catch (error) {
        console.error('Failed to load training progress:', error);
      }
    };
    
    loadProgress();
  }, [currentProfile?.id, trainingModuleId, programName, videos.length]);

  // Update progress when video index changes
  useEffect(() => {
    if (!currentProfile?.id || videos.length === 0) return;
    
    const updateProgress = async () => {
      try {
        const completionPercentage = Math.round(((index + 1) / videos.length) * 100);
        const isCompleted = index >= videos.length - 1;
        
        if (isCompleted) {
          await completeTrainingModule(currentProfile.id, trainingModuleId);
        } else {
          await updateTrainingProgress(currentProfile.id, trainingModuleId, completionPercentage);
        }
        
        // Refresh progress state
        const updatedProgress = await getModuleProgress(currentProfile.id, trainingModuleId);
        setProgress(updatedProgress);
      } catch (error) {
        console.error('Failed to update training progress:', error);
      }
    };
    
    updateProgress();
  }, [currentProfile?.id, trainingModuleId, index, videos.length]);

  // When video list changes (e.g., program change), clamp index
  useEffect(() => {
    if (index >= videos.length) setIndex(videos.length > 0 ? 0 : 0);
  }, [videos, index]);

  const current = videos[index] || null;

  // Video element ref to auto-play on change (best-effort)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      // Attempt to start playback; ignore autoplay rejections
      el.play().catch(() => {});
    }
  }, [current?.url]);

  // Navigation
  const hasPrev = index > 0;
  const hasNext = index < videos.length - 1;
  const handlePrev = () => setIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setIndex((i) => Math.min(videos.length - 1, i + 1));

  // Derived labels
  const title = safeText(current?.title || current?.filename || programName);
  const duration = inferDurationLabel(title);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      {/* Main content */}
      <div className="md:col-span-8 space-y-4">
        {/* Header panel */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300" />
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
              {programName}
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                Training
              </Badge>
              {progress && (
                <Badge 
                  variant={progress.completionStatus === 'completed' ? 'default' : 'outline'}
                  className={progress.completionStatus === 'completed' ? 'bg-green-600' : ''}
                >
                  {progress.completionPercentage}% Complete
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          {programDescription ? (
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600">{programDescription}</p>
              {progress && progress.completionStatus === 'completed' && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Training completed on {new Date(progress.completedTime!).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          ) : null}
        </Card>

        {/* Video player */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            {current ? (
              <div className="space-y-3">
                <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-100">
                  <video
                    ref={videoRef}
                    key={current.url}
                    controls
                    preload="metadata"
                    className="h-full w-full rounded-md"
                    src={current.url}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{title}</div>
                    {duration ? <div className="text-xs text-slate-500">{duration}</div> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrev} disabled={!hasPrev} className="h-8 px-2">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Prev
                    </Button>
                    <Button size="sm" onClick={handleNext} disabled={!hasNext} className="h-8 px-2">
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-slate-600">
                No training videos available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related non-video training files */}
        {related.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Related files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {related.map((f) => (
                <div
                  key={f.path}
                  className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{f.title || f.filename || 'File'}</div>
                    {f.filename ? (
                      <div className="truncate text-[11px] text-slate-500">{f.filename}</div>
                    ) : null}
                  </div>
                  <a href={f.url} target="_blank" rel="noreferrer">
                    <Button className="h-8 px-3">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Sidebar playlist */}
      <div className="md:col-span-4">
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-300" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Course content</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {videos.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No video lessons yet.</div>
            ) : (
              <ScrollArea className="max-h-[60vh] px-3 py-3">
                <div className="space-y-2">
                  {videos.map((v, i) => (
                    <PlaylistRow
                      key={v.path}
                      item={v}
                      active={i === index}
                      index={i}
                      completed={progress ? i < (videos.length * (progress.completionPercentage / 100)) : false}
                      onSelect={() => setIndex(i)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
