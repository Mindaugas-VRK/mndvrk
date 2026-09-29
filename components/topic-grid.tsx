import { Card, LinkPill } from "@/components/ui";
import { TOPICS, TOPIC_CATEGORIES, type TopicCategory } from "@/lib/gri/topics";

export function TopicGrid({
  categories,
  states,
}: {
  categories: TopicCategory[];
  states: Map<string, { isMaterial: boolean }>;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {categories.map((c) => {
        const topics = TOPICS.filter((t) => t.category === c);
        return (
          <Card key={c} className="p-6">
            <h2 className="text-lg font-bold text-ink-500">{TOPIC_CATEGORIES[c].title}</h2>
            <p className="mt-2 text-sm text-ink-400">{TOPIC_CATEGORIES[c].description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {topics.map((t) => {
                const material = states.get(t.key)?.isMaterial ?? true;
                return (
                  <LinkPill key={t.key} href={`/dashboard/materiality/${t.key}`}>
                    <span className={material ? "" : "text-stone line-through decoration-stone/50"}>{t.title}</span>
                    {!material && <span className="ml-2 text-[10px] uppercase tracking-wider text-stone">not material</span>}
                  </LinkPill>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
