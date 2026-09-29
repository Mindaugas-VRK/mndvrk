/**
 * Every numeric field has a dimension. Values are stored with the unit they were
 * entered in (e.g. a meter reading in kWh) and converted to the dimension's
 * canonical unit for rollups and reporting.
 */
export type Dimension =
  | "energy"
  | "water"
  | "mass"
  | "air"
  | "emissions"
  | "count"
  | "hours"
  | "percent"
  | "ratio"
  | "rate"
  | "money"
  | "number";

type UnitDef = { label: string; factor: number };

export const DIMENSIONS: Record<Dimension, { canonical: string; units: Record<string, UnitDef> }> = {
  energy: {
    canonical: "GJ",
    units: {
      kWh: { label: "kWh", factor: 0.0036 },
      MWh: { label: "MWh", factor: 3.6 },
      GWh: { label: "GWh", factor: 3600 },
      MJ: { label: "MJ", factor: 0.001 },
      GJ: { label: "GJ", factor: 1 },
      TJ: { label: "TJ", factor: 1000 },
    },
  },
  water: {
    canonical: "ML",
    units: {
      L: { label: "litres", factor: 1e-6 },
      m3: { label: "m³", factor: 0.001 },
      ML: { label: "megalitres", factor: 1 },
    },
  },
  mass: {
    canonical: "t",
    units: {
      kg: { label: "kg", factor: 0.001 },
      t: { label: "tonnes", factor: 1 },
    },
  },
  air: {
    canonical: "kg",
    units: {
      g: { label: "g", factor: 0.001 },
      kg: { label: "kg", factor: 1 },
      t: { label: "tonnes", factor: 1000 },
    },
  },
  emissions: {
    canonical: "tCO₂e",
    units: {
      kgCO2e: { label: "kg CO₂e", factor: 0.001 },
      tCO2e: { label: "t CO₂e", factor: 1 },
    },
  },
  count: { canonical: "", units: { n: { label: "number", factor: 1 } } },
  hours: { canonical: "h", units: { h: { label: "hours", factor: 1 } } },
  percent: { canonical: "%", units: { pct: { label: "%", factor: 1 } } },
  ratio: { canonical: ":1", units: { x: { label: "ratio", factor: 1 } } },
  rate: { canonical: "per 1M h", units: { r: { label: "per 1M hours", factor: 1 } } },
  money: { canonical: "EUR", units: { EUR: { label: "EUR", factor: 1 } } },
  number: { canonical: "", units: { n: { label: "number", factor: 1 } } },
};

export function defaultUnit(dim: Dimension) {
  const d = DIMENSIONS[dim];
  const match = Object.entries(d.units).find(([, u]) => u.factor === 1);
  return match ? match[0] : Object.keys(d.units)[0];
}

export function toCanonical(value: number, dim: Dimension, unit: string) {
  const u = DIMENSIONS[dim].units[unit];
  return u ? value * u.factor : value;
}

export function unitOptions(dim: Dimension) {
  return Object.entries(DIMENSIONS[dim].units).map(([key, u]) => ({ key, label: u.label }));
}

export function formatNumber(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const max = abs >= 1000 ? 0 : abs >= 1 ? digits : 4;
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: max }).format(n);
}

export function formatMeasure(n: number | null | undefined, dim: Dimension) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const unit = DIMENSIONS[dim].canonical;
  if (dim === "percent") return `${formatNumber(n, 1)}%`;
  if (dim === "ratio") return `${formatNumber(n, 2)}:1`;
  return unit ? `${formatNumber(n)} ${unit}` : formatNumber(n);
}
