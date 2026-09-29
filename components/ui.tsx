import Link from "next/link";
import { cn } from "@/lib/utils";

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-ink-500 shadow-sm hover:bg-teal-50 disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-400 hover:bg-teal-50 hover:text-ink-500",
};

export const pillInputStyles =
  "block w-full rounded-full border-0 bg-teal-50/70 px-4 py-2 text-sm text-ink-500 placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-lime-500/40";

export const inputStyles =
  "block w-full rounded-lg border border-teal-100 bg-white px-3 py-2 text-sm text-ink-500 shadow-sm placeholder:text-stone focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0 rounded-2xl bg-white shadow-[0_2px_12px_rgba(40,55,57,0.06)]", className)}>
      {children}
    </div>
  );
}

const badgeTones = {
  slate: "bg-smoke text-ink-400 ring-ink-100",
  green: "bg-lime-100 text-lime-800 ring-lime-300",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-ice text-teal-600 ring-teal-200",
  purple: "bg-teal-500 text-white ring-teal-500",
  red: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({
  tone = "slate",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  errors,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-500">
        {label}
      </label>
      {children}
      {hint && !errors?.length && <p className="text-xs text-ink-400">{hint}</p>}
      {errors?.map((e) => (
        <p key={e} className="text-xs text-red-600">
          {e}
        </p>
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  crumbs,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  crumbs?: { href?: string; label: string }[];
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-xs font-semibold text-stone">
          <span>Pages</span>
          {(crumbs ?? []).map((c, i) => (
            <span key={i}>
              {" / "}
              {c.href ? <Link href={c.href} className="hover:text-teal-500">{c.label}</Link> : c.label}
            </span>
          ))}
          {" / "}
          <span className="text-ink-400">{title}</span>
        </nav>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-teal-500 sm:text-3xl">{title}</h1>
        {description && <div className="mt-1 text-sm text-ink-400">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-lime-300 bg-pale-lime text-teal-700",
    info: "border-teal-200 bg-ice text-teal-700",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border px-4 py-3 text-sm", styles[tone])}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, children }: { title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5">
      <div>
        <h2 className="text-lg font-bold text-teal-500">{title}</h2>
        {children && <div className="mt-0.5 text-xs text-ink-400">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function LinkPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm text-ink-500 shadow-[0_2px_10px_rgba(40,55,57,0.08)] transition hover:text-teal-500 hover:shadow-[0_4px_14px_rgba(40,55,57,0.12)]"
    >
      <span>{children}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
    </Link>
  );
}

export const tableHead = "bg-teal-500 text-left text-xs font-semibold text-white";
