import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart, Trend, percentChange } from "@/components/charts";
import { Icon } from "@/components/icons";
import { RiskMatrix } from "@/components/risk-matrix";
import { StatusBadge } from "@/components/status";
import { Alert, Card, CardHeader, PageHeader, buttonStyles } from "@/components/ui";
import { getAccountContext } from "@/lib/auth/dal";
import { getSites, getTopicStates, listPeriods, listRisks, loadSeries, periodLabel } from "@/lib/data";
import { FIELD_BY_KEY, isNumeric } from "@/lib/gri/catalog";
import { overallCompleteness } from "@/lib/gri/engine";
import { riskLevel, riskScore } from "@/lib/gri/risks";
import { TOPICS, TOPIC_CATEGORIES, type TopicCategory } from "@/lib/gri/topics";
import { formatMeasure } from "@/lib/gri/units";
import { can } from "@/lib/permissions";

const HIGHLIGHTS = [
  { key: "energy_total", label: "Energy consumption", lower: true, href: "/dashboard/kpis/energy" },
  { key: "scope1_total", label: "Scope 1 emissions", lower: true, href: "/dashboard/kpis/emissions" },
  { key: "scope2_location", label: "Scope 2 emissions", lower: true, href: "/dashboard/kpis/emissions" },
  { key: "water_consumption", label: "Water consumption", lower: true, href: "/dashboard/kpis/water" },
  { key: "waste_generated", label: "Waste generated", lower: true, href: "/dashboard/kpis/waste" },
  { key: "emp_all_total", label: "Employees", lower: false, href: "/dashboard/kpis/workforce" },
];

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const { user, account } = await getAccountContext();
  if (!account) redirect("/dashboard/no-account");
  const { denied } = await props.searchParams;

  const topicStates = getTopicStates(account.id);
  const risks = listRisks(account.id);
  const counts = new Map<number, number>();
  for (const r of risks) {
    const s = riskScore(r.probability, r.impact);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const critical = risks.filter((r) => riskLevel(riskScore(r.probability, r.impact)) === "critical").length;

  const allSeries = loadSeries(account.id);
  // Headline figures and trends use approved periods only, so drafts don't skew comparisons.
  const series = allSeries.filter((s) => s.period.status === "approved");
  const latest = series.at(-1);
  const prev = series.at(-2);
  const periods = listPeriods(account.id).slice(0, 4);
  const sites = getSites(account.id);

  const ghg = series.map((s) => {
    const g = s.data.total();
    const v = [g("scope1_total"), g("scope2_location"), g("scope3_total")];
    return { label: periodLabel(s.period), value: v.some((x) => x !== null) ? v.reduce<number>((a, b) => a + (b ?? 0), 0) : null };
  });

  return (
    <>
      <PageHeader
        title="Main Dashboard"
        description={`${account.name}${account.industry ? ` · ${account.industry}` : ""} · ${sites.length} site${sites.length === 1 ? "" : "s"}`}
        actions={
          can(user.role, "periods:create") && (
            <Link href="/dashboard/reporting/new" className={buttonStyles.primary}>
              <Icon.plus className="h-4 w-4" /> New reporting period
            </Link>
          )
        }
      />
      {denied && (
        <div className="mb-6">
          <Alert tone="error">You don&apos;t have permission to open that page.</Alert>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Materiality" action={<Link href="/dashboard/materiality" aria-label="All material topics" className="rounded-lg bg-smoke p-2 text-teal-500 hover:bg-teal-50"><Icon.grid className="h-4 w-4" /></Link>} />
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {(Object.keys(TOPIC_CATEGORIES) as TopicCategory[]).map((c) => {
              const topics = TOPICS.filter((t) => t.category === c && (topicStates.get(t.key)?.isMaterial ?? true));
              return (
                <Link key={c} href={`/dashboard/materiality/category/${c}`} className="rounded-xl p-4 shadow-[0_2px_10px_rgba(40,55,57,0.08)] transition hover:shadow-[0_4px_14px_rgba(40,55,57,0.14)]">
                  <p className="text-xs text-ink-400">{TOPIC_CATEGORIES[c].title}</p>
                  <p className="mt-1 text-sm text-ink-500">{topics.length ? topics.map((t) => t.title).join(", ") : <span className="text-stone">No material topics</span>}</p>
                </Link>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Risks"
            action={<Link href="/dashboard/risks" aria-label="Risk matrix" className="rounded-lg bg-smoke p-2 text-teal-500 hover:bg-teal-50"><Icon.scale className="h-4 w-4" /></Link>}
          >
            {risks.length} risk{risks.length === 1 ? "" : "s"} registered{critical ? ` · ${critical} critical` : ""}
          </CardHeader>
          <div className="p-6 pt-4">
            <RiskMatrix counts={counts} compact />
          </div>
        </Card>
      </div>

      <h2 className="mt-8 mb-4 text-lg font-bold text-teal-500">ESG KPI&apos;s {latest && <span className="text-sm font-normal text-ink-400">· {latest.period.title} (latest approved)</span>}</h2>
      {latest ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {HIGHLIGHTS.map((h) => {
            const f = FIELD_BY_KEY.get(h.key)!;
            const v = latest.data.total()(h.key);
            const pv = prev?.data.total()(h.key);
            return (
              <Link key={h.key} href={h.href}>
                <Card className="h-full p-5 transition hover:shadow-[0_4px_16px_rgba(40,55,57,0.12)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone">{h.label}</p>
                  <p className="mt-2 font-display text-2xl font-bold text-ink-500">{isNumeric(f) ? formatMeasure(v, f.dimension) : "—"}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
                    <Trend change={percentChange(v, pv)} lowerIsBetter={h.lower} />
                    {prev && <span>vs {periodLabel(prev.period)}</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-ink-400">No approved reporting period yet. Headline KPIs appear here once a period is approved.</Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="GHG emissions">Scope 1 + 2 (location-based) + 3, tCO₂e, approved reporting periods</CardHeader>
          <div className="p-6">
            {ghg.some((d) => d.value !== null) ? (
              <BarChart data={ghg} dimension="emissions" label="Total GHG emissions by reporting period" />
            ) : (
              <p className="py-10 text-center text-sm text-ink-400">No emissions data yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Reporting" action={<Link href="/dashboard/reporting" className="text-sm font-semibold text-teal-500">All →</Link>} />
          <ul className="divide-y divide-teal-50 px-2 pb-3 pt-2">
            {periods.map((p) => {
              const s = allSeries.find((x) => x.period.id === p.id);
              const c = s ? overallCompleteness(s.data, sites) : null;
              return (
                <li key={p.id}>
                  <Link href={`/dashboard/reporting/${p.id}`} className="block rounded-lg px-4 py-3 hover:bg-cream">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink-500">{p.title}</span>
                      <span className="text-xs text-ink-400">{c?.pct ?? 0}% complete</span>
                    </div>
                    <div className="mt-1"><StatusBadge status={p.status} /></div>
                  </Link>
                </li>
              );
            })}
            {periods.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-400">No periods yet.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
