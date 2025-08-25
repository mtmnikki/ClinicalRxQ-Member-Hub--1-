/**
 * Profile Dashboard Service
 * - Fetches dashboard data specific to a member profile
 * - All activity tracking is done at the profile level, not account level
 */

import { supabase } from './supabase';
import { listProgramsFromStorage } from './storageCatalog';
import type { StorageFileItem } from './supabaseStorage';

// Types for dashboard data
export interface RecentActivity {
  id: string;
  resourceName: string;
  resourcePath?: string;
  resourceUrl?: string;
  programSlug?: string;
  accessedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  dateISO: string;
}

export interface BookmarkedResource extends StorageFileItem {
  bookmarkedAt: string;
}

export interface TrainingProgress {
  id: string;
  trainingModuleId: string;
  moduleName: string;
  startTime?: string;
  completedTime?: string;
  completionPercentage: number;
  completionStatus: 'not_started' | 'in_progress' | 'completed';
}

// Fetch programs with resource counts (account level - same for all profiles in pharmacy)
export async function getDashboardPrograms() {
  const programs = await listProgramsFromStorage();
  
  return programs.map(p => ({
    ...p,
    icon: getIconForProgram(p.slug),
    resourceCount: 50, // TODO: Calculate from storage if needed
    lastUpdatedISO: new Date().toISOString()
  }));
}

// Fetch recent activity for specific profile
export async function getRecentActivity(profileId: string): Promise<RecentActivity[]> {
  const { data, error } = await supabase
    .from('recent_activity')
    .select('*')
    .eq('member_profile_id', profileId)
    .order('accessed_at', { ascending: false })
    .limit(10);
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    resourceName: row.resource_name,
    resourcePath: row.resource_path,
    resourceUrl: row.resource_url,
    programSlug: row.program_slug,
    accessedAt: row.accessed_at,
  }));
}

// Fetch announcements (pharmacy level - same for all profiles)
export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('date', { ascending: false })
    .limit(5);
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    body: row.body,
    dateISO: row.date,
  }));
}

// Fetch bookmarked resources for specific profile
export async function getBookmarkedResources(profileId: string): Promise<BookmarkedResource[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('member_profile_id', profileId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    path: row.resource_path,
    title: row.resource_name,
    filename: row.resource_path.split('/').pop() || row.resource_path,
    url: row.resource_url || buildPublicUrl(row.resource_path),
    mimeType: row.mime_type,
    size: row.file_size,
    bookmarkedAt: row.created_at,
  }));
}

// Fetch training progress for specific profile
export async function getTrainingProgress(profileId: string): Promise<TrainingProgress[]> {
  const { data, error } = await supabase
    .from('member_training_progress')
    .select(`
      *,
      training_modules (
        module_name
      )
    `)
    .eq('member_profile_id', profileId)
    .order('start_time', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    trainingModuleId: row.training_module_id,
    moduleName: row.training_modules?.module_name || 'Unknown Module',
    startTime: row.start_time,
    completedTime: row.completed_time,
    completionPercentage: row.completion_percentage || 0,
    completionStatus: row.completion_status || 'not_started',
  }));
}

// Track resource access for specific profile
export async function trackResourceAccess(
  profileId: string,
  resource: { 
    name: string; 
    path: string; 
    url?: string; 
    programSlug?: string;
    mimeType?: string;
  }
) {
  const { error } = await supabase
    .from('recent_activity')
    .upsert({
      member_profile_id: profileId,
      resource_name: resource.name,
      resource_path: resource.path,
      resource_url: resource.url,
      program_slug: resource.programSlug,
      mime_type: resource.mimeType,
      accessed_at: new Date().toISOString()
    }, {
      onConflict: 'member_profile_id,resource_path'
    });
    
  if (error) {
    console.error('Failed to track resource access:', error);
    throw error;
  }
}

// Add bookmark for specific profile
export async function addBookmark(
  profileId: string,
  resource: {
    path: string;
    name: string;
    url?: string;
    mimeType?: string;
    fileSize?: number;
  }
) {
  const { error } = await supabase
    .from('bookmarks')
    .insert({
      member_profile_id: profileId,
      resource_path: resource.path,
      resource_name: resource.name,
      resource_url: resource.url,
      mime_type: resource.mimeType,
      file_size: resource.fileSize,
    });
    
  if (error) throw error;
}

// Remove bookmark for specific profile
export async function removeBookmark(profileId: string, resourcePath: string) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('member_profile_id', profileId)
    .eq('resource_path', resourcePath);
    
  if (error) throw error;
}

// Check if resource is bookmarked by profile
export async function isBookmarked(profileId: string, resourcePath: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('member_profile_id', profileId)
    .eq('resource_path', resourcePath)
    .limit(1);
    
  if (error) throw error;
  return (data || []).length > 0;
}

// Training progress tracking functions

// Start/update training module progress
export async function startTrainingModule(
  profileId: string,
  trainingModuleId: string,
  moduleName: string
): Promise<void> {
  const { error } = await supabase
    .from('member_training_progress')
    .upsert({
      member_profile_id: profileId,
      training_module_id: trainingModuleId,
      module_name: moduleName,
      start_time: new Date().toISOString(),
      completion_status: 'in_progress',
      completion_percentage: 0,
    }, {
      onConflict: 'member_profile_id,training_module_id'
    });
    
  if (error) throw error;
}

// Update training module progress
export async function updateTrainingProgress(
  profileId: string,
  trainingModuleId: string,
  completionPercentage: number,
  completionStatus: 'in_progress' | 'completed' = 'in_progress'
): Promise<void> {
  const updateData: any = {
    completion_percentage: Math.min(100, Math.max(0, completionPercentage)),
    completion_status: completionStatus,
  };
  
  if (completionStatus === 'completed') {
    updateData.completed_time = new Date().toISOString();
  }

  const { error } = await supabase
    .from('member_training_progress')
    .update(updateData)
    .eq('member_profile_id', profileId)
    .eq('training_module_id', trainingModuleId);
    
  if (error) throw error;
}

// Complete training module
export async function completeTrainingModule(
  profileId: string,
  trainingModuleId: string
): Promise<void> {
  await updateTrainingProgress(profileId, trainingModuleId, 100, 'completed');
}

// Get progress for a specific training module
export async function getModuleProgress(
  profileId: string,
  trainingModuleId: string
): Promise<TrainingProgress | null> {
  const { data, error } = await supabase
    .from('member_training_progress')
    .select('*')
    .eq('member_profile_id', profileId)
    .eq('training_module_id', trainingModuleId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  
  return {
    id: data.id,
    trainingModuleId: data.training_module_id,
    moduleName: data.module_name || 'Unknown Module',
    startTime: data.start_time,
    completedTime: data.completed_time,
    completionPercentage: data.completion_percentage || 0,
    completionStatus: data.completion_status || 'not_started',
  };
}

// Helper to build public URLs (reuse from existing storage service)
function buildPublicUrl(path: string): string {
  const base = process.env.VITE_SUPABASE_URL;
  if (!base) return '';
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/storage/v1/object/public/clinicalrxqfiles/${encodeURI(cleanPath)}`;
}

// Helper to map program slugs to icons
function getIconForProgram(slug: string): string {
  const iconMap: Record<string, string> = {
    'mtmthefuturetoday': 'ClipboardCheck',
    'timemymeds': 'CalendarCheck',
    'testandtreat': 'Stethoscope',
    'hba1c': 'Activity',
    'oralcontraceptives': 'FileText'
  };
  return iconMap[slug] || 'FileText';
}