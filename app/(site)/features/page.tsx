import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section";
import { buttonStyles } from "@/components/ui";
import { KPI_GROUPS, PILLARS, groupFields, type PillarKey } from "@/lib/gri/catalog";

export const metadata: Metadata = {
  title: "Features",
  description: "ESG data collection, year-on-year tracking, review workflow and role-based access for your team.",
};

const STEPS = [
  ["Assess", "Run your double materiality assessment step by step and keep a live risk register with a 5×5 probability × impact matrix."],
  ["Collect", "Enter GRI KPIs per site, from meter readings to headcount. Totals roll up by city, country and region automatically."],
  ["Review & approve", "Every reporting period is prepared, reviewed and approved, with a full audit trail of who changed what."],
  ["Report", "Generate a GRI content index, compare actuals against targets, and export everything for auditors."],
];

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Features" title="From raw data to a report you can stand behind">
            ESGCounts replaces the spreadsheets and email threads behind sustainability reporting with one
            structured, secure workspace.
          </SectionHeading>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-bold text-ink-500">How it works</h2>
        <span className="brand-rule mt-4" />
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="rounded-xl border border-teal-100 p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 font-display font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-bold text-ink-500">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-400">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-mint/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-bold text-ink-500">GRI indicators included</h2>
          <span className="brand-rule mt-4" />
          <p className="mt-4 max-w-2xl text-ink-400">
            The GRI indicators you need, with units, formulas and rollups built in, plus your own custom KPIs.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {(Object.keys(PILLARS) as PillarKey[]).map((p) => (
              <div key={p} className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="font-bold text-ink-500">{PILLARS[p].title}</h3>
                <ul className="mt-5 space-y-3 text-sm">
                  {KPI_GROUPS.filter((g) => g.pillar === p).map((g) => (
                    <li key={g.key} className="flex justify-between gap-3 border-b border-teal-50 pb-2">
                      <span className="text-ink-500">{g.title} <span className="text-stone">· {groupFields(g).length} fields</span></span>
                      <span className="shrink-0 text-xs text-stone">GRI {g.standards[0].ref}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-ink-500">See it with your own data</h2>
        <Link href="/contact" className={`${buttonStyles.primary} mt-6 px-5 py-3`}>
          Request a demo
        </Link>
      </section>
    </>
  );
}
