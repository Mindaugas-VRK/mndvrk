import type { Metadata } from "next";
import { KpiOverview } from "@/components/kpi-overview";
import { PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { loadSeries } from "@/lib/data";
import { PILLARS, type PillarKey } from "@/lib/gri/catalog";

export const metadata: Metadata = { title: "ESG KPIs" };

export default async function KpisPage() {
  const { account } = await requireAccount("data:view");
  const latest = loadSeries(account.id).at(-1);
  return (
    <>
      <PageHeader title="ESG KPI's" description="GRI indicators grouped by topic. Open a KPI for its procedure, trend, targets and standards." />
      <KpiOverview pillars={Object.keys(PILLARS) as PillarKey[]} latest={latest?.data.total()} latestTitle={latest ? `Totals · ${latest.period.title}` : undefined} />
    </>
  );
}
