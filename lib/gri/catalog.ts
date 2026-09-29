/**
 * GRI indicator catalogue, transcribed from docs/specs/GRI_indicators_to_report_on.xlsx.
 *
 * - `input` fields are entered by users, per site (level "site") or once per account
 *   (level "account"). Site values roll up Site → City → Country → Region → Total.
 * - `computed` fields are rollups/formulas evaluated at every level from the inputs.
 * - `text` / `choice` fields are qualitative disclosures, entered per account.
 */
import type { Dimension } from "./units";

export type Getter = (key: string) => number | null;

type Base = { key: string; code?: string; label: string; hint?: string; indent?: number };

export type InputField = Base & { kind: "input"; dimension: Dimension; level: "site" | "account" };
export type ComputedField = Base & {
  kind: "computed";
  dimension: Dimension;
  formula: string;
  deps: string[];
  compute: (v: Getter) => number | null;
};
export type TextField = Base & { kind: "text"; level: "account"; multiline?: boolean };
export type ChoiceField = Base & { kind: "choice"; level: "account"; options: string[] };
export type Field = InputField | ComputedField | TextField | ChoiceField;

export type Disclosure = { code: string; title: string; fields: Field[] };

export type PillarKey = "environment" | "health-safety" | "people" | "transparency";

export type KpiGroup = {
  key: string;
  pillar: PillarKey;
  title: string;
  description: string;
  standards: { name: string; ref: string; text: string }[];
  /** Fields charted on the KPI page and dashboard. */
  headline: string[];
  disclosures: Disclosure[];
};

export const PILLARS: Record<PillarKey, { title: string }> = {
  environment: { title: "Environment" },
  "health-safety": { title: "Health and safety" },
  people: { title: "People" },
  transparency: { title: "Transparency" },
};

// ---------- helpers ----------

export function sum(v: Getter, keys: string[]) {
  let total = 0;
  let any = false;
  for (const k of keys) {
    const x = v(k);
    if (x !== null) {
      total += x;
      any = true;
    }
  }
  return any ? total : null;
}

function div(a: number | null, b: number | null, scale = 1) {
  if (a === null || b === null || b === 0) return null;
  return (a / b) * scale;
}

const input = (key: string, label: string, dimension: Dimension, extra: Partial<InputField> = {}): InputField => ({
  key, label, dimension, kind: "input", level: "site", ...extra,
});
const accountInput = (key: string, label: string, dimension: Dimension, extra: Partial<InputField> = {}): InputField =>
  input(key, label, dimension, { level: "account", ...extra });
const total = (key: string, label: string, dimension: Dimension, deps: string[], extra: Partial<ComputedField> = {}): ComputedField => ({
  key, label, dimension, kind: "computed", deps, formula: "Sum of breakdown", compute: (v) => sum(v, deps), ...extra,
});
const text = (key: string, label: string, extra: Partial<TextField> = {}): TextField => ({
  key, label, kind: "text", level: "account", multiline: true, ...extra,
});

function ghgDisclosures(prefix: string): Field[] {
  return [
    text(`${prefix}_base_year`, "Base year for the calculation", { multiline: false }),
    text(`${prefix}_ef_source`, "Source of the emission factors and the global warming potential (GWP) rates used"),
    {
      key: `${prefix}_consolidation`,
      label: "Consolidation approach for emissions",
      kind: "choice",
      level: "account",
      options: ["Equity share", "Financial control", "Operational control"],
    },
    text(`${prefix}_methodology`, "Standards, methodologies, assumptions, and/or calculation tools used"),
  ];
}

const SCOPE3 = [
  ["purchased_goods", "Purchased goods and services"],
  ["capital_goods", "Capital goods"],
  ["fuel_energy", "Fuel- and energy-related activities (not included in Scopes 1 or 2)"],
  ["upstream_transport", "Upstream transportation and distribution"],
  ["waste", "Waste generated in operations"],
  ["business_travel", "Business travel"],
  ["commuting", "Employee commuting"],
  ["upstream_leased", "Upstream leased assets"],
  ["investments", "Investments"],
  ["downstream_transport", "Downstream transportation and distribution"],
  ["processing", "Processing of sold products"],
  ["use_of_products", "Use of sold products"],
  ["end_of_life", "End-of-life treatment of sold products"],
  ["downstream_leased", "Downstream leased assets"],
  ["franchises", "Franchises"],
] as const;

