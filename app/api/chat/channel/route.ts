import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StreamChat } from 'stream-chat';

const streamClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const { careMatchId, agencyId, familyUserId, familyName } = await request.json();

    if (!careMatchId || !agencyId || !familyUserId || !familyName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check environment variables
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.error('Stream API credentials not found:', { apiKey: !!apiKey, apiSecret: !!apiSecret });
      return NextResponse.json({ error: 'Stream API credentials not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    
    // Check if channel already exists
    const { data: existingChannel } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('care_match_id', careMatchId)
      .single();

    if (existingChannel) {
      // Return existing channel
      return NextResponse.json({ 
        channelId: existingChannel.stream_channel_id,
        exists: true 
      });
    }

    // Create new channel in StreamChat
    const channelId = `ag_${agencyId.slice(-8)}_fam_${familyUserId.slice(-8)}`;
    
    // Upsert family user in StreamChat
    await streamClient.upsertUser({
      id: `family_${familyUserId}`,
      name: familyName,
      role: 'family'
    });

    // Create channel
    const channel = streamClient.channel('messaging', channelId, {
      name: `Chat with ${familyName}`,
      members: [`agency_${agencyId}`, `family_${familyUserId}`],
      agency_initiated: true
    });

    await channel.create();

    // Store channel details in database
    const { data: newChannel, error } = await supabase
      .from('chat_channels')
      .insert({
        care_match_id: careMatchId,
        stream_channel_id: channelId,
        agency_id: agencyId,
        family_user_id: familyUserId,
        channel_name: `Chat with ${familyName}`,
        agency_initiated: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing channel:', error);
      return NextResponse.json({ error: 'Failed to store channel' }, { status: 500 });
    }

    return NextResponse.json({ 
      channelId,
      exists: false,
      channel: newChannel
    });

  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const careMatchId = searchParams.get('careMatchId');

    if (!careMatchId) {
      return NextResponse.json({ error: 'Missing careMatchId' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: channel, error } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('care_match_id', careMatchId)
      .single();

    if (error || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ channel });

  } catch (error) {
    console.error('Error fetching channel:', error);
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
}
