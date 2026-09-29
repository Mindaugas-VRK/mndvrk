import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { AccountSwitcher } from "@/components/account-switcher";
import { AppSidebar, type NavSection } from "@/components/app-sidebar";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { getAccountContext } from "@/lib/auth/dal";
import { KPI_GROUPS, PILLARS, type PillarKey } from "@/lib/gri/catalog";
import { TOPIC_CATEGORIES, type TopicCategory } from "@/lib/gri/topics";
import { can, ROLE_LABELS } from "@/lib/permissions";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · ESGCounts" },
  robots: { index: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { user, account, accounts } = await getAccountContext();

  const sections: NavSection[] = [{ href: "/dashboard", label: "Dashboard", icon: "home", exact: true }];
  if (account) {
    sections.push(
      {
        href: "/dashboard/materiality",
        label: "Materiality",
        icon: "grid",
        children: [
          {
            href: "/dashboard/materiality",
            label: "Material topics",
            children: (Object.keys(TOPIC_CATEGORIES) as TopicCategory[]).map((c) => ({
              href: `/dashboard/materiality/category/${c}`,
              label: TOPIC_CATEGORIES[c].title,
            })),
          },
          { href: "/dashboard/materiality/assessment", label: "Materiality assessment" },
        ],
      },
      {
        href: "/dashboard/risks",
        label: "Risks",
        icon: "scale",
        children: [
          { href: "/dashboard/risks", label: "Risk matrix" },
          { href: "/dashboard/risks/key", label: "Key risks" },
        ],
      },
      {
        href: "/dashboard/kpis",
        label: "ESG KPI's",
        icon: "target",
        children: (Object.keys(PILLARS) as PillarKey[]).map((p) => ({
          href: `/dashboard/kpis/pillar/${p}`,
          label: PILLARS[p].title,
          children: KPI_GROUPS.filter((g) => g.pillar === p).map((g) => ({ href: `/dashboard/kpis/${g.key}`, label: g.title })),
        })),
      },
      {
        href: "/dashboard/reporting",
        label: "Reporting",
        icon: "bars",
        children: [
          { href: "/dashboard/reporting", label: "Reporting periods" },
          ...(can(user.role, "periods:create") ? [{ href: "/dashboard/reporting/new", label: "New period" }] : []),
        ],
      },
    );
  }
  const admin: NavSection[] = [];
  if (can(user.role, "accounts:manage")) admin.push({ href: "/dashboard/settings/accounts", label: "Accounts", icon: "building" });
  if (can(user.role, "users:manage")) admin.push({ href: "/dashboard/users", label: "Users", icon: "users" });
  if (can(user.role, "blog:manage")) {
    admin.push({ href: "/dashboard/blog", label: "Blog", icon: "pen" });
    admin.push({ href: "/dashboard/settings/linkedin", label: "LinkedIn", icon: "globe" });
  }

  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-smoke">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-teal-50 bg-white lg:flex">
        <div className="flex h-20 items-center border-b border-teal-50 px-8">
          <Logo href="/dashboard" className="h-8 w-auto" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <AppSidebar sections={sections} />
          {admin.length > 0 && (
            <>
              <p className="mt-8 mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone">Admin</p>
              <AppSidebar sections={admin} />
            </>
          )}
        </div>
        <div className="border-t border-teal-50 p-4 text-xs text-stone">
          <Link href="/" className="hover:text-teal-500">esgcounts.eu</Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-teal-50 bg-smoke/90 px-4 py-3 backdrop-blur sm:px-8">
          <div className="lg:hidden">
            <Logo href="/dashboard" className="h-7 w-auto" />
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full bg-white p-1.5 pl-2 shadow-sm">
            <AccountSwitcher accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} current={account?.id ?? null} />
            {account && (
              <form action="/dashboard/search" className="relative hidden md:block">
                <Icon.search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
                <input
                  name="q"
                  type="search"
                  placeholder="Search"
                  aria-label="Search KPIs, topics and risks"
                  className="w-52 rounded-full border-0 bg-smoke py-2 pl-9 pr-3 text-sm text-ink-500 placeholder:text-stone focus:ring-2 focus:ring-lime-500/40"
                />
              </form>
            )}
            <Link href="/dashboard/account" className="flex items-center gap-2 rounded-full pr-1" title={`${user.name} · ${ROLE_LABELS[user.role]}`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">{initials}</span>
            </Link>
            <form action={logout}>
              <button type="submit" className="rounded-full p-2 text-ink-300 hover:bg-smoke hover:text-teal-500" title="Sign out" aria-label="Sign out">
                <Icon.logout className="h-5 w-5" />
              </button>
            </form>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-teal-50 bg-white px-2 py-1 lg:hidden" aria-label="Main (mobile)">
          {[...sections, ...admin].map((s) => (
            <Link key={s.href} href={s.href} className="shrink-0 rounded-md px-3 py-2 text-sm text-ink-400 hover:text-teal-500">{s.label}</Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
