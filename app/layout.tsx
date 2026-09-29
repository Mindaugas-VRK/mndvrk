import type { Metadata } from "next";
import { Oxygen, Quicksand } from "next/font/google";
import { COMPANY_LEGAL_NAME, SITE_URL } from "@/lib/utils";
import "./globals.css";

// Brand typefaces (brand/BRAND.md): Quicksand for headings, Oxygen for body copy.
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const oxygen = Oxygen({
  variable: "--font-oxygen",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ESGCounts – ESG reporting made simple",
    template: "%s · ESGCounts",
  },
  description:
    "ESGCounts helps European companies collect, track and report ESG data aligned with CSRD / ESRS, GRI and VSME.",
  icons: { icon: "/brand/app-icon.svg" },
  creator: COMPANY_LEGAL_NAME,
  publisher: COMPANY_LEGAL_NAME,
  openGraph: {
    siteName: "ESGCounts",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${oxygen.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
