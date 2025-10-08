import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        role: body.role || 'provider',
        agency_id: body.agencyId || null,
        family_id: body.familyId || null,
        user_id: user.id,
        title: body.title,
        body: body.body,
        severity: body.severity || 'success',
        contract_id: body.contractId || null,
        patient_id: body.patientId || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ notification: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


