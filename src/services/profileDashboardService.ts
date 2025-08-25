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
    .eq('profile_id', profileId)
    .order('accessed_at', { ascending: false })
    .limit(10);
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    resourceName: row.resource_name,
    resourcePath: '', // Not in current schema
    resourceUrl: '', // Not in current schema
    programSlug: '', // Not in current schema
    accessedAt: row.accessed_at,
  }));
}

// Fetch announcements (pharmacy level - same for all profiles)
export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id.toString(),
    title: row.title,
    body: row.body,
    dateISO: row.created_at,
  }));
}

// Fetch bookmarked resources for specific profile
export async function getBookmarkedResources(profileId: string): Promise<BookmarkedResource[]> {
  // Join bookmarks with storage_files_catalog to get file details
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      storage_files_catalog (
        file_name,
        file_path,
        file_url,
        mime_type,
        file_size
      )
    `)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    path: row.storage_files_catalog?.file_path || '',
    title: row.storage_files_catalog?.file_name || 'Unknown Resource',
    filename: row.storage_files_catalog?.file_name || '',
    url: row.storage_files_catalog?.file_url || '',
    mimeType: row.storage_files_catalog?.mime_type || '',
    size: row.storage_files_catalog?.file_size || 0,
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
        name
      )
    `)
    .eq('member_profile_id', profileId)
    .order('started_at', { ascending: false });
    
  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    trainingModuleId: row.training_module_id,
    moduleName: row.training_modules?.name || 'Unknown Module',
    startTime: row.started_at,
    completedTime: row.completed_at,
    completionPercentage: row.completion_percentage || 0,
    completionStatus: row.is_completed ? 'completed' : (row.started_at ? 'in_progress' : 'not_started'),
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
    .insert({
      profile_id: profileId,
      resource_name: resource.name,
      resource_type: resource.mimeType || 'file',
      accessed_at: new Date().toISOString()
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
  // First find the resource_id from storage_files_catalog
  const { data: fileData, error: fileError } = await supabase
    .from('storage_files_catalog')
    .select('id')
    .eq('file_path', resource.path)
    .single();
  
  if (fileError) throw fileError;
  
  const { error } = await supabase
    .from('bookmarks')
    .insert({
      profile_id: profileId,
      resource_type: 'file',
      resource_id: fileData.id,
    });
    
  if (error) throw error;
}

// Remove bookmark for specific profile
export async function removeBookmark(profileId: string, resourcePath: string) {
  // First find the resource_id from storage_files_catalog
  const { data: fileData, error: fileError } = await supabase
    .from('storage_files_catalog')
    .select('id')
    .eq('file_path', resourcePath)
    .single();
  
  if (fileError) throw fileError;
  
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('profile_id', profileId)
    .eq('resource_id', fileData.id);
    
  if (error) throw error;
}

// Check if resource is bookmarked by profile
export async function isBookmarked(profileId: string, resourcePath: string): Promise<boolean> {
  // First find the resource_id from storage_files_catalog
  const { data: fileData, error: fileError } = await supabase
    .from('storage_files_catalog')
    .select('id')
    .eq('file_path', resourcePath)
    .single();
  
  if (fileError) return false; // File not found in catalog
  
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('profile_id', profileId)
    .eq('resource_id', fileData.id)
    .limit(1);
    
  if (error) throw error;
  return (data || []).length > 0;
}

// Training progress tracking functions

// Start/update training module progress
export async function startTrainingModule(
  profileId: string,
  trainingModuleId: string,
  _moduleName: string
): Promise<void> {
  const { error } = await supabase
    .from('member_training_progress')
    .upsert({
      member_profile_id: profileId,
      training_module_id: trainingModuleId,
      started_at: new Date().toISOString(),
      is_completed: false,
      completion_percentage: 0,
      attempts: 1,
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
  isCompleted: boolean = false
): Promise<void> {
  const updateData: any = {
    completion_percentage: Math.min(100, Math.max(0, completionPercentage)),
    is_completed: isCompleted,
  };
  
  if (isCompleted) {
    updateData.completed_at = new Date().toISOString();
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
  await updateTrainingProgress(profileId, trainingModuleId, 100, true);
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
    moduleName: 'Unknown Module', // Not stored in progress table
    startTime: data.started_at,
    completedTime: data.completed_at,
    completionPercentage: data.completion_percentage || 0,
    completionStatus: data.is_completed ? 'completed' : (data.started_at ? 'in_progress' : 'not_started'),
  };
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