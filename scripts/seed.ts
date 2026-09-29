/**
 * Seeds the database with an admin account and, unless SEED_DEMO=false, a demo
 * client with sites, three reporting periods, risks, topics and blog posts.
 *
 *   ADMIN_EMAIL=you@esgcounts.eu ADMIN_PASSWORD='…' npm run db:seed
 */
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  accounts, assessments, auditLog, entries, kpiNotes, materialTopics, periods, posts, risks, signoffs, sites, targets, users,
} from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import { ALL_FIELDS } from "../lib/gri/catalog";
import { defaultUnit } from "../lib/gri/units";

const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@esgcounts.eu").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe-2026!";
const demo = process.env.SEED_DEMO !== "false";

async function upsertUser(email: string, name: string, role: "admin" | "user" | "viewer", password: string, accountId: number | null, jobTitle: string) {
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) return existing.id;
  return db.insert(users).values({ email, name, role, accountId, jobTitle, passwordHash: await hashPassword(password) }).returning({ id: users.id }).get().id;
}

// Deterministic pseudo-random so the demo looks the same on every seed.
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const vary = (base: number, pct = 0.08) => Math.round(base * (1 + (rand() - 0.5) * 2 * pct) * 100) / 100;

async function main() {
  const adminId = await upsertUser(adminEmail, "ESGCounts Admin", "admin", adminPassword, null, "Platform administrator");
  console.log(`✓ admin: ${adminEmail}${process.env.ADMIN_PASSWORD ? "" : ` / ${adminPassword}  (set ADMIN_PASSWORD to choose your own)`}`);
  if (!demo) return;
  if (db.select().from(accounts).where(eq(accounts.name, "Baltic Manufacturing UAB")).get()) {
    console.log("Demo data already present, skipping.");
    return;
  }

  const acc = db.insert(accounts).values({ name: "Baltic Manufacturing UAB", industry: "Industrial manufacturing", country: "Lithuania" }).returning({ id: accounts.id }).get().id;
  const siteRows = [
    { name: "Vilnius HQ", region: "Baltics", country: "Lithuania", city: "Vilnius", scale: 0.35 },
    { name: "Kaunas plant", region: "Baltics", country: "Lithuania", city: "Kaunas", scale: 1.6 },
    { name: "Riga warehouse", region: "Baltics", country: "Latvia", city: "Riga", scale: 0.6 },
    { name: "Gothenburg plant", region: "Nordics", country: "Sweden", city: "Gothenburg", scale: 1.1 },
  ].map((s) => ({ ...s, id: db.insert(sites).values({ accountId: acc, name: s.name, region: s.region, country: s.country, city: s.city }).returning({ id: sites.id }).get().id }));

  const pwd = "Demo-2026-pass";
  const userId = await upsertUser("engineer@demo.esgcounts.eu", "Lina Petrauskė", "user", pwd, acc, "Environmental engineer");
  const hrId = await upsertUser("hr@demo.esgcounts.eu", "Tomas Kazlauskas", "user", pwd, acc, "HR manager");
  await upsertUser("viewer@demo.esgcounts.eu", "Board Viewer", "viewer", pwd, acc, "Board member");
  const managerId = await upsertUser("manager@demo.esgcounts.eu", "Ieva Jankauskienė", "admin", pwd, acc, "Country manager");
  console.log(`✓ demo users (password ${pwd}): engineer@, hr@, viewer@, manager@demo.esgcounts.eu`);

  // Base site-level values for a "scale 1" site, in the default unit of each field.
  const siteBase: Record<string, number> = {
    fuel_nonrenewable: 5200, fuel_renewable: 800, electricity_consumed: 2_900_000 /* kWh */, heating_consumed: 3100, cooling_consumed: 400, steam_consumed: 0,
    electricity_sold: 120_000 /* kWh */, self_generated_not_consumed: 0,
    s1_natural_gas: 610, s1_heating_oil: 45, s1_lpg: 30, s1_transport_fuel: 140, s1_other: 12, s1_company_cars: 85,
    s2_electricity: 820, s2_steam_heat_cold: 190, scope2_market: 540,
    air_nox: 820, air_sox: 140, air_voc: 360, air_pm: 95,
    ww_surface: 12, ww_ground: 28, ww_third_party: 41, wws_third_party: 9,
    wd_surface: 18, wd_third_party: 35, water_discharge_stress: 6,
    wdv_haz_recycling: 14, wdv_haz_other: 6, wdv_non_reuse: 40, wdv_non_recycling: 310, wdv_non_other: 55,
    wdv_haz_offsite: 20, wdv_non_onsite: 60, wdv_non_offsite: 345,
    wdr_haz_incin_recovery: 9, wdr_haz_landfill: 4, wdr_non_incin_recovery: 70, wdr_non_landfill: 120, wdr_non_other: 10,
    wdr_haz_offsite: 13, wdr_non_offsite: 200,
    materials_nonrenewable: 5400, materials_renewable: 1900, materials_recycled: 1350, products_reclaimed: 900, products_sold: 41_000,
    emp_fatalities: 0, emp_high_consequence: 0.3, emp_recordable: 4, emp_hours: 310_000, wkr_recordable: 1, wkr_hours: 52_000,
    emp_all_women: 72, emp_all_men: 118, emp_permanent_women: 64, emp_permanent_men: 106, emp_temporary_women: 8, emp_temporary_men: 12,
    emp_fulltime_women: 60, emp_fulltime_men: 112, emp_parttime_women: 12, emp_parttime_men: 6, workers_not_employees: 22, cba_covered: 95,
  };
  const units: Record<string, string> = { electricity_consumed: "kWh", electricity_sold: "kWh", ww_surface: "ML", fuel_nonrenewable: "GJ" };

  const accountBase: Record<string, number> = {
    energy_outside: 14_000, energy_denominator: 48_000, ghg_denominator: 41_000,
    s3_purchased_goods: 18_400, s3_capital_goods: 2100, s3_fuel_energy: 1450, s3_upstream_transport: 2900, s3_waste: 380, s3_business_travel: 610, s3_commuting: 940, s3_downstream_transport: 1700, s3_use_of_products: 5200, s3_end_of_life: 830,
    comp_highest: 240_000, comp_median: 31_000, comp_increase_highest: 4, comp_increase_median: 6.5,
    noncompliance_fines: 1, noncompliance_sanctions: 0, fines_current_count: 1, fines_current_value: 4500,
  };
  const texts: Record<string, string> = {
    energy_methodology: "Meter readings per site, invoices for fuels; GHG Protocol corporate standard.",
    energy_conversion_source: "DEFRA 2024 conversion factors; national grid factors from the IEA.",
    energy_denominator_label: "m² of premises",
    ghg_denominator_label: "tonnes of product manufactured",
    scope1_gases: "CO₂, CH₄, N₂O",
    scope1_base_year: "2023", scope2_base_year: "2023",
    scope1_ef_source: "DEFRA 2024; IPCC AR6 GWP100", scope2_ef_source: "IEA 2024 location-based; supplier-specific market-based factors",
    scope1_consolidation: "Operational control", scope2_consolidation: "Operational control",
    employees_methodology: "Head count at the end of the reporting period.",
    workers_methodology: "Head count of agency workers at the end of the reporting period.",
    emp_injury_types: "Cuts and lacerations, strains from manual handling.",
    waste_composition: "Metals 38%, plastics 21%, paper and cardboard 26%, other 15%.",
  };

  const years = [
    { y: 2023, trend: 1.0, status: "approved" as const },
    { y: 2024, trend: 0.93, status: "approved" as const },
    { y: 2025, trend: 0.86, status: "draft" as const },
  ];
  for (const { y, trend, status } of years) {
    const pid = db.insert(periods).values({ accountId: acc, title: `FY ${y}`, startDate: `${y}-01-01`, endDate: `${y}-12-31`, ownerId: userId, status }).returning({ id: periods.id }).get().id;
    const partial = status === "draft";
    const rows: (typeof entries.$inferInsert)[] = [];
    for (const s of siteRows) {
      for (const [key, base] of Object.entries(siteBase)) {
        if (partial && rand() < 0.3) continue;
        const f = ALL_FIELDS.find((x) => x.key === key);
        if (!f || f.kind !== "input") continue;
        const people = key.startsWith("emp_") || key.startsWith("wkr_") || key === "cba_covered" || key === "workers_not_employees";
        const t = people ? 1 + (1 - trend) * 0.5 : trend;
        let v = vary(base * s.scale * t);
        if (f.dimension === "count") v = Math.max(0, Math.round(v));
        rows.push({ periodId: pid, siteId: s.id, fieldKey: key, value: v, unit: units[key] ?? defaultUnit(f.dimension), reference: key === "electricity_consumed" ? `EL-${s.id}0${y % 100}` : "", updatedById: userId });
      }
    }
    for (const [key, base] of Object.entries(accountBase)) {
      if (partial && rand() < 0.4) continue;
      const f = ALL_FIELDS.find((x) => x.key === key);
      if (!f || f.kind !== "input") continue;
      const v = key.startsWith("comp_") || key.includes("denominator") ? vary(base, 0.03) : vary(base * trend);
      rows.push({ periodId: pid, siteId: 0, fieldKey: key, value: f.dimension === "count" ? Math.round(v) : v, unit: defaultUnit(f.dimension), updatedById: key.startsWith("comp") ? hrId : userId });
    }
    for (const [key, t] of Object.entries(texts)) rows.push({ periodId: pid, siteId: 0, fieldKey: key, value: null, text: t, updatedById: userId });
    db.insert(entries).values(rows).run();

    if (status === "approved") {
      const at = (d: number) => new Date(`${y + 1}-02-${String(d).padStart(2, "0")}T10:00:00Z`);
      db.insert(signoffs).values([
        { accountId: acc, subject: `period:${pid}`, stage: "prepared", userId, at: at(5) },
        { accountId: acc, subject: `period:${pid}`, stage: "reviewed", userId: hrId, at: at(10) },
        { accountId: acc, subject: `period:${pid}`, stage: "approved", userId: managerId, at: at(13) },
      ]).run();
    }
    db.insert(auditLog).values({ userId, accountId: acc, action: "created", entity: `period:${pid}`, detail: `FY ${y}` }).run();
  }

  db.insert(targets).values([
    { accountId: acc, fieldKey: "scope1_total", year: 2026, value: 2800 },
    { accountId: acc, fieldKey: "scope2_location", year: 2026, value: 3200 },
    { accountId: acc, fieldKey: "energy_total", year: 2026, value: 70_000 },
    { accountId: acc, fieldKey: "water_consumption", year: 2026, value: 90 },
  ]).run();

  const topicContent: Record<string, string> = {
    "climate-change": "## Climate policy\n\nWe commit to reducing absolute Scope 1 and 2 emissions by **42% by 2030** from a 2023 base year, in line with a 1.5 °C pathway.\n\n- Energy management system certified to ISO 50001 at the Kaunas plant\n- 100% renewable electricity procurement by 2027\n- Annual Scope 3 screening of the top 50 suppliers\n\n## Procedures\n\nSite engineers submit monthly meter readings; the environmental engineer consolidates them quarterly and prepares the annual GRI 302 and 305 disclosures.",
    "workplace-safety": "## Health and safety policy\n\nZero harm is our goal. Every site runs an ISO 45001 management system.\n\n- Near-miss reporting through the safety app\n- Monthly safety walks by site management\n- Root-cause analysis for every recordable injury",
    water: "## Water stewardship\n\nThe Riga warehouse is located in an area of medium water stress. We monitor withdrawal by source and reuse process water at the Kaunas plant.",
    dei: "## Diversity, equity and inclusion\n\nTarget: 40% women in management by 2028. Annual pay equity review by the HR team.",
    governance: "## ESG governance\n\nThe ESG Committee, chaired by the CEO, meets quarterly and approves the materiality assessment and the annual report.",
    "anti-corruption": "## Anti-corruption\n\nZero-tolerance policy; annual training for all at-risk staff; whistle-blowing channel operated by a third party.",
  };
  for (const [topicKey, content] of Object.entries(topicContent)) {
    db.insert(materialTopics).values({ accountId: acc, topicKey, content, isMaterial: true }).run();
  }
  db.insert(materialTopics).values({ accountId: acc, topicKey: "tax", isMaterial: false, content: "" }).run();

  db.insert(assessments).values({
    accountId: acc,
    data: {
      existingTopics: "Climate change, workplace safety and water were reported in the 2023 sustainability statement.",
      benchmarking: "Reviewed the reports of 6 European industrial peers; added responsible sourcing and DEI.",
      internalStakeholders: "Legal, finance, HR, operations, investor relations",
      externalStakeholders: "Key customers, lending banks, the works council, local municipality",
      engagementPlan: "Survey + 12 interviews, Q3 2025",
      meetingMinutes: "Workshop minutes 2025-09-18",
      committee: "CEO (chair), CFO, COO, HR director, environmental engineer",
      approvalNotes: "Findings approved at the ESG Committee meeting on 2025-10-02.",
      lastAssessed: "2025-10-02",
      nextAssessment: "2026-10-01",
      step1Done: "1", step2Done: "1", step3Done: "1",
    },
  }).run();

  const riskRows: Omit<typeof risks.$inferInsert, "accountId">[] = [
    { title: "Water scarcity at the Riga warehouse", topicKey: "water", physical: "Drought reduces municipal supply", regulatory: "Tighter abstraction permits", reputational: "", financial: "Higher water tariffs", probability: "B", impact: 4, probabilityRationale: "Two dry summers in the last three years", impactRationale: "Operations would pause for cleaning processes", mitigation: "Install rainwater harvesting; closed-loop washing", monitoring: "Monthly withdrawal vs permit; GRI 303 KPIs" },
    { title: "Carbon pricing under EU ETS2", topicKey: "climate-change", regulatory: "ETS2 from 2027 covers building and transport fuels", financial: "€0.4–0.9m annual cost at €45/t", probability: "A", impact: 4, probabilityRationale: "Legislation adopted", impactRationale: "Material impact on margins", mitigation: "Electrify heating at Kaunas; fleet transition", monitoring: "Scope 1 KPIs quarterly" },
    { title: "Serious injury at the Kaunas press line", topicKey: "workplace-safety", physical: "Crush hazards on the press line", reputational: "Loss of trust with employees", probability: "C", impact: 5, mitigation: "Light curtains and lock-out/tag-out retraining", monitoring: "Recordable injury rate (GRI 403-9)" },
    { title: "Supplier non-compliance with human rights standards", topicKey: "human-rights", regulatory: "CSDDD due diligence obligations", reputational: "Media exposure", probability: "C", impact: 4, mitigation: "Supplier code of conduct and audits", monitoring: "Supplier audit coverage" },
    { title: "Greenwashing claims on product marketing", topicKey: "governance", reputational: "Claims challenged under the Green Claims Directive", regulatory: "Fines", probability: "D", impact: 3, mitigation: "Legal review of all environmental claims", monitoring: "Marketing claim register" },
    { title: "Flooding of the Gothenburg plant", topicKey: "catastrophic-hazards", physical: "River flooding", financial: "Asset damage and downtime", probability: "E", impact: 5, mitigation: "Flood barriers; business continuity plan", monitoring: "Annual insurer survey" },
    { title: "Rising energy prices", topicKey: "climate-change", financial: "Energy is 9% of cost of goods sold", probability: "B", impact: 2, mitigation: "PPA for renewable electricity", monitoring: "Energy intensity (GRI 302-3)" },
    { title: "Bribery by agents in new markets", topicKey: "anti-corruption", regulatory: "Anti-bribery laws", reputational: "Loss of licences", probability: "D", impact: 4, mitigation: "Agent due diligence and training", monitoring: "Confirmed incidents (GRI 2-27)" },
  ];
  db.insert(risks).values(riskRows.map((r) => ({ ...r, accountId: acc, ownerId: userId }))).run();
  db.insert(signoffs).values([
    { accountId: acc, subject: "risks", stage: "prepared", userId, at: new Date("2026-02-05T10:00:00Z") },
    { accountId: acc, subject: "risks", stage: "reviewed", userId: hrId, at: new Date("2026-02-10T10:00:00Z") },
  ]).run();

  db.insert(kpiNotes).values([
    { accountId: acc, groupKey: "emissions", procedure: "1. Site engineers record fuel and electricity use from meters and invoices monthly (GRI 302-1).\n2. The environmental engineer applies DEFRA and IEA factors to calculate Scope 1 and 2 by source.\n3. Scope 3 is screened annually using spend data and supplier surveys.\n4. Results are prepared, reviewed by HR/finance and approved by the country manager." },
    { accountId: acc, groupKey: "energy", procedure: "Monthly meter readings in kWh per site, with the meter number recorded as the reference. Fuels are taken from invoices and converted to GJ." },
  ]).run();

  const postRows = [
    { slug: "welcome-to-esgcounts", title: "Welcome to ESGCounts", excerpt: "Why we are building ESG reporting software that is simple and affordable for European companies.", content: "Sustainability reporting is changing fast. With the **CSRD** and the ESRS, thousands of European companies are reporting on their environmental and social impact for the first time.\n\nOur mission is to provide customised ESG reporting software that makes reporting **simple and affordable**:\n\n- Risks and materiality assessments\n- ESG KPIs reporting, starting with GRI\n- Disclosures in line with ESG standards, regulations and frameworks\n\nStay tuned for product news." },
    { slug: "gri-energy-and-emissions-explained", title: "GRI 302 and 305 explained: from meter readings to tCO₂e", excerpt: "How site-level energy data rolls up into your Scope 1 and 2 disclosures.", content: "## Start with energy\n\nGRI 302-1 asks for fuel consumption, electricity, heating, cooling and steam, and energy sold. The total is:\n\n> a + b + c − d\n\n## Then emissions\n\nMultiply energy by country- and fuel-specific conversion factors to get Scope 1 and Scope 2 (GRI 305-1 and 305-2).\n\nIn ESGCounts you enter meter readings per site in kWh; totals roll up automatically by city, country and region." },
  ];
  for (const p of postRows) db.insert(posts).values({ ...p, published: true, publishedAt: new Date(), authorId: adminId }).run();
  console.log("✓ demo account, 4 sites, 3 reporting periods, 8 risks, blog posts");
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
