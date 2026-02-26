export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    awaiting_payment: "Awaiting Payment",
    paid_awaiting_upload: "Awaiting Upload",
    submitted_in_review: "In Review",
    ai_generated_pending_admin: "AI Generated — Admin Review",
    admin_editing: "Admin Editing",
    delivered: "Delivered",
    revision_requested: "Revision Requested",
    refunded: "Refunded",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

export const ACADEMIC_FIELDS = [
  "Biology",
  "Chemistry",
  "Computer Science",
  "Economics",
  "Education",
  "Engineering",
  "Environmental Science",
  "History",
  "Law",
  "Linguistics",
  "Mathematics",
  "Medicine & Health Sciences",
  "Neuroscience",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Public Health",
  "Sociology",
  "Other",
] as const;

export type AcademicField = (typeof ACADEMIC_FIELDS)[number];
