import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section";
import { buttonStyles } from "@/components/ui";
import { getPublishedPosts } from "@/lib/posts";

const FEATURES = [
  {
    icon: Icon.grid,
    title: "Materiality assessment",
    text: "Guided double materiality: desktop research, stakeholder engagement and ESG Committee approval, with your material topics, policies and procedures in one place.",
  },
  {
    icon: Icon.scale,
    title: "Risk matrix",
    text: "Identify physical, regulatory, reputational and financial hazards, score them on a 5×5 probability × impact matrix and track mitigation.",
  },
  {
    icon: Icon.target,
    title: "GRI KPIs, rolled up",
    text: "Energy, emissions, water, waste, materials, safety and workforce indicators entered per site and rolled up by city, country and region.",
  },
  {
    icon: Icon.shield,
    title: "Prepared, reviewed, approved",
    text: "A clear sign-off workflow for every reporting period, with a full audit trail of who changed what and when.",
  },
  {
    icon: Icon.chart,
    title: "Actuals vs targets",
    text: "Trend charts across reporting periods with targets, so you can see where you're on track and where you're not.",
  },
  {
    icon: Icon.doc,
    title: "Report-ready",
    text: "Generate a GRI content index and export all data to CSV. Built in Europe, for CSRD, ESRS and GRI reporting.",
  },
];

export default async function HomePage() {
  await connection();
  const posts = await getPublishedPosts(3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-500 ring-1 ring-lime-300">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500" /> Assess · Collect · Report
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink-500 sm:text-5xl lg:text-6xl">
              ESG reporting that <span className="text-teal-500">counts</span>.
            </h1>
            <span className="brand-rule mt-6" />
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-400">
              Customised ESG reporting software that makes reporting simple and affordable: materiality and
              risk assessments, GRI KPIs across all your sites, and reports your stakeholders can trust.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className={`${buttonStyles.primary} px-5 py-3 text-base`}>
                Request a demo
              </Link>
              <Link href="/features" className={`${buttonStyles.secondary} px-5 py-3 text-base`}>
                See how it works
              </Link>
            </div>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionHeading eyebrow="Why ESGCounts" title="Everything you need to report with confidence" center>
          From your first materiality exercise to a published, auditable report. No spreadsheets emailed around.
        </SectionHeading>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-teal-100 bg-white p-6 transition hover:border-lime-400">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-pale-lime text-teal-500">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink-500">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-teal-500">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <SectionHeading eyebrow="Access control" title="The right access for every person" light>
            Three roles keep your data safe while letting everyone who needs it contribute or follow along.
          </SectionHeading>
          <div className="space-y-4">
            {[
              ["Admin", "Manages accounts, sites and users, and approves reporting periods."],
              ["User", "Enters site data, maintains materiality and risks, and prepares or reviews reports."],
              ["Viewer", "Read-only access to dashboards and reports: ideal for management, boards and auditors."],
            ].map(([role, text]) => (
              <div key={role} className="flex gap-4 rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <Icon.check className="mt-0.5 h-6 w-6 shrink-0 text-lime-400" />
                <div>
                  <h3 className="font-bold text-white">{role}</h3>
                  <p className="mt-1 text-sm text-teal-100">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="News" title="Latest from the blog" />
            <Link href="/blog" className="text-sm font-semibold text-teal-500 hover:text-teal-600">
              All posts →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl bg-lime-500 px-8 py-14 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-ink-500">Ready to make your ESG data count?</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-500/80">
            Tell us about your reporting needs and we&apos;ll set up your ESGCounts workspace.
          </p>
          <Link href="/contact" className="mt-8 inline-flex rounded-lg bg-teal-500 px-6 py-3 font-semibold text-white hover:bg-teal-600">
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}

function HeroPreview() {
  const bars = [62, 55, 48, 41];
  return (
    <div className="relative">
      <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-ice blur-2xl" aria-hidden />
      <div className="relative rounded-2xl border border-teal-100 bg-white p-6 shadow-xl shadow-teal-500/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone">Scope 1 + 2 emissions · all sites</p>
            <p className="mt-1 font-display text-3xl font-bold text-ink-500">
              4 120 <span className="text-base font-medium text-stone">tCO₂e</span>
            </p>
          </div>
          <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-800">▼ 14.6% vs 2024</span>
        </div>
        <div className="mt-6 flex h-40 items-end gap-4">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={i === bars.length - 1 ? "w-full rounded-t-md bg-lime-500" : "w-full rounded-t-md bg-teal-500/80"}
                style={{ height: `${h * 2.2}px` }}
              />
              <span className="text-xs text-stone">{2022 + i}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-teal-50 pt-5 text-center">
          {[
            ["E", "Environment", "5 KPIs"],
            ["S", "People & safety", "2 KPIs"],
            ["G", "Transparency", "1 KPI"],
          ].map(([k, label, v]) => (
            <div key={k} className="rounded-lg bg-cream py-3">
              <p className="font-display text-lg font-bold text-teal-500">{v}</p>
              <p className="text-xs text-ink-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
