import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResultsTable } from "@/components/results-table";
import { PageHeader, buttonStyles } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getCustomFields, getPeriod, getSites, loadPeriodData } from "@/lib/data";
import { GROUP_BY_KEY, KPI_GROUPS, type Field } from "@/lib/gri/catalog";
import { LEVELS, LEVEL_LABELS, bucketsFor, customFieldToInput, type Level } from "@/lib/gri/engine";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage(props: PageProps<"/dashboard/reporting/[id]/results">) {
  const { account } = await requireAccount("data:view");
  const { id } = await props.params;
  const sp = await props.searchParams;
  const period = await getPeriod(Number(id), account.id);
  if (!period) notFound();
  const level = (LEVELS as readonly string[]).includes(String(sp.level)) ? (sp.level as Level) : "total";
  const groupKey = typeof sp.group === "string" && GROUP_BY_KEY.has(sp.group) ? sp.group : undefined;

  const sites = await getSites(account.id);
  const data = await loadPeriodData(period.id, account.id);
  const custom = await getCustomFields(account.id);
  const buckets = level === "total" ? bucketsFor("total", sites) : [...bucketsFor(level, sites), ...bucketsFor("total", sites)];
  const groups = groupKey ? [GROUP_BY_KEY.get(groupKey)!] : KPI_GROUPS;

  const q = (params: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    const merged = { level, group: groupKey, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) s.set(k, v);
    return `?${s}`;
  };

  return (
    <>
      <PageHeader
        title="Results"
        crumbs={[{ label: "Reporting", href: "/dashboard/reporting" }, { label: period.title, href: `/dashboard/reporting/${period.id}` }]}
        description="Rollups by hierarchy level. Σ rows are calculated from the inputs below them."
        actions={<a href={`/dashboard/reporting/${period.id}/export`} className={buttonStyles.secondary}>Export CSV</a>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone">Level</span>
        {LEVELS.map((l, i) => (
          <Link key={l} href={q({ level: l })} className={cn("rounded-full px-3 py-1.5 text-sm font-medium", l === level ? "bg-teal-500 text-white" : "bg-white text-ink-400 shadow-sm hover:text-teal-500")}>
            {i + 1}. {LEVEL_LABELS[l]}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone">KPI</span>
        <Link href={q({ group: undefined })} className={cn("rounded-full px-3 py-1.5 text-sm", !groupKey ? "bg-lime-500 font-semibold text-ink-500" : "bg-white text-ink-400 shadow-sm")}>All</Link>
        {KPI_GROUPS.map((g) => (
          <Link key={g.key} href={q({ group: g.key })} className={cn("rounded-full px-3 py-1.5 text-sm", groupKey === g.key ? "bg-lime-500 font-semibold text-ink-500" : "bg-white text-ink-400 shadow-sm")}>{g.title}</Link>
        ))}
      </div>
      <div className="space-y-8">
        {groups.map((g) => {
          const cf = custom.filter((c) => c.groupKey === g.key);
          const disclosures = [...g.disclosures, ...(cf.length ? [{ code: "Custom", title: "Custom KPIs", fields: cf.map(customFieldToInput) as Field[] }] : [])];
          return (
            <section key={g.key}>
              <h2 className="mb-3 text-lg font-bold text-teal-500">{g.title}</h2>
              <ResultsTable disclosures={disclosures} data={data} buckets={buckets} />
            </section>
          );
        })}
      </div>
    </>
  );
}
