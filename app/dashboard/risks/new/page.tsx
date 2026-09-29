import type { Metadata } from "next";
import { RiskForm } from "@/components/forms/risk-form";
import { PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "New risk" };

export default async function NewRiskPage(props: PageProps<"/dashboard/risks/new">) {
  await requireAccount("data:edit");
  const { topic } = await props.searchParams;
  return (
    <>
      <PageHeader title="New risk" crumbs={[{ label: "Risks", href: "/dashboard/risks" }, { label: "Key risks", href: "/dashboard/risks/key" }]} />
      <RiskForm initial={{ topicKey: typeof topic === "string" ? topic : "" }} readOnly={false} />
    </>
  );
}
