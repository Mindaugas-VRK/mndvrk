import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart, Trend, percentChange } from "@/components/charts";
import { ProcedureForm, TargetForm } from "@/components/forms/kpi-forms";
import { ResultsTable } from "@/components/results-table";
import { SignoffCards } from "@/components/signoff-cards";
import { Card, CardHeader, PageHeader, buttonStyles } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getCustomFields, getKpiNote, getSignoffs, getSites, getTargets, loadSeries, periodLabel } from "@/lib/data";
import { FIELD_BY_KEY, GROUP_BY_KEY, PILLARS, isNumeric } from "@/lib/gri/catalog";
import { bucketsFor, customFieldToInput } from "@/lib/gri/engine";
import { DIMENSIONS } from "@/lib/gri/units";
import { renderMarkdown } from "@/lib/markdown";
import { can } from "@/lib/permissions";

export async function generateMetadata(props: PageProps<"/dashboard/kpis/[group]">): Promise<Metadata> {
  const { group } = await props.params;
  return { title: GROUP_BY_KEY.get(group)?.title ?? "KPI" };
}

export default async function KpiPage(props: PageProps<"/dashboard/kpis/[group]">) {
  const { user, account } = await requireAccount("data:view");
  const { group: key } = await props.params;
  const group = GROUP_BY_KEY.get(key);
  if (!group) notFound();

  const series = await loadSeries(account.id);
  const latest = series.at(-1);
  const targets = await getTargets(account.id);
  const note = await getKpiNote(account.id, key);
  const editable = can(user.role, "data:edit");
  const custom = (await getCustomFields(account.id)).filter((c) => c.groupKey === key);
  const sites = await getSites(account.id);
  const targetYear = latest ? Number(latest.period.endDate.slice(0, 4)) + 1 : new Date().getFullYear();

  const disclosures = [
    ...group.disclosures,
    ...(custom.length ? [{ code: "Custom", title: "Custom KPIs", fields: custom.map(customFieldToInput) }] : []),
  ];

  return (
    <>
      <PageHeader
        title={group.title}
        crumbs={[{ label: "ESG KPI's", href: "/dashboard/kpis" }, { label: PILLARS[group.pillar].title, href: `/dashboard/kpis/pillar/${group.pillar}` }]}
        description={group.description}
        actions={latest && editable && <Link href={`/dashboard/reporting/${latest.period.id}/collect/${key}`} className={buttonStyles.primary}>Enter data · {latest.period.title}</Link>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-teal-500">Procedure</h2>
          {note?.procedure ? (
            <div className="prose-post mt-3 text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.procedure) }} />
          ) : (
            <p className="mt-3 text-sm text-stone">No procedure documented yet.</p>
          )}
          {editable && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-teal-500">Edit procedure</summary>
              <div className="mt-3"><ProcedureForm group={key} procedure={note?.procedure ?? ""} /></div>
            </details>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-teal-500">Standards</h2>
          <div className="mt-4 space-y-3">
            {group.standards.map((s) => (
              <div key={s.name} className="grid items-center gap-2 sm:grid-cols-[170px_1fr]">
                <p className="font-display font-bold text-ink-500">{s.name} - {s.ref}</p>
                <div className="rounded-xl bg-white px-4 py-3 text-sm text-ink-500 shadow-[0_2px_10px_rgba(40,55,57,0.08)]">{s.text}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title={group.title}>By reporting period · actual vs target · draft periods are marked</CardHeader>
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {group.headline.map((k) => {
            const f = FIELD_BY_KEY.get(k);
            if (!f || !isNumeric(f)) return null;
            const data = series.map((s) => ({ label: `${periodLabel(s.period)}${s.period.status === "approved" ? "" : " (draft)"}`, value: s.data.total()(k) }));
            const target = targets.get(`${k}:${targetYear}`) ?? (latest ? targets.get(`${k}:${Number(latest.period.endDate.slice(0, 4))}`) : undefined);
            const approved = series.filter((s) => s.period.status === "approved");
            return (
              <div key={k} className="rounded-xl bg-cream/60 p-5">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">{f.label}</p>
                  <Trend change={percentChange(approved.at(-1)?.data.total()(k), approved.at(-2)?.data.total()(k))} lowerIsBetter={f.dimension !== "percent" && !k.startsWith("emp_")} />
                </div>
                {data.length ? <BarChart data={data} dimension={f.dimension} label={`${f.label} by period`} target={target} height={160} /> : <p className="py-8 text-center text-xs text-stone">No data</p>}
                {editable && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-teal-100 pt-3">
                    <span className="text-[11px] font-semibold text-ink-400">Target</span>
                    <TargetForm group={key} fieldKey={k} year={targetYear} value={targets.get(`${k}:${targetYear}`)} unit={DIMENSIONS[f.dimension].canonical} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {latest && (
        <>
          <h2 className="mt-8 mb-4 text-lg font-bold text-teal-500">{latest.period.title} · totals</h2>
          <ResultsTable disclosures={disclosures} data={latest.data} buckets={bucketsFor("total", sites)} />
          <p className="mt-2 text-xs text-ink-400">
            Breakdown by region, country, city or site: <Link className="font-semibold text-teal-500" href={`/dashboard/reporting/${latest.period.id}/results?group=${key}&level=site`}>open results</Link>
          </p>
          <div className="mt-6">
            <SignoffCards subject={`period:${latest.period.id}`} signoffs={await getSignoffs(account.id, `period:${latest.period.id}`)} user={user} path={`/dashboard/kpis/${key}`} readOnly />
          </div>
        </>
      )}
    </>
  );
}
