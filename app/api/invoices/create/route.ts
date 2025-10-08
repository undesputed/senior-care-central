import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Insert draft invoice (Stripe integration can replace this later)
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        contract_id: body.contractId,
        agency_id: body.agencyId,
        patient_id: body.patientId,
        family_id: body.familyId,
        number: null,
        status: 'open',
        currency: 'usd',
        amount_subtotal: body.amountSubtotal,
        amount_tax: body.amountTax,
        amount_total: body.amountTotal,
        amount_due: body.amountTotal,
        due_date: body.dueDate,
        lines: body.lines || [],
        meta: body.meta || {}
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ invoice: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


