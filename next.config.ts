import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  // The Inline XBRL export embeds the logo from public/brand.
  outputFileTracingIncludes: { "/dashboard/reporting/[id]/export/ixbrl": ["./public/brand/logo-color.svg"] },
};

export default nextConfig;
