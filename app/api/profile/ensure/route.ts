import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (user.user_metadata?.role as string) || 'provider'

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (!profile) {
    const { error } = await supabase.from('profiles').insert({ id: user.id, role, display_name: user.user_metadata?.owner_name || user.email })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // If family role, ensure families row exists
  if (role === 'family') {
    const { data: fam } = await supabase.from('families').select('id').eq('user_id', user.id).maybeSingle()
    if (!fam) {
      const { error } = await supabase.from('families').insert({ user_id: user.id, full_name: user.user_metadata?.full_name || user.email })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}


