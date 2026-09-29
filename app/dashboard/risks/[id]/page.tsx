import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteRisk } from "@/app/actions/risks";
import { ConfirmButton } from "@/components/confirm-button";
import { RiskForm } from "@/components/forms/risk-form";
import { Card, CardHeader, LinkPill, PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { risks } from "@/lib/db/schema";
import { GROUP_BY_KEY } from "@/lib/gri/catalog";
import { RISK_LEVELS, riskLevel, riskScore } from "@/lib/gri/risks";
import { TOPIC_BY_KEY } from "@/lib/gri/topics";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Risk" };

export default async function RiskPage(props: PageProps<"/dashboard/risks/[id]">) {
  const { user, account } = await requireAccount("data:view");
  const { id } = await props.params;
  const risk = Number.isInteger(Number(id)) ? db.select().from(risks).where(and(eq(risks.id, Number(id)), eq(risks.accountId, account.id))).get() : undefined;
  if (!risk) notFound();
  const score = riskScore(risk.probability, risk.impact);
  const lvl = riskLevel(score);
  const topic = TOPIC_BY_KEY.get(risk.topicKey);
  const editable = can(user.role, "data:edit");

  return (
    <>
      <PageHeader
        title={`${RISK_LEVELS[lvl].label} - ${score}`}
        description={risk.title}
        crumbs={[
          { label: "Risks", href: "/dashboard/risks" },
          { label: "Key risks", href: "/dashboard/risks/key" },
          { label: `${RISK_LEVELS[lvl].label} risk`, href: `/dashboard/risks/key?level=${lvl}` },
        ]}
      />
      <RiskForm initial={risk} readOnly={!editable} />
      <Card className="mt-6">
        <CardHeader title="Other links" />
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {topic && <LinkPill href={`/dashboard/materiality/${topic.key}`}>Material topic: {topic.title}</LinkPill>}
          {topic?.kpis.map((g) => <LinkPill key={g} href={`/dashboard/kpis/${g}`}>{GROUP_BY_KEY.get(g)?.title} KPIs</LinkPill>)}
          <LinkPill href="/dashboard/reporting">Reporting</LinkPill>
        </div>
      </Card>
      {editable && (
        <form action={deleteRisk} className="mt-6">
          <input type="hidden" name="id" value={risk.id} />
          <ConfirmButton message={`Delete the risk "${risk.title}"?`} variant="secondary">Delete risk</ConfirmButton>
        </form>
      )}
    </>
  );
}
