"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, MessageCircle, User, Users, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/family/dashboard', icon: Home },
  { name: 'Patient', href: '/family/patients', icon: Users },
  { name: 'Contract', href: '/family/contracts', icon: FileText },
  { name: 'Message', href: '/family/messages', icon: MessageCircle },
  { name: 'Profile', href: '/family/profile', icon: User },
];

export default function FamilyNavigation() {
  const pathname = usePathname();
  const supabase = createClient();
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, is_read')
        .eq('role','family')
        .order('created_at', { ascending: false });
      const rows = (data || []) as any[];
      setUnread(rows.filter(r=>!r.is_read).length);
    };
    load();
  }, [supabase, pathname]);

  return (
    <>
      {/* Desktop Navigation - Top */}
      <nav className="hidden md:block bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/family/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-green-800">Senior Care Central</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side - notification bell */}
            <div className="relative">
              <Link href="/family/notifications" className="p-2 rounded hover:bg-gray-50">
                <Bell className="w-5 h-5 text-gray-700" />
                {unread>0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">{unread}</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1 transition-colors ${
                  isActive
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                <span className="text-xs font-medium truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
