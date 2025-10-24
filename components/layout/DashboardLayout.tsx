"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ViewToggle from "./ViewToggle";

interface FilterTab {
  name: string;
  count: number;
  active?: boolean;
  hasNotification?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  filterTabs?: FilterTab[];
  onFilterChange?: (filterName: string) => void;
}

export default function DashboardLayout({ 
  children, 
  title, 
  showSearch = false, 
  showFilters = false, 
  showViewToggle = false,
  filterTabs = [],
  onFilterChange
}: DashboardLayoutProps) {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Home', href: '/provider/dashboard' },
    { name: 'Contracts', href: '/provider/contracts' },
    { name: 'Messages', href: '/provider/messages' },
    { name: 'Invoices', href: '/provider/invoices' },
    { name: 'Profile', href: '/provider/profile' },
  ];

  // Use provided filterTabs or default empty array
  const defaultFilterTabs = filterTabs.length > 0 ? filterTabs : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50" style={{ backgroundColor: '#71A37A' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/provider/dashboard" className="flex items-center space-x-3">
                {/* Custom Logo - Human figure with leaf-like shapes */}
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    {/* Human figure */}
                    <circle cx="12" cy="6" r="3" fill="white" />
                    <path d="M12 9c-2 0-4 1-4 3v2h8v-2c0-2-2-3-4-3z" fill="white" />
                    {/* Left leaf-like shape */}
                    <path d="M6 8c-1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z" fill="white" />
                    {/* Right leaf-like shape */}
                    <path d="M18 8c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2z" fill="white" />
                  </svg>
                </div>
                {/* Brand Name - Two lines */}
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-white leading-tight">Senior Care</span>
                  <span className="text-lg font-bold text-white leading-tight">Central</span>
                </div>
              </Link>
            </div>

            {/* Navigation Links and Notification Bell */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Notification Bell */}
              <Button variant="ghost" size="sm" className="relative p-2 hover:bg-white/10">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex justify-center">
          <h1 className="text-3xl font-bold text-gray-900 text-center">{title}</h1>
        </div>


        {/* Search Bar and View Toggle */}
        {(showSearch || showViewToggle) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            {/* Search Bar */}
            {showSearch && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search Client"
                  className="pl-10"
                />
              </div>
            )}
            
            {/* View Toggle */}
            {showViewToggle && <ViewToggle />}
          </div>
        )}

        {/* Filter Tabs */}
        {showFilters && defaultFilterTabs.length > 0 && (
          <div className="flex justify-center mb-6 w-full">
            <div 
              className="flex border border-gray-300 rounded-lg overflow-hidden shadow-sm"
              style={{
                width: '100%',
                height: '56px',
                borderWidth: '1px'
              }}
            >
              {defaultFilterTabs.map((tab, index) => (
                <button
                  key={tab.name}
                  className={`relative flex-1 text-sm font-medium transition-colors flex items-center justify-center ${
                    tab.active 
                      ? 'bg-[#71A37A] text-white' 
                      : 'bg-[#F9F9F9] text-gray-600 hover:bg-gray-50'
                  } ${
                    index === 0 ? 'rounded-l-lg' : ''
                  } ${
                    index === defaultFilterTabs.length - 1 ? 'rounded-r-lg' : ''
                  } ${
                    index > 0 ? 'border-l border-gray-300' : ''
                  }`}
                  style={{ height: '56px' }}
                  onClick={() => onFilterChange?.(tab.name)}
                >
                  <span className="flex items-center justify-center gap-2">
                    {tab.name} ({tab.count})
                    {tab.hasNotification && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {children}
        </div>
      </main>
    </div>
  );
}
