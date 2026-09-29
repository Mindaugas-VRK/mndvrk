import type { Metadata } from "next";
import { SectionHeading } from "@/components/section";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="Legal" title="Privacy policy" />
      <div className="prose-post mt-10">
        <p>
          This page explains how ESGCounts (esgcounts.eu) processes personal data in line with the EU General Data
          Protection Regulation (GDPR). <em>Replace this placeholder with your reviewed policy before launch.</em>
        </p>
        <h2>What we collect</h2>
        <ul>
          <li>Account data for dashboard users: name, email address, role and a hashed password.</li>
          <li>ESG data your organisation enters into reports.</li>
          <li>A single strictly necessary session cookie, set only when you sign in.</li>
        </ul>
        <h2>How we use it</h2>
        <p>Only to provide the ESGCounts service to your organisation. We do not sell personal data or use tracking cookies.</p>
        <h2>Your rights</h2>
        <p>
          You can request access to, correction of, or deletion of your personal data at any time by emailing{" "}
          <a href="mailto:info@esgcounts.eu">info@esgcounts.eu</a>.
        </p>
      </div>
    </section>
  );
}
