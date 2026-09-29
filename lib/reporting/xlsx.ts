import "server-only";
import ExcelJS from "exceljs";
import { KPI_GROUPS, PILLARS, isNumeric, type Field } from "@/lib/gri/catalog";
import { bucketsFor, customFieldToInput } from "@/lib/gri/engine";
import { DIMENSIONS } from "@/lib/gri/units";
import { COMPANY_LEGAL_NAME } from "@/lib/utils";
import type { ReportData } from "./context";

// Brand colours (brand/BRAND.md), as ARGB for Excel.
const TEAL = "FF2C5D63";
const LIME = "FFA9C52F";
const INK = "FF283739";
const CREAM = "FFF9FBE7";
const MINT = "FFDAECE6";
const STONE = "FF9CA3AF";

const STATUS = { draft: "Draft", in_review: "Prepared, in review", reviewed: "Reviewed, awaiting approval", approved: "Approved" } as const;

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 30;
}

/** Strip floating-point noise (3203.5799999999995 → 3203.58) without losing real precision. */
function round(v: number | null) {
  return v === null ? null : Math.round(v * 1e6) / 1e6;
}

function numFmt(dimension: string) {
  if (dimension === "percent") return '0.0"%"';
  if (dimension === "count") return "#,##0";
  return "#,##0.00";
}

/** Excel sheet names: max 31 chars, no []:*?/\ */
function sheetName(s: string) {
  return s.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);
}

