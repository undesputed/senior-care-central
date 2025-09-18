import { createClient } from '@/lib/supabase/client'

export async function validateSessionAndClearIfInvalid(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return false
    }

    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      // User was deleted from database, clear all session data
      await supabase.auth.signOut()
      // Also clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      return false
    }

    return true
  } catch (error) {
    console.error('Session validation error:', error)
    // On error, clear session to be safe
    await supabase.auth.signOut()
    return false
  }
}
