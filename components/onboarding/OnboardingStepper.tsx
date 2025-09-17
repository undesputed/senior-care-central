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
    <nav className="mb-4 flex flex-wrap items-center gap-2">
      {steps.map((s) => {
        const isCurrent = current === s.idx;
        const isFuture = current < s.idx;
        const base = isCurrent ? "bg-[#9bc3a2] text-white" : isFuture ? "bg-[#d1eee4]" : "bg-[#bdd8c0]";
        return (
          <Link
            key={s.href}
            href={isFuture ? pathname ?? s.href : s.href}
            aria-current={isCurrent ? "step" : undefined}
            className={`rounded-full px-3 py-1 text-sm ${base}`}
            onClick={(e) => {
              if (isFuture) e.preventDefault();
            }}
          >
            {s.idx}. {s.label}
          </Link>
        );
      })}
    </nav>
  );
}


