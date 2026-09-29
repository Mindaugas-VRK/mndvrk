import { formatMeasure, type Dimension } from "@/lib/gri/units";

/**
 * Single-series vertical bar chart: one hue (lime, as in the KPI wireframe),
 * rounded data-ends, value labels above bars, per-bar hover tooltip and an
 * optional target marker. Text stays in ink tokens.
 */
export function BarChart({
  data,
  dimension,
  label,
  target,
  height = 176,
}: {
  data: { label: string; value: number | null }[];
  dimension: Dimension;
  label: string;
  target?: number | null;
  height?: number;
}) {
  const values = data.map((d) => d.value ?? 0);
  const max = Math.max(...values, target ?? 0, 1);
  const pct = (v: number) => (v / max) * 100;
  return (
    <figure>
      <div className="relative flex items-end gap-3 border-b border-ink-100" style={{ height }} role="img" aria-label={label}>
        {target != null && (
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-teal-500" style={{ bottom: `${pct(target)}%` }}>
            <span className="absolute -top-5 right-0 rounded bg-white px-1 text-[10px] font-semibold text-teal-500">Target {formatMeasure(target, dimension)}</span>
          </div>
        )}
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[10px] font-semibold text-ink-400">{d.value == null ? "" : formatMeasure(d.value, dimension).replace(/ [^ ]+$/, "")}</span>
            <div
              tabIndex={0}
              title={`${d.label}: ${formatMeasure(d.value, dimension)}`}
              aria-label={`${d.label}: ${formatMeasure(d.value, dimension)}`}
              className="w-3 rounded-t-[4px] bg-gradient-to-t from-lime-200 to-lime-500 outline-none transition group-hover:w-4 focus-visible:ring-2 focus-visible:ring-teal-500 sm:w-4"
              style={{ height: `${d.value == null ? 0 : Math.max(pct(d.value), 1)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full z-20 mb-1 hidden whitespace-nowrap rounded-md bg-ink-500 px-2 py-1 text-xs text-white shadow group-hover:block group-focus-within:block">
              {d.label}: {formatMeasure(d.value, dimension)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {data.map((d) => (
          <div key={d.label} className="flex-1 truncate text-center text-[11px] text-ink-400">{d.label}</div>
        ))}
      </div>
    </figure>
  );
}

export function Meter({ value, label, detail }: { value: number; label: string; detail?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-medium text-ink-500">{label}</span>
        <span className="text-ink-400">{detail ?? `${value}%`}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-teal-50" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function Trend({ change, lowerIsBetter }: { change: number | null; lowerIsBetter?: boolean }) {
  if (change === null || !Number.isFinite(change)) return <span className="text-xs text-stone">—</span>;
  const improving = lowerIsBetter ? change < 0 : change > 0;
  const flat = Math.abs(change) < 0.05;
  const arrow = flat ? "→" : change > 0 ? "▲" : "▼";
  const cls = flat ? "text-ink-400" : improving ? "text-lime-800 bg-lime-100" : "text-red-700 bg-red-50";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {arrow} {Math.abs(change).toFixed(1)}%
      <span className="sr-only">{flat ? "no change" : improving ? "improvement" : "deterioration"}</span>
    </span>
  );
}

export function percentChange(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
