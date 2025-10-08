import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { id, agencyId } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure the contract belongs to this family
    const { data: family } = await supabase.from('families').select('id').eq('user_id', user.id).single();
    if (!family) return NextResponse.json({ error: 'No family' }, { status: 403 });

    const { error: updErr } = await supabase
      .from('contracts')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('family_id', family.id);

    if (updErr) throw updErr;

    await supabase.from('notifications').insert({
      role: 'provider', agency_id: agencyId, title: 'Contract accepted', body: 'Family accepted your contract.', severity: 'success'
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


