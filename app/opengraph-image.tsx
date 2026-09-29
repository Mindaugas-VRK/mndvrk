import { brandedCard, OG_SIZE } from "@/lib/og";

export const alt = "ESGCounts – ESG reporting made simple";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandedCard({
    eyebrow: "Assess · Collect · Report",
    title: "ESG reporting that counts",
    subtitle: "Materiality, risks and GRI KPIs across all your sites, ready for CSRD digital reporting.",
  });
}