const WATER_SOURCES = [
  ["surface", "Surface water"],
  ["ground", "Groundwater"],
  ["sea", "Seawater"],
  ["produced", "Produced water"],
  ["third_party", "Third-party water"],
] as const;

const RECOVERY = [
  ["reuse", "Preparation for reuse"],
  ["recycling", "Recycling"],
  ["other", "Other recovery operations"],
] as const;

const DISPOSAL = [
  ["incin_recovery", "Incineration (with energy recovery)"],
  ["incin_no_recovery", "Incineration (without energy recovery)"],
  ["landfill", "Landfilling"],
  ["other", "Other disposal operations"],
] as const;

const EMPLOYEE_TYPES = [
  ["all", "a", "Total number of employees"],
  ["permanent", "b-i", "Permanent employees"],
  ["temporary", "b-ii", "Temporary employees"],
  ["nonguaranteed", "b-iii", "Non-guaranteed hours employees"],
  ["fulltime", "b-iv", "Full-time employees"],
  ["parttime", "b-v", "Part-time employees"],
] as const;

function injuryBlock(prefix: string, letter: string): Field[] {
  const hours = `${prefix}_hours`;
  const rows: Field[] = [];
  const kinds = [
    ["fatalities", "i", "Fatalities as a result of work-related injury"],
    ["high_consequence", "ii", "High-consequence work-related injuries (excluding fatalities)"],
    ["recordable", "iii", "Recordable work-related injuries"],
  ] as const;
  for (const [k, roman, label] of kinds) {
    rows.push(input(`${prefix}_${k}`, label, "count", { code: `403-9 ${letter}-${roman}` }));
    rows.push({
      key: `${prefix}_${k}_rate`,
      code: `403-9 ${letter}-${roman}`,
      label: `Rate: ${label.toLowerCase()}`,
      kind: "computed",
      dimension: "rate",
      indent: 1,
      deps: [`${prefix}_${k}`, hours],
      formula: "Number ÷ hours worked × 1,000,000",
      compute: (v) => div(v(`${prefix}_${k}`), v(hours), 1_000_000),
    });
  }
  rows.push(text(`${prefix}_injury_types`, "The main types of work-related injury", { code: `403-9 ${letter}-iv` }));
  rows.push(input(hours, "Hours worked", "hours", { code: `403-9 ${letter}-v` }));
  return rows;
}

// ---------- catalogue ----------

