"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Paperclip, Send, Archive, Loader2 } from "lucide-react";
import { StreamChat } from 'stream-chat';
import { Chat, Channel, ChannelList, MessageList, MessageInput, ChannelHeader, Thread, Window } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

// Types for our data
interface ChannelData {
  id: string;
  streamChannelId: string;
  name: string;
  channelName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
  agencyId: string;
  agencyEmail: string;
  agencyPhone: string;
  isActive: boolean;
  createdAt: string;
  lastMessageAt: string | null;
  messageCount: number;
}

export default function FamilyMessagesClient() {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);

  // Fetch channels on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/chat/channels');
        
        if (!response.ok) {
          throw new Error('Failed to fetch channels');
        }
        
        const data = await response.json();
        setChannels(data.channels || []);
        
        // Set first channel as selected if available
        if (data.channels && data.channels.length > 0) {
          setSelectedChannel(data.channels[0]);
        }
      } catch (err) {
        console.error('Error fetching channels:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Initialize StreamChat client
  useEffect(() => {
    const initStreamChat = async () => {
      try {
        const response = await fetch('/api/chat/family-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to get StreamChat token');
        }

        const { token, userId } = await response.json();
        
        const streamClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
        await streamClient.connectUser({ id: userId }, token);
        
        setClient(streamClient);
      } catch (err) {
        console.error('Error initializing StreamChat:', err);
        setError('Failed to initialize chat');
      }
    };

    initStreamChat();

    // Cleanup on unmount
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, []);

  // Set up channel when selected channel changes
  useEffect(() => {
    if (client && selectedChannel) {
      const channelInstance = client.channel('messaging', selectedChannel.streamChannelId);
      setChannel(channelInstance);
    }
  }, [client, selectedChannel]);

  const handleChannelSelect = (channelData: ChannelData) => {
    setSelectedChannel(channelData);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#71A37A]" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (channels.length === 0) {
    return (
      <div className="h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No invitation messages yet</p>
            <p className="text-sm text-gray-500">Send invitations to agencies from the dashboard to start conversations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Invitation Messages</h1>
        <p className="text-sm text-gray-600">Direct conversations with agencies</p>
      </div>
      
      <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left Sidebar - Messages List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Invitations</h2>
            <p className="text-sm text-gray-500">{channels.length} conversation{channels.length !== 1 ? 's' : ''}</p>
          </div>
          
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {channels.map((channelData) => (
              <div
                key={channelData.id}
                onClick={() => handleChannelSelect(channelData)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChannel?.id === channelData.id
                    ? "bg-[#71A37A] text-white" 
                    : "bg-[#F0F9F2] hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0">
                    <img 
                      src={channelData.avatar} 
                      alt={channelData.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium truncate ${
                        selectedChannel?.id === channelData.id ? "text-white" : "text-gray-900"
                      }`}>
                        {channelData.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${
                          selectedChannel?.id === channelData.id ? "text-white/80" : "text-gray-500"
                        }`}>
                          {channelData.timestamp}
                        </span>
                        <Archive className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <p className={`text-sm truncate mt-1 ${
                      selectedChannel?.id === channelData.id ? "text-white/80" : "text-gray-600"
                    }`}>
                      {channelData.lastMessage}
                    </p>
                  </div>
                  
                  {/* Unread Badge */}
                  {channelData.unreadCount > 0 && (
                    <div className="flex-shrink-0">
                      <Badge className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {channelData.unreadCount}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Active Conversation */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedChannel && client && channel ? (
            <Chat client={client} theme="str-chat__theme-light">
              <Channel channel={channel}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            </Chat>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Select a conversation to start messaging</p>
                <p className="text-sm text-gray-500">Choose an agency from the list to view your conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


