export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Legal entity behind the ESGCounts brand. Use for copyright, legal and contract text. */
export const COMPANY_LEGAL_NAME = "ESG COUNTS UAB";
export const CONTACT_EMAIL = "info@esgcounts.eu";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgcounts.eu";
