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

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showWelcome ? 'md:py-8' : 'py-8'} ${showWelcome ? 'pb-20 md:pb-8' : 'pb-20 md:pb-8'}`}>
        {children}
      </main>
    </div>
  );
}
