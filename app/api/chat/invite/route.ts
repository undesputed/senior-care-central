import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StreamChat } from 'stream-chat';

const streamClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_API_KEY!,
  process.env.STREAM_API_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const { agencyId, familyUserId, familyName, agencyName } = await request.json();

    if (!agencyId || !familyUserId || !familyName || !agencyName) {
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
    
    // Check for existing INVITE channel only (care_match_id = null)
    const { data: existingInviteChannel } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('family_user_id', familyUserId)
      .is('care_match_id', null) // Invite channels have no care match
      .single();

    if (existingInviteChannel) {
      // Send message to existing invite channel
      const channel = streamClient.channel('messaging', existingInviteChannel.stream_channel_id);
      
      await channel.sendMessage({
        text: "Hello! I'm interested in your care services. I'd like to discuss how you can help with my family's care needs. Could we schedule a time to talk?",
        user_id: `family_${familyUserId}`,
        type: 'regular', // Use valid StreamChat message type
        metadata: { 
          context: 'invite_follow_up',
          channel_type: 'invitation'
        }
      });
      
      return NextResponse.json({ 
        channelId: existingInviteChannel.stream_channel_id,
        exists: true,
        message: 'Invitation sent to existing conversation'
      });
    }

    // Create new channel in StreamChat
    const channelId = `invite_ag_${agencyId.slice(-8)}_fam_${familyUserId.slice(-8)}`;
    
    // Upsert family user in StreamChat
    await streamClient.upsertUser({
      id: `family_${familyUserId}`,
      name: familyName
    });

    // Upsert agency user in StreamChat
    await streamClient.upsertUser({
      id: `agency_${agencyId}`,
      name: agencyName
    });

    // Create channel
    const channel = streamClient.channel('messaging', channelId, {
      name: `Invitation: ${familyName} → ${agencyName}`,
      members: [`agency_${agencyId}`, `family_${familyUserId}`],
      agency_initiated: false, // Family initiated this invitation
      channel_type: 'invitation',
      created_by_id: `family_${familyUserId}` // Required for server-side auth
    });

    await channel.create();

    // Send the initial invitation message with metadata
    const invitationMessage = `Hello! I'm interested in your care services. I'd like to discuss how you can help with my family's care needs. Could we schedule a time to talk?`;
    
    await channel.sendMessage({
      text: invitationMessage,
      user_id: `family_${familyUserId}`,
      type: 'regular', // Use valid StreamChat message type
      metadata: { 
        context: 'direct_invitation',
        channel_type: 'invitation'
      }
    });

    // Store channel details in database
    try {
      const { data: newChannel, error } = await supabase
        .from('chat_channels')
        .insert({
          care_match_id: null, // Invite channels have no care match
          stream_channel_id: channelId,
          agency_id: agencyId,
          family_user_id: familyUserId,
          channel_name: `Invitation: ${familyName} → ${agencyName}`,
          agency_initiated: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing channel:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        // Continue without storing in database for now
        console.warn('Continuing without database storage due to error');
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      console.warn('Continuing without database storage due to error');
    }

    // Create notification for agency (optional)
    try {
      await supabase
        .from('notifications')
        .insert({
          role: 'provider',
          agency_id: agencyId,
          title: 'New Care Invitation',
          body: `${familyName} has sent you a care invitation`,
          category: 'invitation',
          severity: 'info'
        });
    } catch (notificationError) {
      // Don't fail the whole request if notification fails
      console.warn('Failed to create notification:', notificationError);
    }

    return NextResponse.json({ 
      channelId,
      exists: false,
      message: 'Invitation sent successfully!'
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    return NextResponse.json({ 
      error: 'Failed to create invitation',
      details: error.message 
    }, { status: 500 });
  }
}
