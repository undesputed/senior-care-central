import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { StreamChat } from 'stream-chat';

interface PatientRequirements {
  patientId: string;
  location: string;
  budget: number;
  services: Array<{
    serviceId: string;
    supportLevel: number;
  }>;
}

interface AgencyData {
  id: string;
  businessName: string;
  cities: string[];
  states: string[];
  serviceRatings: Array<{
    serviceId: string;
    stars: number;
  }>;
  serviceRates: Array<{
    serviceId: string;
    minAmount: number;
    maxAmount: number;
    pricingFormat: string;
  }>;
}

interface MatchResult {
  agencyId: string;
  score: number;
  breakdown: {
    location: boolean;
    budget: number;
    primaryCare: number;
    generalCare: number;
    addOns: number;
  };
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId, offset = 0, limit = 50 } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    // Verify patient belongs to current user
    const { data: patient } = await supabase
      .from('patients')
      .select(`
        id,
        full_name,
        family_id,
        families!inner(user_id)
      `)
      .eq('id', patientId)
      .eq('families.user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Get patient requirements
    const patientReqs = await getPatientRequirements(supabase, patientId);
    if (!patientReqs) {
      return NextResponse.json({ error: "Patient requirements not found" }, { status: 404 });
    }

    // Get agencies that haven't been matched yet (for pagination)
    const { data: existingMatches } = await supabase
      .from('care_matches')
      .select('agency_id')
      .eq('patient_id', patientId);

    const excludedAgencyIds = existingMatches?.map(m => m.agency_id) || [];

    // Get eligible agencies
    const agencies = await getEligibleAgencies(supabase, patientReqs, excludedAgencyIds, offset, limit);

    // Calculate matches
    const matches = await calculateMatches(supabase, patientReqs, agencies);

    // Store matches in database (upsert to handle duplicates)
    let matchesCreated = 0;
    if (matches.length > 0) {
      for (const match of matches) {
        const { data: upserted, error: upsertError } = await supabase
          .from('care_matches')
          .upsert({
            patient_id: patientId,
            agency_id: match.agencyId,
            score: match.score,
            breakdown: match.breakdown,
            tags: match.tags,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'patient_id,agency_id'
          })
          .select('id')
          .single();

        if (upsertError) {
          console.error('Error storing match:', upsertError);
          continue; // Skip this match but continue with others
        }

        // Create/Get chat channel via Stream SDK and persist channel id
        try {
          const careMatchId = upserted?.id;
          if (careMatchId) {
            // Skip if a channel already exists for this match
            const { data: existing } = await supabase
              .from('chat_channels')
              .select('stream_channel_id')
              .eq('care_match_id', careMatchId)
              .single();

            if (!existing) {
              const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
              const apiSecret = process.env.STREAM_API_SECRET;
              if (!apiKey || !apiSecret) {
                console.warn('Stream credentials missing, skipping channel creation');
              } else {
                const streamClient = StreamChat.getInstance(apiKey, apiSecret);
                const familyUserId = (Array.isArray((patient as any).families) ? (patient as any).families[0]?.user_id : (patient as any).families?.user_id) || user.id;
                const familyName = patient?.full_name || 'Family';

                // ensure family user exists in Stream
                await streamClient.upsertUser({ id: `family_${familyUserId}`, name: familyName, role: 'family' });

                // Build deterministic channel id
                const channelId = `ag_${String(match.agencyId).slice(-8)}_fam_${String(familyUserId).slice(-8)}`;

                const channel = streamClient.channel('messaging', channelId, {
                  name: `Chat with ${familyName}`,
                  members: [`agency_${match.agencyId}`, `family_${familyUserId}`],
                  agency_initiated: true,
                } as any);

                try {
                  await channel.create();
                } catch (err) {
                  // If already exists, proceed
                  // console.warn('Channel create error (may already exist):', err);
                }

                // Store chat channel and link to care_matches
                const { error: insertErr } = await supabase
                  .from('chat_channels')
                  .insert({
                    care_match_id: careMatchId,
                    stream_channel_id: channelId,
                    agency_id: match.agencyId,
                    family_user_id: familyUserId,
                    channel_name: `Chat with ${familyName}`,
                    agency_initiated: true,
                  });

                if (insertErr) {
                  console.warn('Failed to insert chat_channels row:', insertErr);
                }

                await supabase
                  .from('care_matches')
                  .update({ channel: channelId })
                  .eq('id', careMatchId);
              }
            }
          }
        } catch (e) {
          console.warn('Error creating chat channel for match (SDK):', e);
        }
        matchesCreated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      matchesCreated,
      totalMatches: matches.length,
      hasMore: agencies.length === limit
    });

  } catch (error) {
    console.error('Error in matching:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getPatientRequirements(supabase: any, patientId: string): Promise<PatientRequirements | null> {
  // Get patient location from basic info
  const { data: patient } = await supabase
    .from('patients')
    .select('id, city, state, zip_code')
    .eq('id', patientId)
    .single();

  if (!patient) return null;

  // Get care preferences
  const { data: preferences } = await supabase
    .from('patient_care_preferences')
    .select('budget_preferences, selected_services')
    .eq('patient_id', patientId)
    .single();

  if (!preferences) return null;

  // Parse selected services (handle jsonb or string)
  let services = [] as Array<{ serviceId: string; supportLevel: number }>;
  try {
    const rawSelected = preferences.selected_services;
    const selectedServices = Array.isArray(rawSelected)
      ? rawSelected
      : typeof rawSelected === 'string'
        ? JSON.parse(rawSelected)
        : Array.isArray(rawSelected?.data)
          ? rawSelected.data
          : [];

    services = selectedServices.map((service: any) => ({
      serviceId: mapServiceSlugToId(service.serviceId || service.slug || service.id),
      supportLevel: getSupportLevelFromLevel(service.level || service.supportLevel || 'substantial')
    }));
  } catch (error) {
    console.error('Error parsing selected services:', error);
    services = [];
  }

  // Use patient location or fallback
  const location = patient.city && patient.state 
    ? `${patient.city}, ${patient.state}` 
    : "Los Angeles, CA";

  return {
    patientId,
    location,
    budget: normalizeBudget(preferences.budget_preferences),
    services: services
  };
}

function getSupportLevelFromLevel(level: string): number {
  // Convert level string to numeric support level
  switch (level.toLowerCase()) {
    case 'minimal': return 1;
    case 'moderate': return 2;
    case 'substantial': return 3;
    case 'full': return 4;
    default: return 3; // Default to substantial care
  }
}

function mapServiceSlugToId(serviceSlug: string): string {
  // Map patient service slugs to database service slugs
  const serviceMapping: { [key: string]: string } = {
    'dementia-alzheimers-care': 'memory-care',
    'stroke-recovery-assistance': 'exercise-therapy',
    'mobility-assistance': 'mobility-assistance',
    'medication-management': 'medication-management',
    'bathing-dressing': 'bathing-dressing'
  };
  
  return serviceMapping[serviceSlug] || serviceSlug;
}

function normalizeBudget(raw: any): number {
  try {
    const budgetObj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const amount = Number(budgetObj?.amount || 0);
    return Number.isFinite(amount) ? amount : 0;
  } catch {
    return 0;
  }
}

async function getEligibleAgencies(
  supabase: any, 
  patientReqs: PatientRequirements, 
  excludedIds: string[], 
  offset: number, 
  limit: number
): Promise<AgencyData[]> {
  // Parse location for city/state matching
  const [city, state] = patientReqs.location.split(',').map(s => s.trim());

  let query = supabase
    .from('agencies')
    .select(`
      id,
      business_name,
      agency_service_areas(city, state),
      agency_service_strengths(service_id, points, services!inner(slug)),
      agency_service_rates(service_id, min_amount, max_amount, pricing_format, services!inner(slug))
    `)
    .eq('status', 'published')
    .not('id', 'in', `(${excludedIds.join(',')})`)
    .range(offset, offset + limit - 1);

  const { data: agencies, error } = await query;

  if (error) {
    console.error('Error fetching agencies:', error);
    return [];
  }

  // Filter by location
  const locationFiltered = agencies?.filter((agency: any) => 
    agency.agency_service_areas?.some((area: any) => 
      area.city === city && area.state === state
    )
  ) || [];

  return locationFiltered.map((agency: any) => ({
    id: agency.id,
    businessName: agency.business_name,
    cities: agency.agency_service_areas?.map((a: any) => a.city) || [],
    states: agency.agency_service_areas?.map((a: any) => a.state) || [],
    serviceRatings: agency.agency_service_strengths?.map((s: any) => ({
      serviceId: s.services?.slug || s.service_id,
      stars: s.points
    })) || [],
    serviceRates: agency.agency_service_rates?.map((r: any) => ({
      serviceId: r.services?.slug || r.service_id,
      minAmount: r.min_amount,
      maxAmount: r.max_amount,
      pricingFormat: r.pricing_format
    })) || []
  }));
}

async function calculateMatches(supabase: any, patientReqs: PatientRequirements, agencies: AgencyData[]): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];

  for (const agency of agencies) {
    const match = calculateAgencyMatch(patientReqs, agency);
    if (match.score > 0) { // Only store matches above threshold
      matches.push(match);
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

function calculateAgencyMatch(patientReqs: PatientRequirements, agency: AgencyData): MatchResult {
  const breakdown = {
    location: true, // Already filtered
    budget: 0,
    primaryCare: 0,
    generalCare: 0,
    addOns: 0
  };

  let totalScore = 0;
  const tags: string[] = [];

  // Criteria 2: Budget Compatibility (30 max)
  breakdown.budget = calculateBudgetScore(patientReqs.budget, agency.serviceRates);
  totalScore += breakdown.budget;

  if (breakdown.budget === 30) {
    tags.push("Good fit on budget");
  } else if (breakdown.budget >= 10 && breakdown.budget < 20) {
    tags.push("May require financial flexibility");
  }

  // Criteria 3: Primary Care Needs (40 max) - Support levels 4 & 3
  const primaryServices = patientReqs.services.filter(s => s.supportLevel >= 3);
  breakdown.primaryCare = calculatePrimaryCareScore(primaryServices, agency.serviceRatings);
  totalScore += breakdown.primaryCare;

  // Criteria 4: General Care Needs (20 max) - Support levels 2 & 1
  const generalServices = patientReqs.services.filter(s => s.supportLevel <= 2);
  breakdown.generalCare = calculateGeneralCareScore(generalServices, agency.serviceRatings);
  totalScore += breakdown.generalCare;

  // Criteria 5: Add-ons (10 max)
  breakdown.addOns = calculateAddOnScore(patientReqs, agency, breakdown);
  totalScore += breakdown.addOns;

  // Generate additional tags
  generateMatchTags(patientReqs, agency, breakdown, tags);

  return {
    agencyId: agency.id,
    score: Math.round(totalScore * 100) / 100,
    breakdown,
    tags
  };
}

function calculateBudgetScore(patientBudget: number, agencyRates: any[]): number {
  if (patientBudget === 0) return 30; // No budget set

  // Use average of min/max rates for monthly comparison
  const avgRate = agencyRates.reduce((sum, rate) => {
    if (rate.pricingFormat === 'monthly') {
      return sum + (rate.minAmount + rate.maxAmount) / 2;
    }
    return sum; // Skip hourly rates for now (MVP requirement)
  }, 0) / agencyRates.length;

  if (avgRate === 0) return 0;

  const overagePercent = ((avgRate - patientBudget) / patientBudget) * 100;

  if (overagePercent <= 0) return 30;
  if (overagePercent <= 10) return 25;
  if (overagePercent <= 20) return 20;
  if (overagePercent <= 30) return 15;
  return 0;
}

function calculatePrimaryCareScore(services: any[], agencyRatings: any[]): number {
  if (services.length === 0) return 0;

  const level4Services = services.filter(s => s.supportLevel === 4);
  const level3Services = services.filter(s => s.supportLevel === 3);

  const level4Avg = calculateServiceAverage(level4Services, agencyRatings);
  const level3Avg = calculateServiceAverage(level3Services, agencyRatings);

  const weightedScore = (level4Avg / 5) * 0.7 + (level3Avg / 5) * 0.3;
  return Math.round(weightedScore * 40 * 100) / 100;
}

function calculateGeneralCareScore(services: any[], agencyRatings: any[]): number {
  if (services.length === 0) return 0;

  const level2Services = services.filter(s => s.supportLevel === 2);
  const level1Services = services.filter(s => s.supportLevel === 1);

  const level2Avg = Math.min(calculateServiceAverage(level2Services, agencyRatings), 3);
  const level1Avg = Math.min(calculateServiceAverage(level1Services, agencyRatings), 3);

  const weightedScore = (level2Avg / 3) * 0.7 + (level1Avg / 3) * 0.3;
  return Math.round(weightedScore * 20 * 100) / 100;
}

function calculateServiceAverage(services: any[], agencyRatings: any[]): number {
  if (services.length === 0) return 0;

  const totalStars = services.reduce((sum, service) => {
    const rating = agencyRatings.find(r => r.serviceId === service.serviceId);
    return sum + (rating?.stars || 0.5); // Default 0.5 for unrated services
  }, 0);

  return totalStars / services.length;
}

function calculateAddOnScore(patientReqs: PatientRequirements, agency: AgencyData, breakdown: any): number {
  let score = 0;

  // Specialty Service Badge (+5): All services with support level ≥ 3 have 5-star ratings
  const primaryServices = patientReqs.services.filter(s => s.supportLevel >= 3);
  const allPrimaryHave5Stars = primaryServices.every(service => {
    const rating = agency.serviceRatings.find(r => r.serviceId === service.serviceId);
    return rating?.stars === 5;
  });

  if (allPrimaryHave5Stars && primaryServices.length > 0) {
    score += 5;
  }

  // Budget Fit Badge (+5): Full 30/30 budget score
  if (breakdown.budget === 30) {
    score += 5;
  }

  // Mobility Support Badge (+5): Mobility services with ≥4 stars and support ≥3
  const mobilityServices = ['mobility-assistance', 'transfer-assistance', 'bathing-dressing'];
  const hasMobilitySupport = mobilityServices.some(serviceSlug => {
    const service = patientReqs.services.find(s => s.serviceId === serviceSlug);
    if (!service || service.supportLevel < 3) return false;
    
    const rating = agency.serviceRatings.find(r => r.serviceId === serviceSlug);
    return (rating?.stars || 0) >= 4;
  });

  if (hasMobilitySupport) {
    score += 5;
  }

  return Math.min(score, 10); // Cap at 10
}

function generateMatchTags(patientReqs: PatientRequirements, agency: AgencyData, breakdown: any, tags: string[]): void {
  // Specialty Strength: Criteria 3 = 30/40 or any support level 3/4 has 5 stars
  if (breakdown.primaryCare >= 30) {
    tags.push("High focus on primary care");
  }

  // Service Gap: Missing required services
  const missingServices = patientReqs.services.filter(service => 
    !agency.serviceRatings.some(rating => rating.serviceId === service.serviceId)
  );

  if (missingServices.length > 0) {
    tags.push(`Missing ${missingServices.length} required service${missingServices.length > 1 ? 's' : ''}`);
  }

  // Care Match Need: Criteria 3 and 4 = 45/60 pts
  if (breakdown.primaryCare + breakdown.generalCare >= 45) {
    tags.push("Good support coverage");
  }
}
