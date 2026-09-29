/**
 * The ESGCounts XBRL taxonomy: one concept per GRI catalogue field.
 * Served as a schema at /xbrl/esgcounts-2026.xsd and referenced by Inline XBRL exports.
 * See docs/specs/XBRL.md for how this relates to the official ESRS taxonomy.
 */
import { GROUP_OF_FIELD, GROUP_BY_KEY, KPI_GROUPS, groupFields, type Field } from "@/lib/gri/catalog";
import type { Dimension } from "@/lib/gri/units";

export const TAXONOMY_NS = "https://esgcounts.eu/xbrl/2026";
export const UNIT_NS = "https://esgcounts.eu/xbrl/units";
export const SCHEMA_PATH = "/xbrl/esgcounts-2026.xsd";
export const ENTITY_SCHEME = "https://esgcounts.eu/account";

export function conceptName(key: string) {
  return key
    .replace(/^custom:/, "custom_")
    .split(/[_:]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/** XBRL unit id and measure for each dimension. Percentages are reported as ratios (scale -2). */
export const UNITS: Record<Dimension, { id: string; measure: string }> = {
  energy: { id: "GJ", measure: "esgcu:GJ" },
  water: { id: "ML", measure: "esgcu:ML" },
  mass: { id: "t", measure: "esgcu:t" },
  air: { id: "kg", measure: "esgcu:kg" },
  emissions: { id: "tCO2e", measure: "esgcu:tCO2e" },
  hours: { id: "h", measure: "esgcu:h" },
  money: { id: "EUR", measure: "iso4217:EUR" },
  count: { id: "pure", measure: "xbrli:pure" },
  number: { id: "pure", measure: "xbrli:pure" },
  percent: { id: "pure", measure: "xbrli:pure" },
  ratio: { id: "pure", measure: "xbrli:pure" },
  rate: { id: "pure", measure: "xbrli:pure" },
};

function itemType(f: Field) {
  if (f.kind === "text" || f.kind === "choice") return "xbrli:stringItemType";
  if (f.dimension === "money") return "xbrli:monetaryItemType";
  if (f.dimension === "percent" || f.dimension === "ratio" || f.dimension === "rate") return "xbrli:pureItemType";
  return "xbrli:decimalItemType";
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function esrsRef(key: string) {
  const g = GROUP_BY_KEY.get(GROUP_OF_FIELD.get(key) ?? "");
  return g?.standards.find((s) => s.name === "ESRS")?.ref;
}

export function taxonomySchema() {
  const elements = KPI_GROUPS.flatMap((g) =>
    groupFields(g).map((f) => {
      const doc = [f.label, f.code ? `GRI ${f.code}` : null, esrsRef(f.key) ? `ESRS ${esrsRef(f.key)}` : null, f.kind === "computed" ? `Calculated: ${f.formula}` : null]
        .filter(Boolean)
        .join(" | ");
      const balance = f.kind !== "text" && f.kind !== "choice" && f.dimension === "money" ? ' xbrli:balance="debit"' : "";
      return `  <xs:element name="${conceptName(f.key)}" id="esgc_${conceptName(f.key)}" type="${itemType(f)}" substitutionGroup="xbrli:item" xbrli:periodType="duration"${balance} nillable="true">
    <xs:annotation><xs:documentation xml:lang="en">${esc(doc)}</xs:documentation></xs:annotation>
  </xs:element>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- ESGCounts sustainability taxonomy, generated from the GRI catalogue. © ESG COUNTS UAB -->
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:xbrli="http://www.xbrl.org/2003/instance"
  xmlns:link="http://www.xbrl.org/2003/linkbase"
  xmlns:esgc="${TAXONOMY_NS}"
  targetNamespace="${TAXONOMY_NS}"
  elementFormDefault="qualified" attributeFormDefault="unqualified">
  <xs:import namespace="http://www.xbrl.org/2003/instance" schemaLocation="http://www.xbrl.org/2003/xbrl-instance-2003-12-31.xsd"/>
${elements.join("\n")}
</xs:schema>
`;
}
