import { createClient } from '@/lib/supabase/server'

export async function checkOnboardingCompletion(userId: string): Promise<{
  isComplete: boolean
  nextStep?: string
}> {
  const supabase = await createClient()
  
  // First verify user exists in profiles table (handles deleted users)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    // User was deleted, clear session
    await supabase.auth.signOut()
    throw new Error('User not found')
  }
  
  // Get agency data
  const { data: agency } = await supabase
    .from('agencies')
    .select('id, business_name, phone, admin_contact_name, cities, postal_codes, onboarding_completed')
    .eq('owner_id', userId)
    .maybeSingle()

  if (!agency) {
    return { isComplete: false, nextStep: '/provider/onboarding/step-1' }
  }

  // Check if already marked as completed
  if (agency.onboarding_completed) {
    return { isComplete: true }
  }

  // Check basic required fields for Step 1
  const hasBasicInfo = agency.business_name && 
                      agency.phone && 
                      agency.admin_contact_name && 
                      agency.cities && 
                      agency.cities.length > 0 && 
                      agency.postal_codes && 
                      agency.postal_codes.length > 0

  if (!hasBasicInfo) {
    return { isComplete: false, nextStep: '/provider/onboarding/step-1' }
  }

  // Check if they have selected services (Step 2)
  const { data: services } = await supabase
    .from('agency_services')
    .select('service_id')
    .eq('agency_id', agency.id)
    .limit(1)

  if (!services || services.length === 0) {
    return { isComplete: false, nextStep: '/provider/onboarding/step-2' }
  }

  // Check if they have allocated star points (Step 3)
  const { data: strengths } = await supabase
    .from('agency_service_strengths')
    .select('points')
    .eq('agency_id', agency.id)
    .limit(1)

  if (!strengths || strengths.length === 0) {
    return { isComplete: false, nextStep: '/provider/onboarding/step-3' }
  }

  // Check if they have set rates (Step 4)
  const { data: rates } = await supabase
    .from('agency_service_rates')
    .select('min_amount, max_amount')
    .eq('agency_id', agency.id)
    .limit(1)

  if (!rates || rates.length === 0) {
    return { isComplete: false, nextStep: '/provider/onboarding/step-4' }
  }

  // Check if they have uploaded at least one document (Step 5)
  const { data: docs } = await supabase.storage
    .from('agency-docs')
    .list(`agency-${agency.id}/`, { limit: 1 })

  if (!docs || docs.length === 0) {
    return { isComplete: false, nextStep: '/provider/onboarding/step-5' }
  }

  // All steps completed - mark as complete
  await supabase
    .from('agencies')
    .update({ onboarding_completed: true })
    .eq('id', agency.id)

  return { isComplete: true }
}

export async function markOnboardingStepComplete(userId: string, step: number) {
  const supabase = await createClient()
  
  // Get agency ID
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (!agency) return

  // For now, we don't mark individual steps as complete
  // We only mark the entire onboarding as complete when all steps are done
  // This is handled in the checkOnboardingCompletion function
}
