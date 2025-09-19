import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { protectRoute } from "@/lib/auth/role-based-routing";

export default async function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect this route for family users only
  const userInfo = await protectRoute(['family']);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
