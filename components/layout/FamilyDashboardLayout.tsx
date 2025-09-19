"use client";

import { ReactNode } from "react";
import FamilyNavigation from "./FamilyNavigation";
import { FamilySignOutButton } from "@/components/family/FamilySignOutButton";

interface FamilyDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showWelcome?: boolean;
  userName?: string;
}

export default function FamilyDashboardLayout({ 
  children, 
  title,
  showWelcome = true,
  userName
}: FamilyDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <FamilyNavigation />
      
      {/* Welcome Header - Desktop Only */}
      {showWelcome && (
        <header className="hidden md:block bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              <div className="flex items-center">
                {title && (
                  <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {userName && (
                  <span className="text-sm text-gray-600">
                    Welcome, {userName}
                  </span>
                )}
                <FamilySignOutButton />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showWelcome ? 'md:py-8' : 'py-8'} ${showWelcome ? 'pb-20 md:pb-8' : 'pb-20 md:pb-8'}`}>
        {children}
      </main>
    </div>
  );
}
