import type { Metadata } from "next";
import { Card, LinkPill, PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { listRisks } from "@/lib/data";
import { GROUP_OF_FIELD, KPI_GROUPS, ALL_FIELDS } from "@/lib/gri/catalog";
import { TOPICS } from "@/lib/gri/topics";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage(props: PageProps<"/dashboard/search">) {
  const { account } = await requireAccount("data:view");
  const { q } = await props.searchParams;
  const query = (typeof q === "string" ? q : "").trim().toLowerCase();
  const match = (s: string) => s.toLowerCase().includes(query);

  const kpis = query ? KPI_GROUPS.filter((g) => match(g.title) || match(g.description) || g.standards.some((s) => match(`${s.name} ${s.ref}`))) : [];
  const fields = query ? ALL_FIELDS.filter((f) => match(f.label) || (f.code && match(f.code))).slice(0, 30) : [];
  const topics = query ? TOPICS.filter((t) => match(t.title) || match(t.summary)) : [];
  const risks = query ? (await listRisks(account.id)).filter((r) => match(r.title) || match(r.mitigation)) : [];
  const none = query && !kpis.length && !fields.length && !topics.length && !risks.length;

  return (
    <>
      <PageHeader title={query ? `Search: “${query}”` : "Search"} />
      {!query && <p className="text-sm text-ink-400">Type in the search box to find KPIs, GRI indicators, material topics and risks.</p>}
      {none && <p className="text-sm text-ink-400">Nothing found.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        {kpis.length > 0 && <Card className="p-6"><h2 className="mb-3 font-bold text-teal-500">KPIs</h2><div className="grid gap-2">{kpis.map((g) => <LinkPill key={g.key} href={`/dashboard/kpis/${g.key}`}>{g.title}</LinkPill>)}</div></Card>}
        {topics.length > 0 && <Card className="p-6"><h2 className="mb-3 font-bold text-teal-500">Material topics</h2><div className="grid gap-2">{topics.map((t) => <LinkPill key={t.key} href={`/dashboard/materiality/${t.key}`}>{t.title}</LinkPill>)}</div></Card>}
        {risks.length > 0 && <Card className="p-6"><h2 className="mb-3 font-bold text-teal-500">Risks</h2><div className="grid gap-2">{risks.map((r) => <LinkPill key={r.id} href={`/dashboard/risks/${r.id}`}>{r.title}</LinkPill>)}</div></Card>}
        {fields.length > 0 && <Card className="p-6"><h2 className="mb-3 font-bold text-teal-500">GRI indicators</h2><div className="grid gap-2">{fields.map((f) => <LinkPill key={f.key} href={`/dashboard/kpis/${GROUP_OF_FIELD.get(f.key)}`}>{f.code ? `${f.code} · ` : ""}{f.label}</LinkPill>)}</div></Card>}
      </div>
    </>
  );
}
