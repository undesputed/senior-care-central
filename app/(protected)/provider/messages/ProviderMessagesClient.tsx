"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Paperclip, Send, Archive } from "lucide-react";

// Mock data for demonstration
const mockMessages = [
  {
    id: "1",
    name: "Kathryn Lee",
    lastMessage: "She loves that.",
    timestamp: "05:49 pm",
    unreadCount: 2,
    avatar: "/api/placeholder/40/40",
    isActive: true
  },
  {
    id: "2", 
    name: "Leslie Alexander",
    lastMessage: "Lorem ipsum dolor",
    timestamp: "07:40 am",
    unreadCount: 0,
    avatar: "/api/placeholder/40/40",
    isActive: false
  },
  {
    id: "3",
    name: "Kathryn Murphy", 
    lastMessage: "No problem, I've prescribed 25mg Quetiapine. You can pick it up at...",
    timestamp: "01:34 pm",
    unreadCount: 0,
    avatar: "/api/placeholder/40/40",
    isActive: false
  },
  {
    id: "4",
    name: "Cameron Williamson",
    lastMessage: "Hi, I've been waiting for a response to my support ticket...",
    timestamp: "01:55 pm", 
    unreadCount: 1,
    avatar: "/api/placeholder/40/40",
    isActive: false
  },
  {
    id: "5",
    name: "Robert Johnson",
    lastMessage: "This is a med alert",
    timestamp: "06:42 am",
    unreadCount: 0,
    avatar: "/api/placeholder/40/40",
    isActive: false
  },
  {
    id: "6",
    name: "Sarah Wilson",
    lastMessage: "Message 3",
    timestamp: "02:02 am",
    unreadCount: 0,
    avatar: "/api/placeholder/40/40",
    isActive: false
  }
];

const mockChatMessages = [
  {
    id: "1",
    sender: "you",
    content: "Hi Mary, Mr. Johnson had his breakfast at 8:30 AM and took his morning medications on time.",
    timestamp: "9:03 AM",
    date: "Yesterday"
  },
  {
    id: "2", 
    sender: "client",
    content: "Great, thank you! Could you please remind him to drink more water through the day? He often forgets.",
    timestamp: "9:22 AM",
    date: "Yesterday"
  },
  {
    id: "3",
    sender: "you", 
    content: "Hi Mary, Mr. Johnson had his breakfast at 8:30 AM and took his morning medications on time.",
    timestamp: "9:23 AM",
    date: "Yesterday"
  },
  {
    id: "4",
    sender: "you",
    content: "Hello! Mrs. Lee is in a good mood today. She enjoyed her morning crossword puzzle and short walk.",
    timestamp: "9:12 AM",
    date: "Today"
  },
  {
    id: "5",
    sender: "client",
    content: "That's wonderful to hear. Could you try reading with her in the afternoon?",
    timestamp: "9:15 AM", 
    date: "Today"
  },
  {
    id: "6",
    sender: "client",
    content: "She loves that.",
    timestamp: "9:15 AM",
    date: "Today"
  }
];

export default function ProviderMessagesClient() {
  const [selectedMessage, setSelectedMessage] = useState(mockMessages[0]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="h-screen bg-gray-50">      
      <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left Sidebar - Messages List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          </div>
          
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  message.isActive 
                    ? "bg-[#71A37A] text-white" 
                    : "bg-[#F0F9F2] hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0">
                    <img 
                      src={message.avatar} 
                      alt={message.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium truncate ${
                        message.isActive ? "text-white" : "text-gray-900"
                      }`}>
                        {message.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${
                          message.isActive ? "text-white/80" : "text-gray-500"
                        }`}>
                          {message.timestamp}
                        </span>
                        <Archive className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <p className={`text-sm truncate mt-1 ${
                      message.isActive ? "text-white/80" : "text-gray-600"
                    }`}>
                      {message.lastMessage}
                    </p>
                  </div>
                  
                  {/* Unread Badge */}
                  {message.unreadCount > 0 && (
                    <div className="flex-shrink-0">
                      <Badge className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                        {message.unreadCount}
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
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg">
                <img 
                  src={selectedMessage.avatar} 
                  alt={selectedMessage.name}
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{selectedMessage.name}</h3>
                <p className="text-sm text-gray-500">Family Member</p>
              </div>
            </div>
            <Button 
              className="text-[#71A37A] hover:text-[#5a8a5a] bg-transparent hover:bg-gray-50"
              variant="ghost"
            >
              VIEW CONTRACT
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockChatMessages.map((message, index) => {
              const showDate = index === 0 || mockChatMessages[index - 1].date !== message.date;
              
              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <Badge className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs">
                        {message.date}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div className={`flex ${message.sender === 'you' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'you' 
                        ? 'bg-[#71A37A] text-white' 
                        : 'bg-[#F0F9F2] text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'you' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {message.sender === 'you' ? 'You' : 'Client'} {message.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Enter your message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#71A37A] focus:border-transparent"
              />
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleSendMessage}
                className="bg-[#71A37A] hover:bg-[#5a8a5a] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
