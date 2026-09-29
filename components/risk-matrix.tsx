import Link from "next/link";
import { PROBABILITIES } from "@/lib/db/schema";
import { IMPACT_LABELS, LEVEL_STYLES, PROBABILITY_LABELS, RISK_LEVELS, riskLevel, riskScore } from "@/lib/gri/risks";
import { cn } from "@/lib/utils";

/** 5×5 probability × impact matrix. Each cell shows its level, score and the number of risks in it. */
export function RiskMatrix({
  counts,
  compact,
  selected,
}: {
  counts: Map<number, number>;
  compact?: boolean;
  selected?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <div className={cn("grid gap-x-3", compact ? "min-w-[440px] grid-cols-[96px_1fr]" : "min-w-[560px] grid-cols-[180px_1fr]")}>
        <div />
        <div>
          <div className="flex items-center gap-3 text-xs font-semibold text-teal-500">
            <span className="h-px flex-1 bg-teal-500" aria-hidden />← Impact →<span className="h-px flex-1 bg-teal-500" aria-hidden />
          </div>
          <div className="mt-2 grid grid-cols-5 text-center text-[11px] text-ink-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="truncate"><span className="font-semibold text-lime-700">{i}.</span> {IMPACT_LABELS[i]}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-around py-1 pr-1">
          {PROBABILITIES.map((p) => (
            <div key={p} className={cn("flex items-center text-[11px] leading-tight text-ink-400", compact ? "h-12" : "h-16")}>
              <span className="mr-1 font-semibold text-lime-700">{p}.</span> <span className={compact ? "line-clamp-2" : ""}>{PROBABILITY_LABELS[p]}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-5 overflow-hidden rounded-xl" role="table" aria-label="Risk matrix">
          {PROBABILITIES.map((p) =>
            [1, 2, 3, 4, 5].map((i) => {
              const score = riskScore(p, i);
              const level = riskLevel(score);
              const n = counts.get(score) ?? 0;
              return (
                <Link
                  key={`${p}${i}`}
                  href={`/dashboard/risks/key?score=${score}`}
                  role="cell"
                  aria-label={`${RISK_LEVELS[level].label} ${score}, probability ${p}, impact ${i}: ${n} risk${n === 1 ? "" : "s"}`}
                  className={cn(
                    "relative flex flex-col items-center justify-center border-2 border-white text-center transition hover:brightness-110",
                    compact ? "h-12 text-xs" : "h-16 text-sm",
                    LEVEL_STYLES[level].cell,
                    selected === score && "ring-4 ring-inset ring-lime-400",
                  )}
                >
                  <span>{compact ? score : `${RISK_LEVELS[level].label} - ${score}`}</span>
                  {compact && <span className="text-[9px] uppercase tracking-wider opacity-80">{RISK_LEVELS[level].label}</span>}
                  {n > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-ink-500">
                      {n}
                    </span>
                  )}
                </Link>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
