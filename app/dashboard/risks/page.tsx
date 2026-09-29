import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { RiskMatrix } from "@/components/risk-matrix";
import { SignoffCards } from "@/components/signoff-cards";
import { Card, PageHeader, buttonStyles } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getSignoffs, listRisks } from "@/lib/data";
import { riskScore } from "@/lib/gri/risks";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Risk matrix" };

export default async function RiskMatrixPage() {
  const { user, account } = await requireAccount("data:view");
  const risks = listRisks(account.id);
  const counts = new Map<number, number>();
  for (const r of risks) {
    const s = riskScore(r.probability, r.impact);
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return (
    <>
      <PageHeader
        title="Risks matrix"
        crumbs={[{ label: "Risks", href: "/dashboard/risks" }]}
        description="A summary of the risks the company is facing. Select a cell to see its risks."
        actions={
          <>
            <Link href="/dashboard/risks/key" className={buttonStyles.secondary}>Key risks</Link>
            {can(user.role, "data:edit") && <Link href="/dashboard/risks/new" className={buttonStyles.primary}><Icon.plus className="h-4 w-4" /> New risk</Link>}
          </>
        }
      />
      <Card className="p-6">
        <RiskMatrix counts={counts} />
      </Card>
      <Card className="mt-6 p-6 text-sm text-ink-400">
        <h2 className="text-lg font-bold text-teal-500">Risk assessment procedure</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li><strong className="text-ink-500">Identify hazards</strong>: physical, regulatory, reputational and financial, linked to a material topic.</li>
          <li><strong className="text-ink-500">Analyse</strong>: rate the probability (A–E) and impact (1–5) and record the rationale. The matrix gives the score.</li>
          <li><strong className="text-ink-500">Mitigate</strong>: agree actions proportionate to the level (Critical 23–25, High 16–22, Medium 7–15, Low 1–6).</li>
          <li><strong className="text-ink-500">Monitor and review</strong>: track through the linked KPIs and re-assess at least annually.</li>
        </ol>
      </Card>
      <div className="mt-6">
        <SignoffCards subject="risks" signoffs={getSignoffs(account.id, "risks")} user={user} path="/dashboard/risks" />
      </div>
    </>
  );
}
