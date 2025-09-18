import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agency, error: aerr } = await supabase
    .from('agencies')
    .select('id,business_name,logo_url,permit_verified,cities,postal_codes')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (aerr) return NextResponse.json({ error: aerr.message }, { status: 400 })
  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

  // Required checks: name, at least one service, serviceable area, rates, permit verified
  if (!agency.business_name) return NextResponse.json({ error: 'Business name required' }, { status: 400 })
  if (!agency.permit_verified) return NextResponse.json({ error: 'Business permit must be verified' }, { status: 400 })
  const hasArea = (agency.cities && agency.cities.length > 0) || (agency.postal_codes && agency.postal_codes.length > 0)
  if (!hasArea) return NextResponse.json({ error: 'Serviceable area required' }, { status: 400 })

  // Get agency ID first, then query related tables
  const agencyId = agency.id;
  
  const [{ data: services }, { data: rates }] = await Promise.all([
    supabase.from('agency_services').select('service_id').eq('agency_id', agencyId),
    supabase.from('agency_service_rates').select('service_id,min_amount,max_amount').eq('agency_id', agencyId),
  ])

  if (!services || services.length === 0) return NextResponse.json({ error: 'At least one service required' }, { status: 400 })

  const serviceIds = new Set(services.map((s: any) => s.service_id))
  const hasRateForAny = (rates ?? []).some((r: any) => serviceIds.has(r.service_id) && (r.min_amount != null || r.max_amount != null))
  if (!hasRateForAny) return NextResponse.json({ error: 'Provide at least one rate' }, { status: 400 })

  const { error: uerr } = await supabase.from('agencies').update({ status: 'published' }).eq('owner_id', user.id)
  if (uerr) return NextResponse.json({ error: uerr.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}


