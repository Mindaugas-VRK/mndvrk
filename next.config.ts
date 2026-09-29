import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  // The Inline XBRL export and share images read the logo files from public/brand at runtime.
  outputFileTracingIncludes: { "/**": ["./public/brand/*.svg"] },
};

export default nextConfig;
