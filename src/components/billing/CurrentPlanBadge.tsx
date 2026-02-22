"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BillingStatus {
  plan: "FREE" | "CREATOR" | "AXIS";
  status: string;
}

const PLAN_META = {
  FREE: { label: "Free", color: "text-gray-400 border-gray-600" },
  CREATOR: { label: "Creator", color: "text-violet-400 border-violet-500" },
  AXIS: { label: "Axis", color: "text-amber-400 border-amber-500" },
};

export function CurrentPlanBadge() {
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStatus({ plan: data.plan, status: data.status });
      })
      .catch(() => {});
  }, []);

  if (!status) return null;

  const meta = PLAN_META[status.plan] ?? PLAN_META.FREE;

  return (
    <Link
      href="/billing"
      className={`hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${meta.color} hover:opacity-80 transition-opacity`}
    >
      {meta.label}
    </Link>
  );
}
