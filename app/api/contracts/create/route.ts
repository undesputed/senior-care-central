import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const contractData = await request.json();
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agency ID for this user
    const { data: agency } = await supabase
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Get family ID from patient
    const { data: patient } = await supabase
      .from('patients')
      .select('family_id')
      .eq('id', contractData.patientId)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Create contract in database
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        contract_id: contractData.contractId,
        agency_id: agency.id,
        patient_id: contractData.patientId,
        family_id: patient.family_id,
        status: contractData.status || 'draft',
        
        // Basic Details
        client_name: contractData.clientName,
        client_phone: contractData.clientPhone,
        client_email: contractData.clientEmail,
        care_recipient_name: contractData.careRecipientName,
        care_recipient_age: contractData.careRecipientAge,
        care_recipient_address: contractData.careRecipientAddress,
        care_recipient_conditions: contractData.careRecipientConditions,
        
        // Provider Details
        provider_name: contractData.providerName,
        provider_address: contractData.providerAddress,
        provider_email: contractData.providerEmail,
        provider_phone: contractData.providerPhone,
        
        // Plan Details
        selected_services: contractData.selectedServices,
        custom_services: contractData.customServices,
        care_type: contractData.careType,
        care_schedule: contractData.careSchedule,
        care_times: contractData.careTimes,
        min_sessions: contractData.minSessions,
        max_sessions: contractData.maxSessions,
        start_date: contractData.startDate,
        end_date: contractData.endDate,
        
        // Payment Terms
        effective_date: contractData.effectiveDate,
        payment_method: contractData.paymentMethod,
        billing_type: contractData.billingType,
        rate: contractData.rate,
        
        // Legal Terms
        terms_and_conditions: contractData.termsAndConditions,
        cancellation_disputes: contractData.cancellationDisputes,
        platform_disclaimer: contractData.platformDisclaimer,
        acceptance_terms: contractData.acceptanceTerms,
        terms_accepted: contractData.termsAccepted,
        
        // Timestamps
        sent_at: contractData.status === 'sent' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      contract,
      message: 'Contract created successfully'
    });

  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
