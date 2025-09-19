import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Get the authenticated user (more secure than getSession)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized - No valid user' }, { status: 401 })
  }
  
  // Get role from request body or user metadata
  let role = (user.user_metadata?.role as string) || 'provider'
  try {
    const body = await request.json()
    if (body.role) {
      role = body.role
    }
  } catch {
    // No body or invalid JSON, use default
  }

  // Check if profile already exists
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (!profile) {
    const displayName = role === 'family' 
      ? (user.user_metadata?.full_name || user.email)
      : (user.user_metadata?.owner_name || user.email)
    
    const { error } = await supabase.from('profiles').insert({ 
      id: user.id, 
      role, 
      display_name: displayName
    })
    if (error) {
      console.error('Profile creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  // If provider role, ensure agencies row exists
  if (role === 'provider') {
    const { data: agency } = await supabase.from('agencies').select('id').eq('owner_id', user.id).maybeSingle()
    if (!agency) {
      const { error } = await supabase.from('agencies').insert({ 
        owner_id: user.id,
        business_name: '',
        email: user.email,
        status: 'draft'
      })
      if (error) {
        console.error('Agency creation error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
  }

  // If family role, ensure families row exists
  if (role === 'family') {
    const { data: fam } = await supabase.from('families').select('id').eq('user_id', user.id).maybeSingle()
    if (!fam) {
      const { error } = await supabase.from('families').insert({ 
        user_id: user.id, 
        full_name: user.user_metadata?.full_name || user.email,
        preferred_contact_method: 'email'
      })
      if (error) {
        console.error('Family creation error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
  }

  return NextResponse.json({ ok: true })
}


