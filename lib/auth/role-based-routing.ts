import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type UserRole = 'family' | 'provider';

export interface UserRoleInfo {
  role: UserRole;
  userId: string;
  profile?: any;
}

/**
 * Get user role and profile information
 */
export async function getUserRoleInfo(): Promise<UserRoleInfo | null> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as UserRole) || 'family';

  return {
    role,
    userId: user.id,
    profile
  };
}

/**
 * Redirect user to appropriate dashboard based on role
 */
export async function redirectByRole(): Promise<void> {
  const userInfo = await getUserRoleInfo();
  
  if (!userInfo) {
    redirect('/family/login');
    return;
  }

  switch (userInfo.role) {
    case 'family':
      redirect('/family/dashboard');
      break;
    case 'provider':
      redirect('/provider/dashboard');
      break;
    default:
      redirect('/family/login');
  }
}

/**
 * Protect route for specific role
 */
export async function protectRoute(allowedRoles: UserRole[]): Promise<UserRoleInfo> {
  const userInfo = await getUserRoleInfo();
  
  if (!userInfo) {
    redirect('/family/login');
  }

  if (!allowedRoles.includes(userInfo.role)) {
    // Redirect to appropriate login page based on role
    if (userInfo.role === 'provider') {
      redirect('/provider/login');
    } else {
      redirect('/family/login');
    }
  }

  return userInfo;
}

/**
 * Get appropriate login URL for user role
 */
export function getLoginUrl(role: UserRole): string {
  switch (role) {
    case 'family':
      return '/family/login';
    case 'provider':
      return '/provider/login';
    default:
      return '/family/login';
  }
}

/**
 * Get appropriate dashboard URL for user role
 */
export function getDashboardUrl(role: UserRole): string {
  switch (role) {
    case 'family':
      return '/family/dashboard';
    case 'provider':
      return '/provider/dashboard';
    default:
      return '/family/dashboard';
  }
}

/**
 * Check if user is authenticated and has valid role
 */
export async function isAuthenticatedWithRole(role: UserRole): Promise<boolean> {
  const userInfo = await getUserRoleInfo();
  return userInfo?.role === role;
}
