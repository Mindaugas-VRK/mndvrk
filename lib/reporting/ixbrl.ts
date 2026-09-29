import "server-only";
import fs from "node:fs";
import path from "node:path";
import { KPI_GROUPS, PILLARS, groupFields, isNumeric, type ComputedField, type InputField } from "@/lib/gri/catalog";
import { DIMENSIONS, formatNumber } from "@/lib/gri/units";
import { COMPANY_LEGAL_NAME, SITE_URL } from "@/lib/utils";
import type { ReportData } from "./context";
import { ENTITY_SCHEME, SCHEMA_PATH, TAXONOMY_NS, UNIT_NS, UNITS, conceptName, esrsRef } from "./taxonomy";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const STATUS_LABEL = { draft: "Draft", in_review: "Prepared, in review", reviewed: "Reviewed, awaiting approval", approved: "Approved" } as const;

/** Inline logo so the file stays a single self-contained document. */
function logoDataUri() {
  try {
    const svg = fs.readFileSync(path.join(process.cwd(), "public/brand/logo-color.svg"));
    return `data:image/svg+xml;base64,${svg.toString("base64")}`;
  } catch {
    return null;
  }
}

/** A tagged numeric fact. Values render with thousands separators (ixt:num-dot-decimal). */
function numericFact(f: InputField | ComputedField, value: number) {
  const percent = f.dimension === "percent";
  const shown = Math.abs(value);
  const digits = 2;
  const text = shown.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const scale = percent ? ' scale="-2"' : "";
  const decimals = percent ? digits + 2 : digits;
  const sign = value < 0 ? ' sign="-"' : "";
  const unit = DIMENSIONS[f.dimension].canonical;
  const suffix = percent ? "%" : unit === ":1" ? ":1" : unit ? ` ${esc(unit)}` : "";
  return `${value < 0 ? "−" : ""}<ix:nonFraction name="esgc:${conceptName(f.key)}" contextRef="c_total" unitRef="u_${UNITS[f.dimension].id}" decimals="${decimals}"${scale}${sign} format="ixt:num-dot-decimal">${text}</ix:nonFraction>${suffix}`;
}

