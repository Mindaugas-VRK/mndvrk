import type { Probability } from "@/lib/db/schema";

export const PROBABILITY_LABELS: Record<Probability, string> = {
  A: "Almost certain to occur",
  B: "Likely to occur",
  C: "Possibly and like to occur at sometime",
  D: "Unlikely to occur but could happen",
  E: "May occur but only in rare circumstances",
};

export const IMPACT_LABELS: Record<number, string> = {
  1: "Insignificant",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Catastrophic",
};

/** Risk score for each probability row × impact column, exactly as in the ESGCounts risk matrix. */
const MATRIX: Record<Probability, [number, number, number, number, number]> = {
  A: [8, 16, 18, 23, 25],
  B: [7, 10, 17, 20, 24],
  C: [3, 9, 12, 19, 22],
  D: [2, 5, 11, 14, 21],
  E: [1, 4, 6, 13, 15],
};

export type RiskLevel = "critical" | "high" | "medium" | "low";

export const RISK_LEVELS: Record<RiskLevel, { label: string; range: string; min: number; max: number }> = {
  critical: { label: "Critical", range: "23 – 25", min: 23, max: 25 },
  high: { label: "High", range: "16 – 22", min: 16, max: 22 },
  medium: { label: "Medium", range: "7 – 15", min: 7, max: 15 },
  low: { label: "Low", range: "1 – 6", min: 1, max: 6 },
};

export function riskScore(probability: Probability, impact: number) {
  return MATRIX[probability][Math.min(Math.max(impact, 1), 5) - 1];
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 23) return "critical";
  if (score >= 16) return "high";
  if (score >= 7) return "medium";
  return "low";
}

/** Status colours are reserved for risk levels and always shown with a text label. */
export const LEVEL_STYLES: Record<RiskLevel, { cell: string; text: string; soft: string }> = {
  critical: { cell: "bg-coal text-white", text: "text-coal", soft: "bg-ink-100 text-coal" },
  high: { cell: "bg-red-600 text-white", text: "text-red-700", soft: "bg-red-50 text-red-700" },
  medium: { cell: "bg-amber-400 text-ink-500", text: "text-amber-700", soft: "bg-amber-50 text-amber-800" },
  low: { cell: "bg-lime-600 text-white", text: "text-lime-800", soft: "bg-lime-100 text-lime-800" },
};

/** A likelihood ↔ rating wording for the "analysis" table. */
export function probabilityRating(p: Probability) {
  return { A: "Very high", B: "High", C: "Medium", D: "Low", E: "Very low" }[p];
}
