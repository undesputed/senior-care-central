"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Leaf } from "lucide-react";
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search Client"
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Filter Tabs and View Toggle */}
        {(showFilters || showViewToggle) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            {/* Filter Tabs */}
            {showFilters && defaultFilterTabs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {defaultFilterTabs.map((tab) => (
                  <Button
                    key={tab.name}
                    variant={tab.active ? "default" : "outline"}
                    size="sm"
                    className={`relative ${
                      tab.active 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => onFilterChange?.(tab.name)}
                  >
                    {tab.name} ({tab.count})
                    {tab.hasNotification && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* View Toggle */}
            {showViewToggle && <ViewToggle />}
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
