import Link from "next/link";
import { Card } from "@/components/ui";
import { KPI_GROUPS, PILLARS, FIELD_BY_KEY, isNumeric, type PillarKey } from "@/lib/gri/catalog";
import type { Getter } from "@/lib/gri/catalog";
import { formatMeasure } from "@/lib/gri/units";

export function KpiOverview({ pillars, latest, latestTitle }: { pillars: PillarKey[]; latest?: Getter; latestTitle?: string }) {
  return (
    <div className="space-y-8">
      {pillars.map((p) => (
        <section key={p}>
          <h2 className="mb-4 text-lg font-bold text-teal-500">{PILLARS[p].title}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {KPI_GROUPS.filter((g) => g.pillar === p).map((g) => (
              <Link key={g.key} href={`/dashboard/kpis/${g.key}`}>
                <Card className="h-full p-5 transition hover:shadow-[0_4px_16px_rgba(40,55,57,0.12)]">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-ink-500">{g.title}</h3>
                    <span className="shrink-0 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-800">GRI {g.standards[0].ref}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-400">{g.description}</p>
                  {latest && (
                    <dl className="mt-4 space-y-1 border-t border-teal-50 pt-3 text-sm">
                      {g.headline.map((k) => {
                        const f = FIELD_BY_KEY.get(k);
                        if (!f || !isNumeric(f)) return null;
                        return (
                          <div key={k} className="flex justify-between gap-3">
                            <dt className="truncate text-ink-400">{f.label}</dt>
                            <dd className="shrink-0 font-semibold text-ink-500">{formatMeasure(latest(k), f.dimension)}</dd>
                          </div>
                        );
                      })}
                      {latestTitle && <p className="pt-1 text-[11px] text-stone">{latestTitle}</p>}
                    </dl>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
