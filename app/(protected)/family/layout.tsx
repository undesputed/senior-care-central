import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { protectRoute } from "@/lib/auth/role-based-routing";
import FamilyNavigation from "@/components/layout/FamilyNavigation";

export default async function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect this route for family users only
  const userInfo = await protectRoute(['family']);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation for all family pages */}
      <FamilyNavigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
