"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useOnboarding } from "./PatientOnboardingWizard";
import { LoadingButton } from "@/components/ui/loading-button";
import { toast } from "sonner";
import { MessageCircle, Send, SkipForward, FileText, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  detectedEntities?: Array<{ name: string; type: string; confidence: number }>;
  followUpQuestions?: string[];
}

export default function Step2AIChat() {
  const { state, goToNextStep, goToPreviousStep, dispatch } = useOnboarding();
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasProvidedInfo, setHasProvidedInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'ai',
        content: "Hello! I&apos;m here to help you describe your loved one&apos;s care needs. You can tell me about any medical conditions, symptoms, or concerns you have. I&apos;ll ask follow-up questions to make sure I understand everything needed to find the right care services.",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isAnalyzing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsAnalyzing(true);
    setHasProvidedInfo(true);

    try {
      const response = await fetch('/api/patient-onboarding/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMessage.content,
          sessionId: state.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze message');
      }

      const analysis = await response.json();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: analysis.followUpQuestions?.length > 0 
          ? analysis.followUpQuestions.join('\n\n')
          : "Thank you for providing that information. I have enough details to help you with care service recommendations. You can proceed to the next step to review my suggestions.",
        timestamp: new Date(),
        detectedEntities: analysis.detectedEntities as Array<{ name: string; type: string; confidence: number }>,
        followUpQuestions: analysis.followUpQuestions as string[],
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update context with AI analysis
      dispatch({
        type: 'SET_AI_ANALYSIS',
        payload: {
          detectedConditions: analysis.detectedEntities?.map((e: { name: string }) => e.name) || [],
          careNeeds: analysis.careNeeds?.map((n: { description: string }) => n.description) || [],
          suggestedServices: analysis.suggestedServices || [],
          confidenceScore: analysis.confidenceScore || 0.5,
          isComplete: analysis.isComplete || false,
        }
      });

    } catch (error) {
      console.error('Error analyzing message:', error);
      toast.error('Failed to analyze your message. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I&apos;m sorry, I encountered an error processing your message. Please try again or you can skip this step and proceed to manually select care services.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSkip = () => {
    toast.info("Skipped AI chat. You can manually select services in the next step.");
    goToNextStep();
  };

  const handleNext = async () => {
    if (!hasProvidedInfo) return;
    
    setIsAnalyzing(true);
    
    try {
      // Generate AI summary of the conversation
      const response = await fetch('/api/patient-onboarding/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          sessionId: state.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const summaryData = await response.json();
      
      // Update the AI analysis with the generated summary
      dispatch({
        type: 'SET_AI_ANALYSIS',
        payload: {
          detectedConditions: state.aiAnalysis?.detectedConditions || [],
          careNeeds: state.aiAnalysis?.careNeeds || [],
          suggestedServices: state.aiAnalysis?.suggestedServices || [],
          confidenceScore: state.aiAnalysis?.confidenceScore || 0.5,
          isComplete: state.aiAnalysis?.isComplete || false,
          patientSummary: summaryData.summary,
        }
      });

      toast.success("AI summary generated successfully!");
      goToNextStep();
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary. Proceeding without it.');
      goToNextStep();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageCircle className="w-6 h-6 mr-2 text-green-600" />
          AI-Assisted Care Assessment
        </CardTitle>
        <p className="text-gray-600">
          Describe your loved one's condition and care needs. I'll ask follow-up questions to help identify the best care services.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chat Messages */}
          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                    style={message.type === 'user' ? { backgroundColor: '#71A37A' } : {}}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'ai' && (
                        <Bot className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#71A37A' }} />
                      )}
                      {message.type === 'user' && (
                        <User className="w-4 h-4 mt-1 text-white flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.detectedEntities && message.detectedEntities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.detectedEntities.map((entity, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {entity.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4" style={{ color: '#71A37A' }} />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#71A37A' }}></div>
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0.1s', backgroundColor: '#71A37A' }}></div>
                        <div className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0.2s', backgroundColor: '#71A37A' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe any medical conditions, symptoms, or care concerns..."
                className="flex-1 min-h-[80px] resize-none"
                disabled={isAnalyzing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isAnalyzing}
                className="text-white px-4"
                style={{ backgroundColor: '#71A37A' }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>

      {/* Progress Indicator */}
      {hasProvidedInfo && (
        <div className="rounded-lg p-3" style={{ backgroundColor: '#f0f9f0', border: '1px solid #71A37A' }}>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#71A37A' }}></div>
            <p className="text-sm" style={{ color: '#2d5a2d' }}>
              Great! I've analyzed your information. You can continue the conversation or proceed to review my suggestions.
            </p>
          </div>
        </div>
      )}

          {/* Navigation Buttons */}
          <div className="flex flex-col items-center space-y-4 pt-6">
            <Button
              onClick={handleNext}
              disabled={!hasProvidedInfo || isAnalyzing}
              className="text-white font-medium flex items-center justify-center hover:opacity-90"
              style={{ 
                backgroundColor: '#71A37A',
                width: '358px',
                height: '54px',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              {isAnalyzing ? 'Generating Summary...' : 'NEXT →'}
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="border-gray-300"
                style={{ width: '175px' }}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip This Step
              </Button>
              <Button
                type="button"
                className="text-white font-medium flex items-center justify-center hover:opacity-90"
                style={{ 
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  width: '175px',
                  height: '54px',
                  borderRadius: '8px',
                  padding: '16px'
                }}
                onClick={goToPreviousStep}
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}