export async function buildWorkbook(r: ReportData) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ESGCounts";
  wb.company = COMPANY_LEGAL_NAME;
  wb.title = `${r.account.name} – ${r.period.title}`;
  wb.created = new Date();

  // --- Summary ---------------------------------------------------------
  const sum = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  sum.columns = [{ width: 30 }, { width: 70 }];
  sum.addRow(["ESGCounts sustainability report"]).font = { bold: true, size: 18, color: { argb: TEAL } };
  sum.addRow([`${r.account.name} · ${r.period.title}`]).font = { size: 12, color: { argb: INK } };
  const rule = sum.addRow([""]);
  rule.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIME } };
  rule.height = 4;
  sum.addRow([]);
  const facts: [string, string][] = [
    ["Account", r.account.name],
    ["Industry", r.account.industry || "—"],
    ["Reporting period", `${r.period.startDate} to ${r.period.endDate}`],
    ["Framework", r.period.framework],
    ["Status", STATUS[r.period.status]],
    ["Report owner", r.period.owner ?? "—"],
    ["Sites", r.sites.map((s) => `${s.name} (${[s.city, s.country, s.region].filter(Boolean).join(", ")})`).join("; ") || "—"],
    ["Material topics", r.materialTopics.map((t) => t.title).join(", ") || "—"],
    ["Prepared", r.signoffs.prepared ? `${r.signoffs.prepared.name ?? "—"} · ${r.signoffs.prepared.at.toISOString().slice(0, 10)}` : "—"],
    ["Reviewed", r.signoffs.reviewed ? `${r.signoffs.reviewed.name ?? "—"} · ${r.signoffs.reviewed.at.toISOString().slice(0, 10)}` : "—"],
    ["Approved", r.signoffs.approved ? `${r.signoffs.approved.name ?? "—"} · ${r.signoffs.approved.at.toISOString().slice(0, 10)}` : "—"],
    ["Generated", new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC"],
  ];
  for (const [k, v] of facts) {
    const row = sum.addRow([k, v]);
    row.getCell(1).font = { bold: true, color: { argb: INK } };
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }
  sum.addRow([]);
  sum.addRow(["Units: energy in GJ, water in megalitres, waste and materials in tonnes, air emissions in kg, GHG in tCO₂e. Σ rows are calculated rollups."]).font = { italic: true, color: { argb: STONE } };

  // --- One sheet per KPI group, with the full hierarchy breakdown ------
  const buckets = [
    ...bucketsFor("total", r.sites),
    ...bucketsFor("region", r.sites),
    ...bucketsFor("country", r.sites),
    ...bucketsFor("city", r.sites),
    ...bucketsFor("site", r.sites),
  ];
  const getters = buckets.map((b) => r.data.getter(b));
  const colLabel = (key: string, label: string) => (key === "total" ? "Total" : `${key.split(":")[0][0].toUpperCase()}${key.split(":")[0].slice(1)}: ${label}`);

  for (const g of KPI_GROUPS) {
    const ws = wb.addWorksheet(sheetName(g.title), { views: [{ state: "frozen", xSplit: 3, ySplit: 3 }] });
    ws.columns = [{ width: 14 }, { width: 60 }, { width: 12 }, ...buckets.map(() => ({ width: 16 }))];
    ws.addRow([`${PILLARS[g.pillar].title} · ${g.title}`]).font = { bold: true, size: 14, color: { argb: TEAL } };
    ws.addRow([g.standards.map((s) => `${s.name} ${s.ref}`).join("  ·  ")]).font = { color: { argb: STONE } };
    styleHeader(ws.addRow(["GRI", "Indicator", "Unit", ...buckets.map((b) => colLabel(b.key, b.label))]));

    const custom = r.custom.filter((c) => c.groupKey === g.key).map(customFieldToInput) as Field[];
    const disclosures = [...g.disclosures, ...(custom.length ? [{ code: "Custom", title: "Organisation-specific KPIs", fields: custom }] : [])];
    for (const d of disclosures) {
      const dr = ws.addRow([d.code, d.title]);
      dr.font = { bold: true, color: { argb: TEAL } };
      dr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
      for (const f of d.fields) {
        if (isNumeric(f)) {
          const row = ws.addRow([
            f.code ?? "",
            `${"   ".repeat(f.indent ?? 0)}${f.label}${f.kind === "computed" ? "  Σ" : ""}`,
            DIMENSIONS[f.dimension].canonical,
            ...getters.map((get) => round(get(f.key))),
          ]);
          for (let i = 4; i < 4 + buckets.length; i++) row.getCell(i).numFmt = numFmt(f.dimension);
          if (f.kind === "computed") {
            row.font = { bold: true };
            row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MINT } };
            row.getCell(2).note = f.formula;
          }
        } else {
          const row = ws.addRow([f.code ?? "", f.label, "text", r.data.text(f.key) || "—"]);
          row.getCell(4).alignment = { wrapText: true, vertical: "top" };
          ws.mergeCells(row.number, 4, row.number, Math.max(4, 3 + Math.min(buckets.length, 4)));
        }
      }
    }
  }

  // --- Raw inputs with references (meter numbers) and comments ----------
  const inputs = wb.addWorksheet("Inputs", { views: [{ state: "frozen", ySplit: 1 }] });
  inputs.columns = [
    { header: "Site", width: 24 },
    { header: "Region", width: 14 },
    { header: "Country", width: 14 },
    { header: "City", width: 14 },
    { header: "GRI", width: 12 },
    { header: "Indicator", width: 50 },
    { header: "Value (as entered)", width: 18 },
    { header: "Unit entered", width: 12 },
    { header: "Reference / meter", width: 20 },
    { header: "Comment", width: 40 },
  ];
  styleHeader(inputs.getRow(1));
  const siteById = new Map(r.sites.map((s) => [s.id, s]));
  for (const e of r.data.allEntries()) {
    const f = r.data.field(e.fieldKey);
    if (!f || f.kind !== "input" || e.value === null) continue;
    const s = siteById.get(e.siteId);
    inputs.addRow([s?.name ?? "Account level", s?.region ?? "", s?.country ?? "", s?.city ?? "", f.code ?? "", f.label, e.value, DIMENSIONS[f.dimension].units[e.unit]?.label ?? e.unit, e.reference, e.comment]);
  }
  inputs.autoFilter = { from: "A1", to: "J1" };

  // --- Audit trail ---------------------------------------------------------
  const audit = wb.addWorksheet("Audit trail", { views: [{ state: "frozen", ySplit: 1 }] });
  audit.columns = [
    { header: "When (UTC)", width: 20 },
    { header: "Who", width: 26 },
    { header: "Action", width: 30 },
    { header: "Detail", width: 60 },
  ];
  styleHeader(audit.getRow(1));
  for (const a of r.activity) audit.addRow([a.at.toISOString().replace("T", " ").slice(0, 19), a.user ?? "—", a.action, a.detail]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
