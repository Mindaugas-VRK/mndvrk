import { getAccountContext } from "@/lib/auth/dal";
import { getCustomFields, getPeriod, getSites, loadPeriodData } from "@/lib/data";
import { ALL_FIELDS, GROUP_OF_FIELD, GROUP_BY_KEY, isNumeric, type Field } from "@/lib/gri/catalog";
import { bucketsFor, customFieldToInput } from "@/lib/gri/engine";
import { DIMENSIONS } from "@/lib/gri/units";
import { can } from "@/lib/permissions";
import { slugify } from "@/lib/utils";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection in free text.
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(_req: Request, ctx: RouteContext<"/dashboard/reporting/[id]/export">) {
  const { user, account } = await getAccountContext();
  if (!account || !can(user.role, "data:export")) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const period = getPeriod(Number(id), account.id);
  if (!period) return new Response("Not found", { status: 404 });

  const sites = getSites(account.id);
  const data = loadPeriodData(period.id, account.id);
  const custom = getCustomFields(account.id);
  const buckets = [...bucketsFor("total", sites), ...bucketsFor("region", sites), ...bucketsFor("country", sites), ...bucketsFor("city", sites), ...bucketsFor("site", sites)];
  const getters = buckets.map((b) => data.getter(b));
  const fields: { field: Field; group: string }[] = [
    ...ALL_FIELDS.map((f) => ({ field: f, group: GROUP_BY_KEY.get(GROUP_OF_FIELD.get(f.key)!)!.title })),
    ...custom.map((c) => ({ field: customFieldToInput(c) as Field, group: `${GROUP_BY_KEY.get(c.groupKey)?.title ?? c.groupKey} (custom)` })),
  ];

  const lines: unknown[][] = [
    ["Account", account.name],
    ["Reporting period", period.title, period.startDate, period.endDate],
    ["Status", period.status],
    [],
    ["KPI", "GRI", "Indicator", "Type", "Unit", ...buckets.map((b) => (b.key === "total" ? "Total" : `${b.key.split(":")[0]}: ${b.label}`))],
  ];
  for (const { field: f, group } of fields) {
    if (isNumeric(f)) {
      lines.push([group, f.code ?? "", f.label, f.kind === "computed" ? "rollup" : "input", DIMENSIONS[f.dimension].canonical, ...getters.map((g) => g(f.key) ?? "")]);
    } else {
      lines.push([group, f.code ?? "", f.label, "disclosure", "", data.text(f.key)]);
    }
  }
  const csv = "﻿" + lines.map((l) => l.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="esgcounts-${slugify(account.name)}-${slugify(period.title)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
