"use client";

import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({ isVisible, message = "Processing...", subMessage }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="relative">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-green-100 rounded-full"></div>
          </div>
          
          {/* Main Message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {message}
            </h3>
            {subMessage && (
              <p className="text-sm text-gray-600">
                {subMessage}
              </p>
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
