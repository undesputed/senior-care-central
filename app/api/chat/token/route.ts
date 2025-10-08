import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StreamChat } from 'stream-chat';

const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await request.json();

    if (!userId || !userType) {
      return NextResponse.json({ error: 'Missing userId or userType' }, { status: 400 });
    }

    // Verify user exists in our database
    const supabase = await createClient();
    
    if (userType === 'agency') {
      const agencyId = userId.replace('agency_', '');
      const { data: agency } = await supabase
        .from('agencies')
        .select('id, business_name')
        .eq('id', agencyId)
        .single();

      if (!agency) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }
    } else if (userType === 'family') {
      const familyUserId = userId.replace('family_', '');
      const { data: family } = await supabase
        .from('families')
        .select('id, full_name')
        .eq('user_id', familyUserId)
        .single();

      if (!family) {
        return NextResponse.json({ error: 'Family not found' }, { status: 404 });
      }
    }

    // Generate Stream token
    const token = streamClient.createToken(userId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating Stream token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}