import type { Metadata } from "next";
import { TopicGrid } from "@/components/topic-grid";
import { PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getTopicStates } from "@/lib/data";
import { TOPIC_CATEGORIES, type TopicCategory } from "@/lib/gri/topics";

export const metadata: Metadata = { title: "Material topics" };

export default async function MaterialTopicsPage() {
  const { account } = await requireAccount("data:view");
  return (
    <>
      <PageHeader
        title="Material topics"
        crumbs={[{ label: "Materiality", href: "/dashboard/materiality" }]}
        description="Topics deemed material to the organisation, with their policies, procedures and linked KPIs."
      />
      <TopicGrid categories={Object.keys(TOPIC_CATEGORIES) as TopicCategory[]} states={getTopicStates(account.id)} />
    </>
  );
}
