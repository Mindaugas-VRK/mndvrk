import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Card, PageHeader, buttonStyles, tableHead } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { listRisks } from "@/lib/data";
import { IMPACT_LABELS, LEVEL_STYLES, RISK_LEVELS, probabilityRating, riskLevel, riskScore, type RiskLevel } from "@/lib/gri/risks";
import { TOPIC_BY_KEY } from "@/lib/gri/topics";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Key risks" };

export default async function KeyRisksPage(props: PageProps<"/dashboard/risks/key">) {
  const { user, account } = await requireAccount("data:view");
  const sp = await props.searchParams;
  const levelFilter = (typeof sp.level === "string" && sp.level in RISK_LEVELS ? sp.level : undefined) as RiskLevel | undefined;
  const scoreFilter = typeof sp.score === "string" ? Number(sp.score) : undefined;

  const all = listRisks(account.id)
    .map((r) => ({ ...r, score: riskScore(r.probability, r.impact) }))
    .sort((a, b) => b.score - a.score);
  const rows = all.filter((r) => (!levelFilter || riskLevel(r.score) === levelFilter) && (!scoreFilter || r.score === scoreFilter));

  return (
    <>
      <PageHeader
        title="Key risks"
        crumbs={[{ label: "Risks", href: "/dashboard/risks" }]}
        actions={can(user.role, "data:edit") && <Link href="/dashboard/risks/new" className={buttonStyles.primary}><Icon.plus className="h-4 w-4" /> New risk</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(RISK_LEVELS) as RiskLevel[]).map((l) => {
          const n = all.filter((r) => riskLevel(r.score) === l).length;
          const active = levelFilter === l;
          return (
            <Link key={l} href={active ? "/dashboard/risks/key" : `/dashboard/risks/key?level=${l}`}>
              <Card className={cn("flex items-center gap-4 p-5 transition hover:shadow-[0_4px_16px_rgba(40,55,57,0.12)]", active && "ring-2 ring-lime-500")}>
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", LEVEL_STYLES[l].soft)}>
                  <Icon.scale className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold text-ink-500">{RISK_LEVELS[l].label}</p>
                  <p className="text-xs text-ink-400">{RISK_LEVELS[l].range} · {n} risk{n === 1 ? "" : "s"}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      {(levelFilter || scoreFilter) && (
        <p className="mt-4 text-sm text-ink-400">
          Filtered by {levelFilter ? RISK_LEVELS[levelFilter].label : `score ${scoreFilter}`} · <Link href="/dashboard/risks/key" className="font-semibold text-teal-500">Clear</Link>
        </p>
      )}
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className={tableHead}>
            <tr>
              <th className="px-5 py-3">Risk</th>
              <th className="px-5 py-3">Links to material topic</th>
              <th className="px-5 py-3">Hazards</th>
              <th className="px-5 py-3">Probability</th>
              <th className="px-5 py-3">Impact</th>
              <th className="px-5 py-3">Mitigation</th>
              <th className="px-5 py-3">Monitoring</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const lvl = riskLevel(r.score);
              const hazards = [r.physical && "Physical", r.regulatory && "Regulatory", r.reputational && "Reputational", r.financial && "Financial"].filter(Boolean);
              const topic = TOPIC_BY_KEY.get(r.topicKey);
              return (
                <tr key={r.id} className={i % 2 ? "bg-teal-50/50" : ""}>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/risks/${r.id}`} className="block hover:underline">
                      <span className={cn("font-semibold", LEVEL_STYLES[lvl].text)}>{RISK_LEVELS[lvl].label} - {r.score}</span>
                      <span className="block text-ink-500">{r.title}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">{topic ? <Link href={`/dashboard/materiality/${topic.key}`} className="font-medium text-teal-500 underline">{topic.title}</Link> : <span className="text-stone">—</span>}</td>
                  <td className="px-5 py-3 text-ink-500">{hazards.join(", ") || <span className="text-stone">—</span>}</td>
                  <td className="px-5 py-3 text-ink-500">{r.probability} · {probabilityRating(r.probability)}</td>
                  <td className="px-5 py-3 text-ink-500">{r.impact} · {IMPACT_LABELS[r.impact]}</td>
                  <td className="max-w-56 truncate px-5 py-3 text-ink-400" title={r.mitigation}>{r.mitigation || "—"}</td>
                  <td className="max-w-56 truncate px-5 py-3 text-ink-400" title={r.monitoring}>{r.monitoring || "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-ink-400">No risks here yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
