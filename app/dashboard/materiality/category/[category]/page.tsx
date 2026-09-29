import { notFound } from "next/navigation";
import { TopicGrid } from "@/components/topic-grid";
import { PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getTopicStates } from "@/lib/data";
import { TOPIC_CATEGORIES, type TopicCategory } from "@/lib/gri/topics";

export default async function TopicCategoryPage(props: PageProps<"/dashboard/materiality/category/[category]">) {
  const { account } = await requireAccount("data:view");
  const { category } = await props.params;
  if (!(category in TOPIC_CATEGORIES)) notFound();
  const c = category as TopicCategory;
  return (
    <>
      <PageHeader
        title={TOPIC_CATEGORIES[c].title}
        crumbs={[{ label: "Materiality", href: "/dashboard/materiality" }, { label: "Material topics", href: "/dashboard/materiality" }]}
      />
      <TopicGrid categories={[c]} states={await getTopicStates(account.id)} />
    </>
  );
}
