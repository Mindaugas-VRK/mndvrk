import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { StatusBadge } from "@/components/status";
import { PageHeader, buttonStyles } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getCustomFields, getPeriod, getSignoffs, getSites, getTopicStates, loadPeriodData } from "@/lib/data";
import { KPI_GROUPS, PILLARS, type Field } from "@/lib/gri/catalog";
import { customFieldToInput } from "@/lib/gri/engine";
import { TOPICS } from "@/lib/gri/topics";
import { formatMeasure, formatNumber } from "@/lib/gri/units";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "GRI report" };

export default async function ReportPage(props: PageProps<"/dashboard/reporting/[id]/report">) {
  const { account } = await requireAccount("data:view");
  const { id } = await props.params;
  const period = await getPeriod(Number(id), account.id);
  if (!period) notFound();
  const data = await loadPeriodData(period.id, account.id);
  const total = data.total();
  const sites = await getSites(account.id);
  const custom = await getCustomFields(account.id);
  const signoffs = await getSignoffs(account.id, `period:${period.id}`);
  const topicStates = await getTopicStates(account.id);
  const material = TOPICS.filter((t) => topicStates.get(t.key)?.isMaterial ?? true);

  const value = (f: Field) => {
    if (f.kind === "text" || f.kind === "choice") return data.text(f.key) || "Not reported";
    const v = total(f.key);
    if (v === null) return "Not reported";
    return f.dimension === "number" ? formatNumber(v) : formatMeasure(v, f.dimension);
  };

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="GRI report draft"
          crumbs={[{ label: "Reporting", href: "/dashboard/reporting" }, { label: period.title, href: `/dashboard/reporting/${period.id}` }]}
          description="A GRI content index with all reported values. Download it as Inline XBRL (human- and machine-readable, as required for CSRD digital reporting), as an Excel workbook, or print it as PDF."
          actions={
            <>
              <a href={`/dashboard/reporting/${period.id}/export/ixbrl`} className={buttonStyles.secondary}>Inline XBRL</a>
              <a href={`/dashboard/reporting/${period.id}/export/xlsx`} className={buttonStyles.secondary}>Excel</a>
              <PrintButton />
            </>
          }
        />
      </div>
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-10 shadow-[0_2px_12px_rgba(40,55,57,0.06)] print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-teal-100 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone">Sustainability report · GRI</p>
            <h1 className="mt-2 text-3xl font-bold text-ink-500">{account.name}</h1>
            <span className="brand-rule mt-4" />
            <p className="mt-4 text-sm text-ink-400">{period.title} · {period.startDate} to {period.endDate}</p>
            <div className="mt-2 print:hidden"><StatusBadge status={period.status} /></div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-color.svg" alt="ESGCounts" className="h-8 w-auto" />
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-teal-500">Statement of use</h2>
          <p className="mt-2 text-sm text-ink-500">
            {account.name} has reported the information cited in this GRI content index for the period {period.startDate} to {period.endDate} with reference to the GRI Standards.
            Data covers {sites.length} site{sites.length === 1 ? "" : "s"}{sites.length ? `: ${sites.map((s) => s.name).join(", ")}` : ""}.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-teal-500">Material topics</h2>
          <p className="mt-2 text-sm text-ink-500">{material.map((t) => t.title).join(" · ") || "None identified."}</p>
        </section>

        {KPI_GROUPS.map((g) => {
          const cf = custom.filter((c) => c.groupKey === g.key);
          const disclosures = [...g.disclosures, ...(cf.length ? [{ code: "Custom", title: "Organisation-specific KPIs", fields: cf.map(customFieldToInput) as Field[] }] : [])];
          return (
            <section key={g.key} className="mt-10 break-inside-avoid-page">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">{PILLARS[g.pillar].title}</p>
              <h2 className="text-xl font-bold text-teal-500">{g.title}</h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-teal-500 text-left text-xs uppercase tracking-wider text-ink-400">
                    <th className="w-28 py-2">GRI</th>
                    <th className="py-2">Disclosure</th>
                    <th className="w-56 py-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {disclosures.flatMap((d) =>
                    d.fields.map((f) => (
                        <tr key={f.key} className="border-b border-teal-50 align-top">
                          <td className="py-2 text-xs text-ink-400">{f.code ?? d.code}</td>
                          <td className="py-2 text-ink-500" style={{ paddingLeft: `${(f.indent ?? 0) * 1}rem` }}>{f.label}</td>
                          <td className="py-2 text-right whitespace-pre-line text-ink-500">{value(f)}</td>
                        </tr>
                      )),
                  )}
                </tbody>
              </table>
            </section>
          );
        })}

        <footer className="mt-12 grid gap-4 border-t border-teal-100 pt-6 text-sm sm:grid-cols-3">
          {(["prepared", "reviewed", "approved"] as const).map((s) => (
            <div key={s}>
              <p className="text-xs capitalize text-ink-400">{s}</p>
              <p className="font-semibold text-ink-500">{signoffs[s]?.name ?? "—"}</p>
              <p className="text-xs text-stone">{signoffs[s] ? formatDate(signoffs[s]!.at) : ""}</p>
            </div>
          ))}
        </footer>
      </article>
    </>
  );
}