export const KPI_GROUPS: KpiGroup[] = [
  {
    key: "energy",
    pillar: "environment",
    title: "Energy",
    description: "Energy consumed within and outside the organisation, and energy intensity.",
    standards: [
      { name: "GRI", ref: "302-1, 302-2, 302-3", text: "GRI 302: Energy 2016" },
      { name: "SDG", ref: "7, 8, 12, 13", text: "Affordable and clean energy; climate action" },
      { name: "UNGC", ref: "7–9", text: "Environment principles" },
      { name: "ESRS", ref: "E1-5", text: "Energy consumption and mix" },
    ],
    headline: ["energy_total"],
    disclosures: [
      {
        code: "302-1",
        title: "Energy consumption within the organisation",
        fields: [
          input("fuel_nonrenewable", "Total fuel consumption from non-renewable sources", "energy", { code: "302-1 a", hint: "Include the fuel types used in the comment." }),
          input("fuel_renewable", "Total fuel consumption from renewable sources", "energy", { code: "302-1 b", hint: "Include the fuel types used in the comment." }),
          input("electricity_consumed", "Electricity consumption", "energy", { code: "302-1 c-i", hint: "Meter reading in kWh; add the meter number as reference." }),
          input("heating_consumed", "Heating consumption", "energy", { code: "302-1 c-ii" }),
          input("cooling_consumed", "Cooling consumption", "energy", { code: "302-1 c-iii" }),
          input("steam_consumed", "Steam consumption", "energy", { code: "302-1 c-iv" }),
          input("self_generated_not_consumed", "Self-generated energy not consumed", "energy", { hint: "Needed for the total; not a disclosure requirement." }),
          input("electricity_sold", "Electricity sold", "energy", { code: "302-1 d-i" }),
          input("heating_sold", "Heating sold", "energy", { code: "302-1 d-ii" }),
          input("cooling_sold", "Cooling sold", "energy", { code: "302-1 d-iii" }),
          input("steam_sold", "Steam sold", "energy", { code: "302-1 d-iv" }),
          {
            key: "energy_total",
            code: "302-1 e",
            label: "Total energy consumption within the organisation",
            kind: "computed",
            dimension: "energy",
            deps: ["fuel_nonrenewable", "fuel_renewable", "electricity_consumed", "heating_consumed", "cooling_consumed", "steam_consumed", "self_generated_not_consumed", "electricity_sold", "heating_sold", "cooling_sold", "steam_sold"],
            formula: "a + b + c (consumed) + self-generated not consumed − d (sold)",
            compute: (v) => {
              const plus = sum(v, ["fuel_nonrenewable", "fuel_renewable", "electricity_consumed", "heating_consumed", "cooling_consumed", "steam_consumed", "self_generated_not_consumed"]);
              const minus = sum(v, ["electricity_sold", "heating_sold", "cooling_sold", "steam_sold"]);
              if (plus === null && minus === null) return null;
              return (plus ?? 0) - (minus ?? 0);
            },
          },
          text("energy_methodology", "Standards, methodologies, assumptions, and/or calculation tools used", { code: "302-1 f" }),
          text("energy_conversion_source", "Source of the conversion factors used", { code: "302-1 g" }),
        ],
      },
      {
        code: "302-2",
        title: "Energy consumption outside the organisation",
        fields: [
          input("energy_outside", "Energy consumption outside of the organisation", "energy", { code: "302-2 a", level: "account", hint: "Upstream and downstream activities." }),
        ],
      },
      {
        code: "302-3",
        title: "Energy intensity",
        fields: [
          accountInput("energy_denominator", "Organisation-specific metric (denominator)", "number", { hint: "Free choice per account, e.g. floor area in m² or units produced." }),
          text("energy_denominator_label", "What the denominator measures", { multiline: false, hint: "e.g. m² of premises, number of products manufactured" }),
          {
            key: "energy_intensity",
            code: "302-3 a",
            label: "Energy intensity ratio",
            kind: "computed",
            dimension: "number",
            deps: ["energy_total", "energy_denominator"],
            formula: "Total energy consumption (302-1 e) ÷ organisation-specific metric, GJ per unit",
            compute: (v) => div(v("energy_total"), v("energy_denominator")),
          },
        ],
      },
    ],
  },
  {
    key: "emissions",
    pillar: "environment",
    title: "GHG emissions",
    description: "Scope 1, 2 and 3 greenhouse gas emissions, intensity and other air emissions.",
    standards: [
      { name: "GRI", ref: "305-1, 305-2, 305-3, 305-4, 305-7", text: "GRI 305: Emissions 2016" },
      { name: "SDG", ref: "3, 12, 13, 14, 15", text: "Climate action; life below water; life on land" },
      { name: "UNGC", ref: "7–9", text: "Environment principles" },
      { name: "ESRS", ref: "E1-6, E2-4", text: "Gross Scopes 1, 2, 3 and total GHG emissions; pollution" },
    ],
    headline: ["scope1_total", "scope2_location", "scope3_total"],
    disclosures: [
      {
        code: "305-1",
        title: "Direct (Scope 1) GHG emissions",
        fields: [
          input("s1_natural_gas", "Natural gas", "emissions", { indent: 1, hint: "Energy from 302-1 × country/fuel-specific conversion factors." }),
          input("s1_heating_oil", "Heating oil", "emissions", { indent: 1 }),
          input("s1_lpg", "LPG", "emissions", { indent: 1 }),
          input("s1_transport_fuel", "Fuel for transportation and on-site handling", "emissions", { indent: 1 }),
          input("s1_other", "Other energies", "emissions", { indent: 1 }),
          input("s1_company_cars", "Company cars", "emissions", { indent: 1 }),
          total("scope1_total", "Gross direct (Scope 1) GHG emissions", "emissions", ["s1_natural_gas", "s1_heating_oil", "s1_lpg", "s1_transport_fuel", "s1_other", "s1_company_cars"], { code: "305-1 a" }),
          {
            key: "scope1_gases",
            code: "305-1 b",
            label: "Gases included in the calculation",
            kind: "choice",
            level: "account",
            options: ["All", "CO₂", "CH₄", "N₂O", "HFCs", "PFCs", "SF₆", "NF₃"],
          },
          ...ghgDisclosures("scope1"),
        ],
      },
      {
        code: "305-2",
        title: "Energy indirect (Scope 2) GHG emissions",
        fields: [
          input("s2_electricity", "Electricity", "emissions", { indent: 1 }),
          input("s2_steam_heat_cold", "Steam, heating, cooling", "emissions", { indent: 1 }),
          total("scope2_location", "Gross location-based energy indirect (Scope 2) GHG emissions", "emissions", ["s2_electricity", "s2_steam_heat_cold"], { code: "305-2 a" }),
          input("scope2_market", "Gross market-based energy indirect (Scope 2) GHG emissions", "emissions", { code: "305-2 b" }),
          ...ghgDisclosures("scope2"),
        ],
      },
      {
        code: "305-3",
        title: "Other indirect (Scope 3) GHG emissions",
        fields: [
          ...SCOPE3.map(([k, label]) =>
            input(`s3_${k}`, label, "emissions", { indent: 1, level: "account", hint: k === "purchased_goods" ? "Primary data usually comes from third parties (supplier, customer and employee surveys)." : undefined }),
          ),
          total("scope3_total", "Gross other indirect (Scope 3) GHG emissions", "emissions", SCOPE3.map(([k]) => `s3_${k}`), { code: "305-3 a" }),
        ],
      },
      {
        code: "305-4",
        title: "GHG emissions intensity",
        fields: [
          accountInput("ghg_denominator", "Organisation-specific metric (denominator)", "number", { code: "305-4 b" }),
          text("ghg_denominator_label", "What the denominator measures", { multiline: false }),
          {
            key: "ghg_intensity",
            code: "305-4 a",
            label: "GHG emissions intensity ratio (Scope 1 + 2)",
            kind: "computed",
            dimension: "number",
            deps: ["scope1_total", "scope2_location", "ghg_denominator"],
            formula: "(Scope 1 + Scope 2 location-based) ÷ denominator, tCO₂e per unit",
            compute: (v) => div(sum(v, ["scope1_total", "scope2_location"]), v("ghg_denominator")),
          },
        ],
      },
      {
        code: "305-7",
        title: "NOx, SOx and other significant air emissions",
        fields: [
          input("air_nox", "NOx", "air", { code: "305-7 a-i" }),
          input("air_sox", "SOx", "air", { code: "305-7 a-ii" }),
          input("air_pop", "Persistent organic pollutants (POP)", "air", { code: "305-7 a-iii" }),
          input("air_voc", "Volatile organic compounds (VOC)", "air", { code: "305-7 a-iv" }),
          input("air_hap", "Hazardous air pollutants (HAP)", "air", { code: "305-7 a-v" }),
          input("air_pm", "Particulate matter (PM)", "air", { code: "305-7 a-vi" }),
          input("air_other", "Other standard categories of air emissions identified in relevant regulations", "air", { code: "305-7 a-vii" }),
        ],
      },
    ],
  },
  {
    key: "water",
    pillar: "environment",
    title: "Water",
    description: "Water withdrawal, discharge and consumption, including areas with water stress.",
    standards: [
      { name: "GRI", ref: "303-3, 303-4, 303-5", text: "GRI 303: Water and Effluents 2018" },
      { name: "SDG", ref: "6", text: "Clean water and sanitation" },
      { name: "UNGC", ref: "7–9", text: "Environment principles" },
      { name: "ESRS", ref: "E3-4", text: "Water consumption" },
    ],
    headline: ["water_withdrawal", "water_consumption"],
    disclosures: [
      {
        code: "303-3",
        title: "Water withdrawal",
        fields: [
          ...WATER_SOURCES.map(([k, label], i) => input(`ww_${k}`, label, "water", { indent: 1, code: `303-3 a-${["i", "ii", "iii", "iv", "v"][i]}` })),
          total("water_withdrawal", "Total water withdrawal from all areas", "water", WATER_SOURCES.map(([k]) => `ww_${k}`), { code: "303-3 a" }),
          ...WATER_SOURCES.map(([k, label], i) => input(`wws_${k}`, label, "water", { indent: 1, code: `303-3 b-${["i", "ii", "iii", "iv", "v"][i]}` })),
          total("water_withdrawal_stress", "Total water withdrawal from all areas with water stress", "water", WATER_SOURCES.map(([k]) => `wws_${k}`), { code: "303-3 b" }),
        ],
      },
      {
        code: "303-4",
        title: "Water discharge",
        fields: [
          input("wd_surface", "Surface water", "water", { indent: 1, code: "303-4 b-i" }),
          input("wd_ground", "Groundwater", "water", { indent: 1, code: "303-4 b-ii" }),
          input("wd_sea", "Seawater", "water", { indent: 1, code: "303-4 b-iii" }),
          input("wd_third_party", "Third-party water (incl. volume sent for use to other organisations)", "water", { indent: 1, code: "303-4 b-iv" }),
          total("water_discharge", "Total water discharge to all areas", "water", ["wd_surface", "wd_ground", "wd_sea", "wd_third_party"], { code: "303-4 a" }),
          input("water_discharge_stress", "Total water discharge to all areas with water stress", "water", { code: "303-4 c" }),
        ],
      },
      {
        code: "303-5",
        title: "Water consumption",
        fields: [
          {
            key: "water_consumption",
            code: "303-5 a",
            label: "Total water consumption from all areas",
            kind: "computed",
            dimension: "water",
            deps: ["water_withdrawal", "water_discharge"],
            formula: "Total water withdrawal − total water discharge",
            compute: (v) => (v("water_withdrawal") === null ? null : (v("water_withdrawal") ?? 0) - (v("water_discharge") ?? 0)),
          },
          {
            key: "water_consumption_stress",
            code: "303-5 b",
            label: "Total water consumption from all areas with water stress",
            kind: "computed",
            dimension: "water",
            deps: ["water_withdrawal_stress", "water_discharge_stress"],
            formula: "Water withdrawal in water-stress areas − water discharge in water-stress areas",
            compute: (v) => (v("water_withdrawal_stress") === null ? null : (v("water_withdrawal_stress") ?? 0) - (v("water_discharge_stress") ?? 0)),
          },
        ],
      },
    ],
  },
  {
    key: "waste",
    pillar: "environment",
    title: "Waste",
    description: "Waste generated, diverted from disposal and directed to disposal.",
    standards: [
      { name: "GRI", ref: "306-3, 306-4, 306-5", text: "GRI 306: Waste 2020" },
      { name: "SDG", ref: "3, 6, 11, 12", text: "Responsible consumption and production" },
      { name: "UNGC", ref: "8", text: "Environmental responsibility" },
      { name: "ESRS", ref: "E5-5", text: "Resource outflows" },
    ],
    headline: ["waste_generated", "waste_diverted", "waste_directed"],
    disclosures: [
      {
        code: "306-4",
        title: "Waste diverted from disposal",
        fields: [
          ...RECOVERY.map(([k, label], i) => input(`wdv_haz_${k}`, label, "mass", { indent: 1, code: `306-4 b-${["i", "ii", "iii"][i]}` })),
          total("wdv_haz", "Hazardous waste diverted from disposal", "mass", RECOVERY.map(([k]) => `wdv_haz_${k}`), { code: "306-4 b" }),
          ...RECOVERY.map(([k, label], i) => input(`wdv_non_${k}`, label, "mass", { indent: 1, code: `306-4 c-${["i", "ii", "iii"][i]}` })),
          total("wdv_non", "Non-hazardous waste diverted from disposal", "mass", RECOVERY.map(([k]) => `wdv_non_${k}`), { code: "306-4 c", formula: "i + ii + iii" }),
          total("waste_diverted", "Waste diverted from disposal", "mass", ["wdv_haz", "wdv_non"], { code: "306-4 a", formula: "b + c" }),
          input("wdv_haz_onsite", "Hazardous – onsite", "mass", { indent: 1, code: "306-4 d-b-i" }),
          input("wdv_haz_offsite", "Hazardous – offsite", "mass", { indent: 1, code: "306-4 d-b-ii" }),
          input("wdv_non_onsite", "Non-hazardous – onsite", "mass", { indent: 1, code: "306-4 d-c-i" }),
          input("wdv_non_offsite", "Non-hazardous – offsite", "mass", { indent: 1, code: "306-4 d-c-ii" }),
          total("wdv_location_total", "Diverted waste by location (onsite + offsite)", "mass", ["wdv_haz_onsite", "wdv_haz_offsite", "wdv_non_onsite", "wdv_non_offsite"], { code: "306-4 d", hint: "Should equal 306-4 a." }),
        ],
      },
      {
        code: "306-5",
        title: "Waste directed to disposal",
        fields: [
          ...DISPOSAL.map(([k, label], i) => input(`wdr_haz_${k}`, label, "mass", { indent: 1, code: `306-5 b-${["i", "ii", "iii", "iv"][i]}` })),
          total("wdr_haz", "Hazardous waste directed to disposal", "mass", DISPOSAL.map(([k]) => `wdr_haz_${k}`), { code: "306-5 b" }),
          ...DISPOSAL.map(([k, label], i) => input(`wdr_non_${k}`, label, "mass", { indent: 1, code: `306-5 c-${["i", "ii", "iii", "iv"][i]}` })),
          total("wdr_non", "Non-hazardous waste directed to disposal", "mass", DISPOSAL.map(([k]) => `wdr_non_${k}`), { code: "306-5 c" }),
          total("waste_directed", "Waste directed to disposal", "mass", ["wdr_haz", "wdr_non"], { code: "306-5 a", formula: "b + c" }),
          input("wdr_haz_onsite", "Hazardous – onsite", "mass", { indent: 1, code: "306-5 d-b-i" }),
          input("wdr_haz_offsite", "Hazardous – offsite", "mass", { indent: 1, code: "306-5 d-b-ii" }),
          input("wdr_non_onsite", "Non-hazardous – onsite", "mass", { indent: 1, code: "306-5 d-c-i" }),
          input("wdr_non_offsite", "Non-hazardous – offsite", "mass", { indent: 1, code: "306-5 d-c-ii" }),
          total("wdr_location_total", "Disposed waste by location (onsite + offsite)", "mass", ["wdr_haz_onsite", "wdr_haz_offsite", "wdr_non_onsite", "wdr_non_offsite"], { code: "306-5 d", hint: "Should equal 306-5 a." }),
        ],
      },
      {
        code: "306-3",
        title: "Waste generated",
        fields: [
          total("waste_generated", "Total weight of waste generated", "mass", ["waste_diverted", "waste_directed"], { code: "306-3 a", formula: "Diverted from disposal (306-4) + directed to disposal (306-5)" }),
          text("waste_composition", "Breakdown of the total by composition of the waste", { code: "306-3 a" }),
        ],
      },
    ],
  },
  {
    key: "materials",
    pillar: "environment",
    title: "Materials",
    description: "Materials used, recycled input materials and reclaimed products.",
    standards: [
      { name: "GRI", ref: "301-1, 301-2, 301-3", text: "GRI 301: Materials 2016" },
      { name: "SDG", ref: "8, 12", text: "Responsible consumption and production" },
      { name: "UNGC", ref: "8", text: "Environmental responsibility" },
      { name: "ESRS", ref: "E5-4", text: "Resource inflows" },
    ],
    headline: ["materials_total", "recycled_input_pct"],
    disclosures: [
      {
        code: "301-1",
        title: "Materials used by weight or volume",
        fields: [
          input("materials_nonrenewable", "Non-renewable materials used", "mass", { indent: 1, code: "301-1 a-i", hint: "e.g. coal, gas, metals, minerals, oil" }),
          input("materials_renewable", "Renewable materials used", "mass", { indent: 1, code: "301-1 a-ii" }),
          total("materials_total", "Materials used to produce and package primary products and services", "mass", ["materials_nonrenewable", "materials_renewable"], { code: "301-1 a" }),
        ],
      },
      {
        code: "301-2",
        title: "Recycled input materials used",
        fields: [
          input("materials_recycled", "Recycled input materials used", "mass"),
          {
            key: "recycled_input_pct",
            code: "301-2 a",
            label: "Recycled input materials used",
            kind: "computed",
            dimension: "percent",
            deps: ["materials_recycled", "materials_total"],
            formula: "Recycled materials used ÷ total input materials used × 100",
            compute: (v) => div(v("materials_recycled"), v("materials_total"), 100),
          },
        ],
      },
      {
        code: "301-3",
        title: "Reclaimed products and their packaging materials",
        fields: [
          input("products_reclaimed", "Products and packaging reclaimed in the period", "number"),
          input("products_sold", "Products sold in the period", "number"),
          {
            key: "reclaimed_pct",
            code: "301-3 a",
            label: "Reclaimed products and their packaging materials",
            kind: "computed",
            dimension: "percent",
            deps: ["products_reclaimed", "products_sold"],
            formula: "Products and packaging reclaimed ÷ products sold × 100",
            compute: (v) => div(v("products_reclaimed"), v("products_sold"), 100),
          },
        ],
      },
    ],
  },
  {
    key: "health-safety",
    pillar: "health-safety",
    title: "Work-related injuries",
    description: "Fatalities, high-consequence and recordable injuries for employees and other workers.",
    standards: [
      { name: "GRI", ref: "403-9", text: "GRI 403: Occupational Health and Safety 2018" },
      { name: "SDG", ref: "3, 8", text: "Good health and well-being; decent work" },
      { name: "ESRS", ref: "S1-14", text: "Health and safety metrics" },
    ],
    headline: ["emp_recordable_rate", "emp_recordable"],
    disclosures: [
      { code: "403-9 a", title: "All employees", fields: injuryBlock("emp", "a") },
      { code: "403-9 b", title: "Workers who are not employees but whose work or workplace is controlled by the organisation", fields: injuryBlock("wkr", "b") },
    ],
  },
  {
    key: "workforce",
    pillar: "people",
    title: "Employees and workers",
    description: "Headcount by contract type and gender, non-employee workers, pay ratio and collective bargaining.",
    standards: [
      { name: "GRI", ref: "2-7, 2-8, 2-21, 2-30", text: "GRI 2: General Disclosures 2021" },
      { name: "SDG", ref: "5, 8, 10", text: "Gender equality; decent work; reduced inequalities" },
      { name: "UNGC", ref: "3, 6", text: "Labour principles" },
      { name: "ESRS", ref: "S1-6, S1-7, S1-8, S1-16", text: "Own workforce characteristics, remuneration" },
    ],
    headline: ["emp_all_total", "emp_all_women_pct"],
    disclosures: [
      {
        code: "2-7",
        title: "Employees",
        fields: [
          ...EMPLOYEE_TYPES.flatMap(([k, letter, label]): Field[] => [
            input(`emp_${k}_women`, "Women", "count", { indent: 1, code: `2-7 ${letter}` }),
            input(`emp_${k}_men`, "Men", "count", { indent: 1, code: `2-7 ${letter}` }),
            input(`emp_${k}_other`, "Other / not disclosed", "count", { indent: 1, code: `2-7 ${letter}` }),
            total(`emp_${k}_total`, label, "count", [`emp_${k}_women`, `emp_${k}_men`, `emp_${k}_other`], { code: `2-7 ${letter}` }),
            {
              key: `emp_${k}_women_pct`,
              label: `${label}: share of women`,
              kind: "computed",
              dimension: "percent",
              indent: 1,
              deps: [`emp_${k}_women`, `emp_${k}_total`],
              formula: "Women ÷ total × 100",
              compute: (v) => div(v(`emp_${k}_women`), v(`emp_${k}_total`), 100),
            },
          ]),
          text("employees_methodology", "Methodology: head count, FTE or other; at end of period, average, or other", { code: "2-7 d" }),
        ],
      },
      {
        code: "2-8",
        title: "Workers who are not employees",
        fields: [
          input("workers_not_employees", "Workers who are not employees and whose work is controlled by the organisation", "count", { code: "2-8 a" }),
          text("workers_methodology", "Methodology: head count, FTE or other; at end of period, average, or other", { code: "2-8 b" }),
        ],
      },
      {
        code: "2-21",
        title: "Annual total compensation ratio",
        fields: [
          accountInput("comp_highest", "Annual total compensation of the highest-paid individual", "money"),
          accountInput("comp_median", "Median annual total compensation of all other employees", "money"),
          {
            key: "comp_ratio",
            code: "2-21 a",
            label: "Annual total compensation ratio",
            kind: "computed",
            dimension: "ratio",
            deps: ["comp_highest", "comp_median"],
            formula: "Highest-paid individual ÷ median of all employees excluding the highest-paid",
            compute: (v) => div(v("comp_highest"), v("comp_median")),
          },
          accountInput("comp_increase_highest", "% increase in compensation of the highest-paid individual", "percent"),
          accountInput("comp_increase_median", "Median % increase in compensation of all other employees", "percent"),
          {
            key: "comp_increase_ratio",
            code: "2-21 b",
            label: "Ratio of the percentage increase in annual total compensation",
            kind: "computed",
            dimension: "ratio",
            deps: ["comp_increase_highest", "comp_increase_median"],
            formula: "% increase of highest-paid ÷ median % increase of all other employees",
            compute: (v) => div(v("comp_increase_highest"), v("comp_increase_median")),
          },
        ],
      },
      {
        code: "2-30",
        title: "Collective bargaining agreements",
        fields: [
          input("cba_covered", "Employees covered by collective bargaining agreements", "count"),
          {
            key: "cba_pct",
            code: "2-30 a",
            label: "Employees covered by collective bargaining agreements",
            kind: "computed",
            dimension: "percent",
            deps: ["cba_covered", "emp_all_total"],
            formula: "Employees covered ÷ total employees (2-7 a) × 100",
            compute: (v) => div(v("cba_covered"), v("emp_all_total"), 100),
          },
        ],
      },
    ],
  },
  {
    key: "compliance",
    pillar: "transparency",
    title: "Compliance with laws and regulations",
    description: "Significant instances of non-compliance and fines paid.",
    standards: [
      { name: "GRI", ref: "2-27", text: "GRI 2: General Disclosures 2021" },
      { name: "SDG", ref: "16", text: "Peace, justice and strong institutions" },
      { name: "UNGC", ref: "10", text: "Anti-corruption" },
      { name: "ESRS", ref: "G1", text: "Business conduct" },
    ],
    headline: ["noncompliance_total", "fines_total_value"],
    disclosures: [
      {
        code: "2-27 a",
        title: "Significant instances of non-compliance",
        fields: [
          input("noncompliance_fines", "Instances for which fines were incurred", "count", { indent: 1, code: "2-27 a-i", level: "account" }),
          input("noncompliance_sanctions", "Instances for which non-monetary sanctions were incurred", "count", { indent: 1, code: "2-27 a-ii", level: "account" }),
          total("noncompliance_total", "Significant instances of non-compliance with laws and regulations", "count", ["noncompliance_fines", "noncompliance_sanctions"], { code: "2-27 a" }),
        ],
      },
      {
        code: "2-27 b",
        title: "Fines paid during the reporting period",
        fields: [
          input("fines_current_count", "Fines for instances in the current period – number", "count", { indent: 1, code: "2-27 b-i", level: "account" }),
          input("fines_current_value", "Fines for instances in the current period – value", "money", { indent: 1, code: "2-27 b-i", level: "account" }),
          input("fines_previous_count", "Fines for instances in previous periods – number", "count", { indent: 1, code: "2-27 b-ii", level: "account" }),
          input("fines_previous_value", "Fines for instances in previous periods – value", "money", { indent: 1, code: "2-27 b-ii", level: "account" }),
          total("fines_total_count", "Fines paid – total number", "count", ["fines_current_count", "fines_previous_count"], { code: "2-27 b" }),
          total("fines_total_value", "Fines paid – total monetary value", "money", ["fines_current_value", "fines_previous_value"], { code: "2-27 b" }),
        ],
      },
    ],
  },
];

export const GROUP_BY_KEY = new Map(KPI_GROUPS.map((g) => [g.key, g]));

export function groupFields(group: KpiGroup) {
  return group.disclosures.flatMap((d) => d.fields);
}

export const ALL_FIELDS: Field[] = KPI_GROUPS.flatMap(groupFields);
export const FIELD_BY_KEY = new Map(ALL_FIELDS.map((f) => [f.key, f]));
export const GROUP_OF_FIELD = new Map(KPI_GROUPS.flatMap((g) => groupFields(g).map((f) => [f.key, g.key] as const)));

export function isNumeric(f: Field): f is InputField | ComputedField {
  return f.kind === "input" || f.kind === "computed";
}
