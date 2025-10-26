import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Fetch invitation channels (care_match_id IS NULL) with agency details
    const { data: channels, error } = await supabase
      .from('chat_channels')
      .select(`
        id,
        stream_channel_id,
        channel_name,
        agency_initiated,
        last_message_at,
        message_count,
        created_at,
        agencies!inner(
          id,
          business_name,
          logo_url,
          email,
          phone
        )
      `)
      .eq('family_user_id', user.id)
      .is('care_match_id', null) // Only invitation channels
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching channels:', error);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }

    // Transform the data for the frontend
    const transformedChannels = channels?.map(channel => ({
      id: channel.id,
      streamChannelId: channel.stream_channel_id,
      name: channel.agencies.business_name || 'Agency',
      channelName: channel.channel_name,
      lastMessage: channel.last_message_at ? 'Last message' : 'No messages yet',
      timestamp: channel.last_message_at 
        ? new Date(channel.last_message_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        : new Date(channel.created_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
      unreadCount: 0, // TODO: Implement unread count logic
      avatar: channel.agencies.logo_url || '/api/placeholder/40/40',
      agencyId: channel.agencies.id,
      agencyEmail: channel.agencies.email,
      agencyPhone: channel.agencies.phone,
      isActive: false, // Will be set by frontend
      createdAt: channel.created_at,
      lastMessageAt: channel.last_message_at,
      messageCount: channel.message_count || 0
    })) || [];

    return NextResponse.json({ 
      channels: transformedChannels,
      total: transformedChannels.length 
    });

  } catch (error) {
    console.error('Error in channels API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
