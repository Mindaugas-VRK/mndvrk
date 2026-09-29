import type { CustomField, Entry, Site } from "@/lib/db/schema";
import {
  FIELD_BY_KEY,
  KPI_GROUPS,
  groupFields,
  type Field,
  type Getter,
  type InputField,
  type KpiGroup,
} from "./catalog";
import { toCanonical, type Dimension } from "./units";

export const LEVELS = ["total", "region", "country", "city", "site"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  total: "Total",
  region: "Region",
  country: "Country",
  city: "City",
  site: "Site",
};

export function customFieldToInput(cf: CustomField): InputField {
  return {
    key: `custom:${cf.id}`,
    label: cf.label,
    hint: cf.description || undefined,
    kind: "input",
    dimension: (cf.dimension as Dimension) ?? "number",
    level: cf.siteLevel ? "site" : "account",
  };
}

/** GRI fields for a group plus the account's custom fields in that group. */
export function fieldsForGroup(group: KpiGroup, custom: CustomField[]): Field[] {
  return [...groupFields(group), ...custom.filter((c) => c.groupKey === group.key).map(customFieldToInput)];
}

export type Bucket = { key: string; label: string; siteIds: number[]; includeAccount: boolean };

/** Splits an account's sites into columns for the chosen hierarchy level. */
export function bucketsFor(level: Level, sites: Site[]): Bucket[] {
  if (level === "total") {
    return [{ key: "total", label: "Total", siteIds: sites.map((s) => s.id), includeAccount: true }];
  }
  if (level === "site") {
    return sites.map((s) => ({ key: `site:${s.id}`, label: s.name, siteIds: [s.id], includeAccount: false }));
  }
  const map = new Map<string, number[]>();
  for (const s of sites) {
    const k = s[level] || "Unspecified";
    map.set(k, [...(map.get(k) ?? []), s.id]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, ids]) => ({ key: `${level}:${k}`, label: k, siteIds: ids, includeAccount: false }));
}

/**
 * Evaluates all fields for one reporting period. Input values are converted to
 * canonical units and summed across the bucket's sites; computed fields are
 * evaluated from those sums, so ratios are always computed on totals.
 */
export class PeriodData {
  private bySite = new Map<number, Map<string, Entry>>();
  private fields: Map<string, Field>;

  constructor(entries: Entry[], custom: CustomField[] = []) {
    for (const e of entries) {
      if (!this.bySite.has(e.siteId)) this.bySite.set(e.siteId, new Map());
      this.bySite.get(e.siteId)!.set(e.fieldKey, e);
    }
    this.fields = new Map(FIELD_BY_KEY);
    for (const c of custom) {
      const f = customFieldToInput(c);
      this.fields.set(f.key, f);
    }
  }

  field(key: string) {
    return this.fields.get(key);
  }

  entry(siteId: number, key: string) {
    return this.bySite.get(siteId)?.get(key);
  }

  /** Every stored entry, site by site (siteId 0 = account level). */
  allEntries(): Entry[] {
    return [...this.bySite.values()].flatMap((m) => [...m.values()]);
  }

  text(key: string) {
    return this.entry(0, key)?.text ?? "";
  }

  canonical(siteId: number, key: string): number | null {
    const e = this.entry(siteId, key);
    const f = this.fields.get(key);
    if (!e || e.value === null || !f || f.kind !== "input") return null;
    return toCanonical(e.value, f.dimension, e.unit);
  }

  getter(bucket: Bucket): Getter {
    const memo = new Map<string, number | null>();
    const get: Getter = (key) => {
      if (memo.has(key)) return memo.get(key)!;
      memo.set(key, null); // cycle guard
      const f = this.fields.get(key);
      let result: number | null = null;
      if (f?.kind === "input") {
        if (f.level === "account") {
          result = bucket.includeAccount ? this.canonical(0, key) : null;
        } else {
          let total = 0;
          let any = false;
          for (const id of bucket.siteIds) {
            const v = this.canonical(id, key);
            if (v !== null) {
              total += v;
              any = true;
            }
          }
          result = any ? total : null;
        }
      } else if (f?.kind === "computed") {
        const r = f.compute(get);
        result = r !== null && Number.isFinite(r) ? r : null;
      }
      memo.set(key, result);
      return result;
    };
    return get;
  }

  total() {
    return this.getter({ key: "total", label: "Total", siteIds: [...this.bySite.keys()].filter((k) => k !== 0), includeAccount: true });
  }
}

/** Share of required inputs that have a value, per group. */
export function completeness(data: PeriodData, sites: Site[], group: KpiGroup, custom: CustomField[] = []) {
  let filled = 0;
  let required = 0;
  for (const f of fieldsForGroup(group, custom)) {
    if (f.kind === "input") {
      if (f.level === "site") {
        for (const s of sites) {
          required++;
          if (data.entry(s.id, f.key)?.value != null) filled++;
        }
      } else {
        required++;
        if (data.entry(0, f.key)?.value != null) filled++;
      }
    } else if (f.kind === "text" || f.kind === "choice") {
      required++;
      if (data.text(f.key)) filled++;
    }
  }
  return { filled, required, pct: required ? Math.round((filled / required) * 100) : 0 };
}

export function overallCompleteness(data: PeriodData, sites: Site[], custom: CustomField[] = []) {
  let filled = 0;
  let required = 0;
  for (const g of KPI_GROUPS) {
    const c = completeness(data, sites, g, custom);
    filled += c.filled;
    required += c.required;
  }
  return { filled, required, pct: required ? Math.round((filled / required) * 100) : 0 };
}

/** True when a computed field can be evaluated from site-level inputs alone. */
export function isSiteComputable(key: string, stack: Set<string> = new Set()): boolean {
  const f = FIELD_BY_KEY.get(key);
  if (!f) return false;
  if (f.kind === "input") return f.level === "site";
  if (f.kind !== "computed" || stack.has(key)) return false;
  const next = new Set(stack).add(key);
  return f.deps.length > 0 && f.deps.every((d) => isSiteComputable(d, next));
}
