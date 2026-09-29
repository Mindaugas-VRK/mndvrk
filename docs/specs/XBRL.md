# Digital sustainability reporting (XBRL) — requirements

Source: EFRAG slide "Summary: Digital Sustainability Reporting Taxonomy" (ITCG meeting, 12.10.2023),
saved as [`EFRAG_Digital_Sustainability_Reporting_Taxonomy.png`](./EFRAG_Digital_Sustainability_Reporting_Taxonomy.png).

## What the regulation requires

- The **CSRD** requires EU undertakings to report **EU Taxonomy** disclosures and **ESRS** statements as
  part of the management report, starting from FY 2024 (phased by company size).
- The report is published in the **European Single Electronic Format (ESEF)**, which is based on
  **Inline XBRL** (iXBRL).
- Disclosures must be **tagged** with a digital XBRL taxonomy that has a unique definition for every
  data point. The ESRS XBRL taxonomy (EFRAG, Set 1) has **1,000+ data points**: GHG emissions, water
  and energy consumption, headcount, pollution and many **narrative disclosures**.
- An Inline XBRL report is **human-readable and machine-readable at the same time**: a normal XHTML
  document whose figures carry hidden tags.
- Analysts, investors and regulators can then **identify individual disclosures** and **extract
  numerical data points** automatically.

Regulators: ESMA (ESEF rules), EFRAG (ESRS standards and taxonomy), XBRL International (the standard).

## What ESGCounts does today

Each reporting period can be downloaded as:

| Format | Route | Use |
| --- | --- | --- |
| **Inline XBRL** (`.xhtml`) | `/dashboard/reporting/[id]/export/ixbrl` | Human- and machine-readable report. Every numeric value and disclosure is tagged (`ix:nonFraction` / `ix:nonNumeric`) with context (entity, reporting period) and unit. |
| **Excel** (`.xlsx`) | `/dashboard/reporting/[id]/export/xlsx` | Working file: one sheet per KPI with totals and the full Region / Country / City / Site breakdown, disclosures, sign-offs, audit trail. |
| CSV | `/dashboard/reporting/[id]/export` | Raw data. |
| PDF | GRI report page → Print | Printable report. |

The Inline XBRL uses the **ESGCounts taxonomy** (`https://esgcounts.eu/xbrl/2026`, schema served at
`/xbrl/esgcounts-2026.xsd`), generated from the GRI catalogue in `lib/gri/catalog.ts`. Every concept
records its GRI disclosure code and, where one exists, the matching ESRS disclosure requirement.

## Gaps before an ESEF filing

1. **Map to the official ESRS taxonomy.** Replace ESGCounts concepts with EFRAG ESRS Set 1 elements
   (download the taxonomy package from xbrl.efrag.org) and keep ESGCounts concepts only as extensions.
2. **Entity identifier.** ESEF requires the company **LEI**; ESGCounts currently uses its account ID.
3. **Units.** Use XBRL Units Registry (UTR) measures instead of the ESGCounts unit namespace.
4. **Dimensions.** Site/country breakdowns are in Excel; ESRS dimensional tagging is not yet emitted.
5. **Narratives and EU Taxonomy.** Materiality, policies and EU Taxonomy KPIs are not yet tagged.
6. **Validation and packaging.** Validate with an XBRL processor (e.g. Arelle with ESEF rules) and
   package as a report package with the management report.
