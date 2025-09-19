import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface FamilyAuthResult {
  success: boolean;
  error?: string;
  user?: any;
  family?: any;
}

/**
 * Check if a user has a family profile and is properly set up
 */
export async function checkFamilyProfile(userId: string): Promise<{
  hasProfile: boolean;
  family?: any;
  needsOnboarding: boolean;
}> {
  const supabase = await createClient();
  
  const { data: family, error } = await supabase
    .from('families')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking family profile:', error);
    return { hasProfile: false, needsOnboarding: true };
  }

  return {
    hasProfile: !!family,
    family,
    needsOnboarding: !family?.onboarding_completed
  };
}

/**
 * Create a family profile for a new user
 */
export async function createFamilyProfile(userId: string, userData: {
  full_name?: string;
  email?: string;
  phone_number?: string;
}): Promise<FamilyAuthResult> {
  const supabase = await createClient();
  
  try {
    // First ensure the profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      // Create profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'family',
          display_name: userData.full_name || userData.email
        });

      if (profileError) {
        return { success: false, error: profileError.message };
      }
    }

    // Create family record
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        user_id: userId,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        preferred_contact_method: 'email'
      })
      .select()
      .single();

    if (familyError) {
      return { success: false, error: familyError.message };
    }

    return { success: true, family };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle family authentication redirect logic
 */
export async function handleFamilyAuthRedirect(userId: string): Promise<string> {
  const { hasProfile, needsOnboarding } = await checkFamilyProfile(userId);
  
  if (!hasProfile) {
    // This shouldn't happen in normal flow, but redirect to dashboard
    return '/family/dashboard';
  }
  
  if (needsOnboarding) {
    // For now, redirect to dashboard. Onboarding will be implemented later
    return '/family/dashboard';
  }
  
  return '/family/dashboard';
}

/**
 * Validate family user access to protected routes
 */
export async function validateFamilyAccess(userId: string): Promise<{
  isValid: boolean;
  redirectTo?: string;
}> {
  const supabase = await createClient();
  
  // Check if user has family role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || profile.role !== 'family') {
    return { isValid: false, redirectTo: '/family/login' };
  }

  // Check if family profile exists
  const { hasProfile } = await checkFamilyProfile(userId);
  if (!hasProfile) {
    return { isValid: false, redirectTo: '/family/login' };
  }

  return { isValid: true };
}
