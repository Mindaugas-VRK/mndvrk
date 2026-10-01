import type { Metadata } from "next";
import { SectionHeading } from "@/components/section";
import { COMPANY_LEGAL_NAME, CONTACT_EMAIL } from "@/lib/utils";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="Legal" title="Privacy policy" />
      <div className="prose-post mt-10">
        <p>
          This page explains how {COMPANY_LEGAL_NAME}, the company behind ESGCounts (esgcounts.eu), processes personal
          data in line with the EU General Data Protection Regulation (GDPR). {COMPANY_LEGAL_NAME} is the data controller. <em>Replace this placeholder with your reviewed policy before launch.</em>
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>Account data for dashboard users: name, email address, role and a hashed password.</li>
          <li>ESG data your organisation enters into reports.</li>
          <li>A single strictly necessary session cookie, set only when you sign in.</li>
          <li>
            <strong>Analytics, only with your consent:</strong> if you click <em>Accept</em> in the cookie banner, Google Analytics 4
            (Google Ireland Ltd.) sets the cookies <code>_ga</code> and <code>_ga_*</code> (up to 2 years) to measure visits to the
            public website, with IP anonymisation. The reporting tool (dashboard) is never tracked. You can change your choice at any
            time via <em>Cookie settings</em> in the footer.
          </li>
          <li>News posts can show a LinkedIn post. It loads only when you click <em>Show LinkedIn post</em>; LinkedIn then processes data under its own privacy policy.</li>
        </ul>
        <h2>How we use it</h2>
        <p>To provide the ESGCounts service to your organisation and, if you consent, to understand how the public website is used. We do not sell personal data.</p>
        <h2>Your rights</h2>
        <p>
          You can request access to, correction of, or deletion of your personal data at any time by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </section>
  );
}
