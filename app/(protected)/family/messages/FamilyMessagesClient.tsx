"use client";

import { useEffect, useState } from "react";
import {
  Chat,
  ChannelList,
  Channel,
  Window,
  MessageList,
  MessageInput,
  LoadingIndicator,
} from "stream-chat-react";
import { StreamChat, DefaultGenerics } from "stream-chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Paperclip, Send } from "lucide-react";

type TokenResponse = {
  apiKey: string;
  token: string;
  user: { id: string; name?: string; image?: string };
};

export default function FamilyMessagesClient() {
  const [client, setClient] = useState<StreamChat<DefaultGenerics> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        const res = await fetch("/api/chat/token", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to create chat token");
        const data: TokenResponse = await res.json();

        const chat = StreamChat.getInstance(data.apiKey);
        await chat.connectUser({ id: data.user.id, name: data.user.name, image: data.user.image }, data.token);

        if (!mounted) return;
        setClient(chat);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to initialize chat");
      }
    };
    setup();

    return () => {
      mounted = false;
      if (client) client.disconnectUser();
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-6 text-center text-sm text-red-600">{error}</Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingIndicator />
      </div>
    );
  }

  // Show only channels initiated by agencies: assume channel custom field agency_initiated = true
  const filters = { type: "messaging", agency_initiated: true, members: { $in: [client.userID!] } } as any;
  const sort = { last_message_at: -1 } as any;

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        {/* Left Sidebar - Messages List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          </div>
          
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto">
            <Chat client={client} theme="str-chat__theme-light">
              <ChannelList 
                filters={filters} 
                sort={sort} 
                options={{ state: true, watch: true }}
                showChannelSearch={false}
                additionalChannelListProps={{
                  className: "str-chat__channel-list-messaging",
                }}
              />
            </Chat>
          </div>
        </div>

        {/* Right Panel - Active Conversation */}
        <div className="flex-1 flex flex-col">
          <Chat client={client} theme="str-chat__theme-light">
            <Channel>
              <Window>
                {/* Custom Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-green-600 rounded"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Harmony House</h3>
                      <p className="text-sm text-gray-500">Care Provider</p>
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    VIEW CONTRACT
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <MessageList 
                    additionalMessageListProps={{
                      className: "str-chat__message-list-messaging",
                    }}
                  />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Enter your message"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <Button variant="ghost" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Window>
            </Channel>
          </Chat>
        </div>
      </div>
    </div>
  );
}


