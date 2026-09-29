import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Branded 1200×630 share card (LinkedIn, Facebook, X): teal background, lime accent, official logo. */
export async function brandedCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  const logo = await fs.readFile(path.join(process.cwd(), "public/brand/logo-on-teal.svg"));
  const mark = await fs.readFile(path.join(process.cwd(), "public/brand/mark-white.svg"));
  const src = (b: Buffer) => `data:image/svg+xml;base64,${b.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#2C5D63", padding: "64px 72px", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(mark)} alt="" width={520} height={520} style={{ position: "absolute", right: -90, bottom: -110, opacity: 0.08 }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(logo)} alt="ESGCounts" width={334} height={60} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#A9C52F", fontSize: 26, letterSpacing: 6, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ width: 60, height: 6, background: "#A9C52F", marginTop: 20, marginBottom: 28 }} />
          <div style={{ color: "#FFFFFF", fontSize: title.length > 70 ? 52 : 64, fontWeight: 700, lineHeight: 1.12, maxWidth: 1000 }}>{title}</div>
          {subtitle && <div style={{ color: "#DAECE6", fontSize: 28, marginTop: 24, maxWidth: 980, lineHeight: 1.35 }}>{subtitle}</div>}
        </div>
        <div style={{ color: "#DAECE6", fontSize: 24 }}>esgcounts.eu</div>
      </div>
    ),
    OG_SIZE,
  );
}
