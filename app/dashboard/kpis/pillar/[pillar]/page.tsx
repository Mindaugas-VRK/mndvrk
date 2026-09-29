import { notFound } from "next/navigation";
import { KpiOverview } from "@/components/kpi-overview";
import { PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { loadSeries } from "@/lib/data";
import { PILLARS, type PillarKey } from "@/lib/gri/catalog";

export default async function PillarPage(props: PageProps<"/dashboard/kpis/pillar/[pillar]">) {
  const { account } = await requireAccount("data:view");
  const { pillar } = await props.params;
  if (!(pillar in PILLARS)) notFound();
  const latest = loadSeries(account.id).at(-1);
  return (
    <>
      <PageHeader title={PILLARS[pillar as PillarKey].title} crumbs={[{ label: "ESG KPI's", href: "/dashboard/kpis" }]} />
      <KpiOverview pillars={[pillar as PillarKey]} latest={latest?.data.total()} latestTitle={latest ? `Totals · ${latest.period.title}` : undefined} />
    </>
  );
}
