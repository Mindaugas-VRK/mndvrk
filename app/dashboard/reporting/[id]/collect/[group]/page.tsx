import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryForm, type EntryRow } from "@/components/forms/entry-form";
import { Alert, PageHeader, buttonStyles } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getCustomFields, getPeriod, getSites, loadPeriodData } from "@/lib/data";
import { GROUP_BY_KEY, KPI_GROUPS, type Field } from "@/lib/gri/catalog";
import { customFieldToInput, isSiteComputable } from "@/lib/gri/engine";
import { defaultUnit, formatMeasure, formatNumber, unitOptions } from "@/lib/gri/units";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Collect data" };

export default async function CollectPage(props: PageProps<"/dashboard/reporting/[id]/collect/[group]">) {
  const { user, account } = await requireAccount("data:view");
  const { id, group: groupKey } = await props.params;
  const { site } = await props.searchParams;
  const period = await getPeriod(Number(id), account.id);
  const group = GROUP_BY_KEY.get(groupKey);
  if (!period || !group) notFound();

  const sites = await getSites(account.id);
  const custom = (await getCustomFields(account.id)).filter((c) => c.groupKey === groupKey);
  const data = await loadPeriodData(period.id, account.id);

  const disclosures = [
    ...group.disclosures,
    ...(custom.length ? [{ code: "Custom", title: "Custom KPIs", fields: custom.map(customFieldToInput) as Field[] }] : []),
  ];
  const hasSiteFields = disclosures.some((d) => d.fields.some((f) => f.kind === "input" && f.level === "site"));
  const hasAccountFields = disclosures.some((d) => d.fields.some((f) => f.kind !== "computed" && (f.kind !== "input" || f.level === "account")));

  const siteParam = typeof site === "string" ? site : undefined;
  const selected = siteParam === "account" ? 0 : Number(siteParam) || (hasSiteFields ? sites[0]?.id ?? 0 : 0);
  const siteId = sites.some((s) => s.id === selected) ? selected : hasSiteFields && sites[0] ? sites[0].id : 0;
  const bucket = siteId === 0
    ? { key: "total", label: "Total", siteIds: sites.map((s) => s.id), includeAccount: true }
    : { key: `site:${siteId}`, label: "", siteIds: [siteId], includeAccount: false };
  const get = data.getter(bucket);

  const rows: EntryRow[] = [];
  for (const d of disclosures) {
    const fields = d.fields.filter((f) =>
      siteId === 0 ? f.kind !== "input" || f.level === "account" : (f.kind === "input" && f.level === "site") || f.kind === "computed",
    );
    // At site level only show rollups that can be computed from site inputs.
    const visible = fields.filter((f) => f.kind !== "computed" || siteId === 0 || isSiteComputable(f.key));
    if (!visible.length) continue;
    rows.push({ type: "heading", code: d.code, title: d.title });
    for (const f of visible) {
      if (f.kind === "input") {
        const e = data.entry(siteId, f.key);
        rows.push({
          type: "input", key: f.key, code: f.code, label: f.label, hint: f.hint, indent: f.indent,
          units: unitOptions(f.dimension),
          value: e?.value == null ? "" : String(e.value),
          unit: e?.unit || defaultUnit(f.dimension),
          reference: e?.reference ?? "",
          comment: e?.comment ?? "",
        });
      } else if (f.kind === "computed") {
        rows.push({ type: "computed", key: f.key, code: f.code, label: f.label, indent: f.indent, formula: f.formula, display: f.dimension === "number" ? formatNumber(get(f.key)) : formatMeasure(get(f.key), f.dimension) });
      } else if (f.kind === "choice") {
        const t = data.text(f.key);
        rows.push({ type: "choice", key: f.key, code: f.code, label: f.label, options: f.options, selected: t ? t.split(", ") : [], comment: "" });
      } else {
        rows.push({ type: "text", key: f.key, code: f.code, label: f.label, hint: f.hint, multiline: f.multiline ?? true, value: data.text(f.key), comment: "" });
      }
    }
  }

  const locked = period.status === "approved" || !can(user.role, "data:edit");
  const idx = KPI_GROUPS.findIndex((g) => g.key === groupKey);
  const nextGroup = KPI_GROUPS[idx + 1];

  return (
    <>
      <PageHeader
        title={group.title}
        crumbs={[{ label: "Reporting", href: "/dashboard/reporting" }, { label: period.title, href: `/dashboard/reporting/${period.id}` }, { label: "Collect" }]}
        description={`GRI ${group.standards[0].ref} · enter values per site; totals roll up Site → City → Country → Region automatically.`}
        actions={
          <>
            <Link href={`/dashboard/reporting/${period.id}/results?group=${groupKey}&level=site`} className={buttonStyles.secondary}>See rollup</Link>
            {nextGroup && <Link href={`/dashboard/reporting/${period.id}/collect/${nextGroup.key}`} className={buttonStyles.secondary}>Next: {nextGroup.title} →</Link>}
          </>
        }
      />
      {period.status === "approved" && <div className="mb-4"><Alert tone="success">Approved and locked.</Alert></div>}
      {period.status !== "approved" && period.status !== "draft" && !locked && (
        <div className="mb-4"><Alert tone="info">This period has been signed off. Saving changes will reset the Prepared / Reviewed sign-offs.</Alert></div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Site">
        {hasSiteFields && sites.map((s) => (
          <Link
            key={s.id}
            href={`?site=${s.id}`}
            role="tab"
            aria-selected={siteId === s.id}
            className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", siteId === s.id ? "bg-teal-500 text-white" : "bg-white text-ink-400 shadow-sm hover:text-teal-500")}
          >
            {s.name}
            <span className={cn("ml-1.5 text-xs", siteId === s.id ? "text-teal-100" : "text-stone")}>{[s.city, s.country].filter(Boolean).join(", ")}</span>
          </Link>
        ))}
        {hasAccountFields && (
          <Link
            href="?site=account"
            role="tab"
            aria-selected={siteId === 0}
            className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", siteId === 0 ? "bg-lime-500 text-ink-500" : "bg-white text-ink-400 shadow-sm hover:text-teal-500")}
          >
            Account level &amp; disclosures
          </Link>
        )}
      </div>
      {hasSiteFields && sites.length === 0 && siteId !== 0 && <Alert tone="info">Add sites to the account to enter site-level data.</Alert>}
      <EntryForm key={`${groupKey}-${siteId}`} periodId={period.id} group={groupKey} siteId={siteId} rows={rows} locked={locked} />
    </>
  );
}
