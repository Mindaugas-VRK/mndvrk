import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicForm } from "@/components/forms/topic-form";
import { Badge, Card, CardHeader, LinkPill, PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getTopicStates, listRisks } from "@/lib/data";
import { GROUP_BY_KEY } from "@/lib/gri/catalog";
import { LEVEL_STYLES, RISK_LEVELS, riskLevel, riskScore } from "@/lib/gri/risks";
import { TOPIC_BY_KEY, TOPIC_CATEGORIES } from "@/lib/gri/topics";
import { renderMarkdown } from "@/lib/markdown";
import { can } from "@/lib/permissions";

export async function generateMetadata(props: PageProps<"/dashboard/materiality/[topic]">): Promise<Metadata> {
  const { topic } = await props.params;
  return { title: TOPIC_BY_KEY.get(topic)?.title ?? "Topic" };
}

export default async function TopicPage(props: PageProps<"/dashboard/materiality/[topic]">) {
  const { user, account } = await requireAccount("data:view");
  const { topic: key } = await props.params;
  const topic = TOPIC_BY_KEY.get(key);
  if (!topic) notFound();
  const state = getTopicStates(account.id).get(key);
  const risks = listRisks(account.id).filter((r) => r.topicKey === key);
  const content = state?.content ?? "";
  const isMaterial = state?.isMaterial ?? true;

  return (
    <>
      <PageHeader
        title={topic.title}
        crumbs={[
          { label: "Materiality", href: "/dashboard/materiality" },
          { label: "Material topics", href: "/dashboard/materiality" },
          { label: TOPIC_CATEGORIES[topic.category].title, href: `/dashboard/materiality/category/${topic.category}` },
        ]}
        description={<span className="flex items-center gap-2">{topic.summary} {isMaterial ? <Badge tone="green">Material</Badge> : <Badge>Not material</Badge>}</span>}
      />
      <Card className="p-6">
        <h2 className="text-lg font-bold text-teal-500">Policies and procedures</h2>
        {content ? (
          <div className="prose-post mt-4 text-sm lg:columns-2 lg:gap-10 [&>*]:break-inside-avoid" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        ) : (
          <p className="mt-4 text-sm text-stone">No policies or procedures documented yet.</p>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Linked KPIs" />
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {topic.kpis.map((g) => <LinkPill key={g} href={`/dashboard/kpis/${g}`}>{GROUP_BY_KEY.get(g)?.title}</LinkPill>)}
            {topic.kpis.length === 0 && <p className="text-sm text-stone">No GRI KPIs mapped yet. Add a custom KPI under Admin → Accounts.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Related risks" />
          <div className="grid gap-3 p-6">
            {risks.map((r) => {
              const lvl = riskLevel(riskScore(r.probability, r.impact));
              return (
                <LinkPill key={r.id} href={`/dashboard/risks/${r.id}`}>
                  <span className={LEVEL_STYLES[lvl].text + " font-semibold"}>{RISK_LEVELS[lvl].label} - {riskScore(r.probability, r.impact)}</span> · {r.title}
                </LinkPill>
              );
            })}
            {risks.length === 0 && <p className="text-sm text-stone">No risks linked to this topic.</p>}
          </div>
        </Card>
      </div>

      {can(user.role, "data:edit") && (
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-lg font-bold text-teal-500">Edit topic</h2>
          <TopicForm topicKey={key} isMaterial={isMaterial} content={content} />
        </Card>
      )}
    </>
  );
}