export function buildInlineXbrl(r: ReportData) {
  const total = r.data.total();
  const usedUnits = new Map<string, string>();
  const rows: string[] = [];

  for (const g of KPI_GROUPS) {
    rows.push(`<section class="kpi"><p class="eyebrow">${esc(PILLARS[g.pillar].title)}</p><h2>${esc(g.title)}</h2>
<p class="std">${g.standards.map((s) => `${esc(s.name)} ${esc(s.ref)}`).join(" · ")}</p>
<table><thead><tr><th class="code">GRI</th><th>Disclosure</th><th class="num">Value</th></tr></thead><tbody>`);
    for (const d of g.disclosures) {
      rows.push(`<tr class="disc"><td colspan="3">${esc(d.code)} · ${esc(d.title)}</td></tr>`);
      for (const f of d.fields) {
        let cell = '<span class="nr">Not reported</span>';
        if (isNumeric(f)) {
          const v = total(f.key);
          if (v !== null) {
            usedUnits.set(UNITS[f.dimension].id, UNITS[f.dimension].measure);
            cell = numericFact(f, v);
          }
        } else {
          const t = r.data.text(f.key);
          if (t) cell = `<ix:nonNumeric name="esgc:${conceptName(f.key)}" contextRef="c_total">${esc(t)}</ix:nonNumeric>`;
        }
        const cls = f.kind === "computed" ? ' class="calc"' : "";
        rows.push(`<tr${cls}><td class="code">${esc(f.code ?? "")}</td><td style="padding-left:${0.5 + (f.indent ?? 0)}rem">${esc(f.label)}</td><td class="num${f.kind === "text" ? " txt" : ""}">${cell}</td></tr>`);
      }
    }
    rows.push("</tbody></table></section>");
  }

  // Organisation-specific KPIs are shown but not tagged: they are not part of the shared taxonomy.
  if (r.custom.length) {
    rows.push('<section class="kpi"><h2>Organisation-specific KPIs</h2><table><tbody>');
    for (const c of r.custom) {
      const v = total(`custom:${c.id}`);
      rows.push(`<tr><td>${esc(c.label)}</td><td class="num">${v === null ? '<span class="nr">Not reported</span>' : esc(formatNumber(v))}</td></tr>`);
    }
    rows.push("</tbody></table></section>");
  }

  const units = [...usedUnits.entries()]
    .map(([id, measure]) => `<xbrli:unit id="u_${id}"><xbrli:measure>${measure}</xbrli:measure></xbrli:unit>`)
    .join("\n        ");
  const sign = (s: "prepared" | "reviewed" | "approved") =>
    `<div><p class="lbl">${s[0].toUpperCase() + s.slice(1)}</p><p class="who">${esc(r.signoffs[s]?.name ?? "—")}</p><p class="lbl">${r.signoffs[s] ? r.signoffs[s]!.at.toISOString().slice(0, 10) : ""}</p></div>`;
  const logo = logoDataUri();

  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
  xmlns:ixt="http://www.xbrl.org/inlineXBRL/transformation/2020-02-12"
  xmlns:xbrli="http://www.xbrl.org/2003/instance"
  xmlns:link="http://www.xbrl.org/2003/linkbase"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:iso4217="http://www.xbrl.org/2003/iso4217"
  xmlns:esgc="${TAXONOMY_NS}"
  xmlns:esgcu="${UNIT_NS}"
  xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>${esc(r.account.name)} · ${esc(r.period.title)} · Sustainability report</title>
  <style type="text/css">
    body { font-family: Oxygen, "Segoe UI", Arial, sans-serif; color: #283739; margin: 0; background: #f5f5f5; }
    .page { max-width: 900px; margin: 24px auto; background: #fff; padding: 48px; }
    h1, h2 { font-family: Quicksand, "Segoe UI", Arial, sans-serif; }
    h1 { font-size: 28px; margin: 8px 0 0; }
    h2 { color: #2c5d63; font-size: 20px; margin: 4px 0; }
    .rule { width: 34px; height: 3px; background: #a9c52f; margin: 16px 0; }
    .eyebrow, .lbl { font-size: 11px; letter-spacing: .2em; text-transform: uppercase; color: #9ca3af; margin: 0; }
    .std { font-size: 12px; color: #606b6c; margin: 0 0 8px; }
    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #c4d2d3; padding-bottom: 24px; }
    section.kpi { margin-top: 36px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #606b6c; border-bottom: 2px solid #2c5d63; padding: 6px 4px; }
    td { border-bottom: 1px solid #e1e8e9; padding: 6px 4px; vertical-align: top; }
    tr.disc td { background: #f9fbe7; color: #2c5d63; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    tr.calc td { font-weight: bold; }
    .code { width: 90px; color: #9ca3af; font-size: 11px; }
    .num { text-align: right; white-space: nowrap; width: 220px; }
    .num.txt { white-space: pre-line; text-align: left; }
    .nr { color: #9ca3af; font-weight: normal; }
    .signs { display: flex; gap: 32px; margin-top: 48px; border-top: 1px solid #c4d2d3; padding-top: 16px; }
    .who { font-weight: bold; margin: 2px 0; }
    footer { margin-top: 32px; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div style="display:none">
    <ix:header>
      <ix:references>
        <link:schemaRef xlink:type="simple" xlink:href="${esc(SITE_URL + SCHEMA_PATH)}"/>
      </ix:references>
      <ix:resources>
        <xbrli:context id="c_total">
          <xbrli:entity><xbrli:identifier scheme="${ENTITY_SCHEME}">${r.account.id}</xbrli:identifier></xbrli:entity>
          <xbrli:period><xbrli:startDate>${esc(r.period.startDate)}</xbrli:startDate><xbrli:endDate>${esc(r.period.endDate)}</xbrli:endDate></xbrli:period>
        </xbrli:context>
        ${units}
      </ix:resources>
    </ix:header>
  </div>
  <div class="page">
    <header>
      <div>
        <p class="eyebrow">Sustainability report · GRI · Inline XBRL</p>
        <h1>${esc(r.account.name)}</h1>
        <div class="rule"></div>
        <p>${esc(r.period.title)} · ${esc(r.period.startDate)} to ${esc(r.period.endDate)} · ${STATUS_LABEL[r.period.status]}</p>
      </div>
      ${logo ? `<img src="${logo}" alt="ESGCounts" style="height:32px"/>` : ""}
    </header>
    <section class="kpi">
      <h2>Statement of use</h2>
      <p>${esc(r.account.name)} has reported the information in this report for the period ${esc(r.period.startDate)} to ${esc(r.period.endDate)} with reference to the GRI Standards. Data covers ${r.sites.length} site${r.sites.length === 1 ? "" : "s"}${r.sites.length ? `: ${esc(r.sites.map((s) => s.name).join(", "))}` : ""}.</p>
      <p><strong>Material topics:</strong> ${esc(r.materialTopics.map((t) => t.title).join(" · ") || "None identified")}</p>
    </section>
    ${rows.join("\n")}
    <div class="signs">${sign("prepared")}${sign("reviewed")}${sign("approved")}</div>
    <footer>Generated by ESGCounts (${esc(SITE_URL)}) · ${esc(COMPANY_LEGAL_NAME)} · Tagged with the ESGCounts taxonomy ${esc(TAXONOMY_NS)}; ESRS references: ${esc([...new Set(KPI_GROUPS.flatMap((g) => groupFields(g).map((f) => esrsRef(f.key))).filter(Boolean))].join(", "))}.</footer>
  </div>
</body>
</html>
`;
}
