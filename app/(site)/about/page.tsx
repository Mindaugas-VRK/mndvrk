import type { Metadata } from "next";
import { SectionHeading } from "@/components/section";
import { COMPANY_LEGAL_NAME } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description: "Why we built ESGCounts: making sustainability reporting practical for European companies.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="About us" title="We believe what gets measured, improves" />
      <div className="prose-post mt-10">
        <p>
          The Corporate Sustainability Reporting Directive is changing how European companies talk about their impact.
          For many teams it means pulling data from finance, HR, facilities and suppliers, often for the first time,
          and turning it into figures that hold up to scrutiny.
        </p>
        <p>
          <strong>ESGCounts</strong> exists to make that work practical. We give companies a clear structure for
          environmental, social and governance data, a simple workflow to review it, and a record of progress over time,
          so sustainability becomes something you manage, not something you scramble for once a year.
        </p>
        <h2>What we stand for</h2>
        <ul>
          <li><strong>Clarity</strong>: plain-language data points mapped to recognised standards.</li>
          <li><strong>Trust</strong>: role-based access and a review step before anything is published.</li>
          <li><strong>Progress</strong>: year-on-year comparisons that show where you are improving.</li>
        </ul>
        <p>ESGCounts is developed and operated by <strong>{COMPANY_LEGAL_NAME}</strong>.</p>
      </div>
    </section>
  );
}
