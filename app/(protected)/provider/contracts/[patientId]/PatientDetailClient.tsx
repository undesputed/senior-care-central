"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Paperclip, Send, User, Mail, Phone, Calendar, Heart, Bell, Leaf } from "lucide-react";
import Link from "next/link";
import { StreamChat } from 'stream-chat';
import { Chat, Channel, Window, MessageList, MessageInput, ChannelList } from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

interface Patient {
  id: string;
  full_name: string;
  age: number;
  relationship: string;
  care_level: string;
  medical_conditions: string[];
  care_needs: string[];
  status: string;
  notes: string;
  created_at: string;
  families: {
    id: string;
    full_name: string;
    phone_number: string;
    user_id: string;
  };
}

interface CareMatch {
  id: string;
  score: number;
  created_at: string;
}

interface PatientDetailClientProps {
  patient: Patient;
  match: CareMatch;
  agencyId: string;
}

export default function PatientDetailClient({ patient, match, agencyId }: PatientDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('client-profile');
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Initialize Stream Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        // Get Stream token for the agency
        const tokenResponse = await fetch('/api/chat/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: `agency_${agencyId}`,
            userType: 'agency'
          })
        });

        if (!tokenResponse.ok) {
          console.error('Failed to get Stream token');
          return;
        }

        const { token } = await tokenResponse.json();
        
        // Initialize Stream Chat client
        const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
        await client.connectUser(
          {
            id: `agency_${agencyId}`,
            name: 'Agency',
            role: 'agency'
          },
          token
        );

        setChatClient(client);

        // Ensure channel (and family user) server-side, then connect to it client-side
        const ensureResp = await fetch('/api/chat/channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            careMatchId: match.id,
            agencyId,
            familyUserId: patient.families.user_id,
            familyName: patient.families.full_name
          })
        });

        if (!ensureResp.ok) {
          throw new Error('Failed to ensure chat channel');
        }

        const { channelId } = await ensureResp.json();

        const channel = client.channel('messaging', channelId);
        await channel.watch();
        setChannel(channel);
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Cleanup on unmount
    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [agencyId, patient.families.user_id, patient.families.full_name]);

  const handleBack = () => {
    router.push('/provider/contracts');
  };

  const handleCreateContract = () => {
    router.push(`/provider/contracts/${patient.id}/create`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invited':
        return 'bg-yellow-500 text-white';
      case 'engaged':
        return 'bg-teal-500 text-white';
      case 'negotiating':
        return 'bg-blue-500 text-white';
      case 'confirmed':
        return 'bg-green-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const tabs = [
    { id: 'client-profile', label: 'Client Profile' },
    { id: 'recipient-profile', label: 'Recipient Profile' },
    { id: 'care-needs', label: 'Care Needs' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/provider/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-green-800">Senior Care Central</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/provider/dashboard"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/provider/contracts"
                className="px-3 py-2 text-sm font-medium text-green-600 border-b-2 border-green-600"
              >
                Contracts
              </Link>
              <Link
                href="/provider/messages"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Messages
              </Link>
              <Link
                href="/provider/invoices"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Invoices
              </Link>
              <Link
                href="/provider/profile"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Profile
              </Link>
            </div>

            {/* Notification Bell */}
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Patient Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-6 p-0 h-auto text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to contracts
            </Button>

            {/* Patient Summary */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-10 h-10 text-green-600" />
                </div>
                <Badge className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-medium ${getStatusColor('invited')}`}>
                  INVITED
                </Badge>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{patient.full_name}</h1>
                <p className="text-sm text-gray-600">
                  Posted: {formatDate(patient.created_at)}
                </p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(match.score)}% match
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === 'client-profile' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Name</p>
                      <p className="text-gray-600">{patient.families.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Relationship to Patient</p>
                      <p className="text-gray-600">{patient.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">john.miller@email.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">{patient.families.phone_number || '(555) 123-4567'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium">Preferred Communication</p>
                      <p className="text-gray-600">In-app chat</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recipient-profile' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Patient Name</p>
                      <p className="text-gray-600">{patient.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Age</p>
                      <p className="text-gray-600">{patient.age} years old</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Care Level</p>
                      <p className="text-gray-600 capitalize">{patient.care_level}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-gray-600 capitalize">{patient.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'care-needs' && (
                <div className="space-y-4">
                  {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Medical Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.medical_conditions.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.care_needs && patient.care_needs.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Care Needs</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.care_needs.map((need, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.notes && (
                    <div>
                      <p className="font-medium mb-2">Notes</p>
                      <p className="text-gray-600 text-sm">{patient.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Messaging */}
        <div className="bg-green-50 rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Create Contract Button */}
            <div className="mb-6">
              <Button
                onClick={handleCreateContract}
                className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              >
                CREATE CONTRACT
              </Button>
            </div>

            {/* Messaging Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Send Message to Client to Negotiate Terms
              </h3>
            </div>

            {/* Chat Interface */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading chat...</p>
              </div>
            ) : chatClient && channel ? (
              <div className="h-96">
                <Chat client={chatClient}>
                  <Channel channel={channel}>
                    <Window>
                      <MessageList />
                      <MessageInput />
                    </Window>
                  </Channel>
                </Chat>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Chat not available</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
