import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkOnboardingCompletion } from '@/lib/onboarding/onboarding-utils'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await checkOnboardingCompletion(user.id)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
