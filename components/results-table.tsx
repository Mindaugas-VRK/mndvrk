import type { Bucket, PeriodData } from "@/lib/gri/engine";
import type { Field } from "@/lib/gri/catalog";
import type { Disclosure } from "@/lib/gri/catalog";
import { formatMeasure } from "@/lib/gri/units";
import { tableHead } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Rollup table: one row per field, one column per bucket (total / region / country / city / site). */
export function ResultsTable({
  disclosures,
  data,
  buckets,
}: {
  disclosures: { code: string; title: string; fields: Field[] }[];
  data: PeriodData;
  buckets: Bucket[];
}) {
  const getters = buckets.map((b) => data.getter(b));
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_2px_12px_rgba(40,55,57,0.06)]">
      <table className="w-full min-w-[640px] text-sm">
        <thead className={tableHead}>
          <tr>
            <th className="sticky left-0 z-10 bg-teal-500 px-5 py-3">Indicator</th>
            {buckets.map((b) => <th key={b.key} className="px-4 py-3 text-right whitespace-nowrap">{b.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {disclosures.map((d: Disclosure | { code: string; title: string; fields: Field[] }) => (
            <DisclosureRows key={d.code} d={d} data={data} getters={getters} cols={buckets.length} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DisclosureRows({ d, data, getters, cols }: { d: { code: string; title: string; fields: Field[] }; data: PeriodData; getters: ((k: string) => number | null)[]; cols: number }) {
  return (
    <>
      <tr className="bg-cream">
        <td colSpan={cols + 1} className="sticky left-0 px-5 py-2 text-xs font-bold uppercase tracking-wider text-teal-500">
          {d.code} · {d.title}
        </td>
      </tr>
      {d.fields.map((f) => {
        if (f.kind === "text" || f.kind === "choice") {
          const t = data.text(f.key);
          return (
            <tr key={f.key} className="border-t border-teal-50">
              <td className="sticky left-0 bg-white px-5 py-2 text-ink-400">{f.label}</td>
              <td colSpan={cols} className="px-4 py-2 text-ink-500">{t ? <span className="line-clamp-2 whitespace-pre-line">{t}</span> : <span className="text-stone">—</span>}</td>
            </tr>
          );
        }
        const computed = f.kind === "computed";
        return (
          <tr key={f.key} className={cn("border-t border-teal-50", computed && "font-semibold")}>
            <td className="sticky left-0 bg-white px-5 py-2" style={{ paddingLeft: `${1.25 + (f.indent ?? 0) * 1.25}rem` }}>
              <span className={computed ? "text-ink-500" : "text-ink-400"}>{f.label}</span>
              {f.code && <span className="ml-2 text-[11px] font-normal text-stone">{f.code}</span>}
              {computed && <span className="ml-2 rounded bg-lime-100 px-1.5 py-0.5 text-[10px] font-semibold text-lime-800" title={f.formula}>Σ rollup</span>}
            </td>
            {getters.map((g, i) => (
              <td key={i} className="px-4 py-2 text-right whitespace-nowrap text-ink-500">{formatMeasure(g(f.key), f.dimension)}</td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
