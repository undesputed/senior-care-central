"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const steps = [
  { href: "/provider/onboarding/step-1", label: "Basic Info", idx: 1 },
  { href: "/provider/onboarding/step-2", label: "Services", idx: 2 },
  { href: "/provider/onboarding/step-3", label: "Star Points", idx: 3 },
  { href: "/provider/onboarding/step-4", label: "Rates", idx: 4 },
  { href: "/provider/onboarding/step-5", label: "Uploads", idx: 5 },
];

export default function OnboardingStepper() {
  const pathname = usePathname();
  const current = steps.findIndex((s) => pathname?.startsWith(s.href)) + 1;

  return (
    <nav className="mb-6">
      <div 
        className="flex items-center w-full"
        style={{
          height: '56px',
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        {steps.map((s, index) => {
          const isCurrent = current === s.idx;
          const isCompleted = current > s.idx;
          const isFuture = current < s.idx;
          
          // Determine border radius for each tab
          const getBorderRadius = () => {
            if (index === 0) {
              return isCurrent ? '8px 0px 0px 8px' : '0px';
            }
            if (index === steps.length - 1) {
              return '0px 8px 8px 0px';
            }
            return '0px';
          };

          const getTabStyles = () => {
            const tabWidth = `${100 / steps.length}%`;
            
            if (isCurrent || isCompleted) {
              return {
                width: tabWidth,
                height: '56px',
                background: '#71A37A',
                boxShadow: isCurrent ? '0px 14px 24px 0px #9BC3A24D' : 'none',
                borderRadius: getBorderRadius(),
                color: 'white',
                border: 'none',
                flex: '1'
              };
            } else {
              return {
                width: tabWidth,
                height: '56px',
                background: '#F9F9F9',
                border: '1px solid #E8E8E8',
                borderRadius: getBorderRadius(),
                color: '#666666',
                borderRight: index < steps.length - 1 ? 'none' : '1px solid #E8E8E8',
                flex: '1'
              };
            }
          };

          return (
            <Link
              key={s.href}
              href={isFuture ? pathname ?? s.href : s.href}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center justify-center text-sm font-medium transition-all duration-200 hover:opacity-80"
              style={getTabStyles()}
              onClick={(e) => {
                if (isFuture) e.preventDefault();
              }}
            >
              <span className="flex items-center gap-2">
                {isCompleted && !isCurrent && (
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M13.3333 4L6 11.3333L2.66667 8" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {s.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


