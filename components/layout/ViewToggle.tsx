"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";

interface ViewToggleProps {
  initialView?: 'grid' | 'list';
  onViewChange?: (view: 'grid' | 'list') => void;
}

export default function ViewToggle({ initialView = 'grid', onViewChange }: ViewToggleProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialView);

  const handleViewChange = (view: 'grid' | 'list') => {
    setViewMode(view);
    onViewChange?.(view);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleViewChange('grid')}
        className={viewMode === 'grid' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        <Grid className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleViewChange('list')}
        className={viewMode === 'list' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
}
