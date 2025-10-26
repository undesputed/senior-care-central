import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StreamChat } from 'stream-chat';

const streamClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get family profile
    const { data: family } = await supabase
      .from('families')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single();

    if (!family) {
      return NextResponse.json({ error: 'Family profile not found' }, { status: 404 });
    }

    // Create family user ID for StreamChat
    const familyUserId = `family_${user.id}`;

    // Upsert family user in StreamChat
    await streamClient.upsertUser({
      id: familyUserId,
      name: family.full_name || 'Family'
    });

    // Generate Stream token
    const token = streamClient.createToken(familyUserId);

    return NextResponse.json({ 
      token,
      userId: familyUserId,
      userName: family.full_name || 'Family'
    });

  } catch (error) {
    console.error('Error generating family token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
