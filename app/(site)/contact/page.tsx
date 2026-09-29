import type { Metadata } from "next";
import { SectionHeading } from "@/components/section";
import { COMPANY_LEGAL_NAME, CONTACT_EMAIL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ESGCounts team to request a demo or ask a question.",
};

const EMAIL = CONTACT_EMAIL;

export default function ContactPage() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
      <SectionHeading eyebrow="Contact" title="Let's talk about your reporting">
        Whether you&apos;re preparing your first CSRD report or looking to replace spreadsheets, we&apos;re happy to
        help. Tell us a little about your company and we&apos;ll get back to you within one business day.
      </SectionHeading>
      <div className="rounded-2xl bg-teal-500 p-8 text-white">
        <h3 className="text-lg font-bold">Email us</h3>
        <a href={`mailto:${EMAIL}?subject=ESGCounts%20demo%20request`} className="mt-2 block font-display text-2xl font-bold text-lime-400 hover:underline">
          {EMAIL}
        </a>
        <p className="mt-6 text-sm text-teal-100">Helpful to include:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-teal-100">
          <li>Company name and number of employees</li>
          <li>Which framework you report under (CSRD / ESRS, VSME, GRI)</li>
          <li>Your first reporting year</li>
        </ul>
        <p className="mt-8 border-t border-white/15 pt-4 text-sm text-teal-100">{COMPANY_LEGAL_NAME} · Lithuania</p>
      </div>
    </section>
  );
}
