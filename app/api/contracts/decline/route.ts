import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { id, agencyId } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: family } = await supabase.from('families').select('id').eq('user_id', user.id).single();
    if (!family) return NextResponse.json({ error: 'No family' }, { status: 403 });

    const { error: updErr } = await supabase
      .from('contracts')
      .update({ status: 'rejected' })
      .eq('id', id)
      .eq('family_id', family.id);

    if (updErr) throw updErr;

    await supabase.from('notifications').insert({
      role: 'provider', agency_id: agencyId, title: 'Contract declined', body: 'Family declined your contract.', severity: 'error'
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


