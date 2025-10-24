"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function StarRating({ 
  value, 
  onChange, 
  max = 5, 
  size = "md", 
  disabled = false 
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;
        
        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className={cn(
              "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded-sm",
              disabled && "cursor-not-allowed opacity-50"
            )}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled 
                  ? "fill-[#71A37A] text-[#71A37A]" 
                  : "text-gray-300 hover:text-[#71A37A]"
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">
        {value} / {max}
      </span>
    </div>
  );
}
