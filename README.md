# ESGCounts — esgcounts.eu

Public website, blog and ESG reporting tool for [esgcounts.eu](https://esgcounts.eu).

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, PostgreSQL (Drizzle ORM). Hosted on Vercel with a Neon Postgres database in Frankfurt.
Brand rules and logo files: [`brand/BRAND.md`](brand/BRAND.md).
Product specs: [`docs/specs/`](docs/specs) (roadmap and the GRI indicator list the tool is built from).

## What's inside

**Public site (no login):** home, features, about, contact, privacy, blog (`/blog`), sitemap and robots.

**Reporting tool (`/dashboard`)**, following the roadmap *Assess → Collect → Report*:

| Area | What it does |
| --- | --- |
| Main dashboard | Material topics, risk matrix, headline KPIs from the latest approved period, GHG trend, period status |
| Materiality | Material topics by category (Overarching, Environment, People, Health & safety, Transparency), each with policies & procedures, linked KPIs and risks; 3-step double materiality assessment with sign-off |
| Risks | 5×5 probability × impact matrix (scores 1–25: Low / Medium / High / Critical), key-risks table, individual risks with hazard identification, rationale, mitigation, monitoring |
| ESG KPIs | Every GRI indicator from `docs/specs/GRI_indicators_to_report_on.xlsx` (302, 305, 303, 306, 301, 403-9, 2-7, 2-8, 2-21, 2-27, 2-30): procedure, trend charts, targets, standards (GRI / SDG / UNGC / ESRS) |
| Reporting | Reporting periods per account (start/end date, owner). Data is entered **per site** in any unit (kWh, MWh, GJ, m³, kg…) and **rolls up Site → City → Country → Region → Total**; formula fields (e.g. total energy = a + b + c − d, water consumption = withdrawal − discharge, injury rates per 1M hours, intensities with a free denominator) are computed at every level. Prepared → Reviewed → Approved workflow, audit trail, GRI content index, downloads as **Inline XBRL** (`.xhtml`, human- and machine-readable, see `docs/specs/XBRL.md`), **Excel** (`.xlsx`), CSV and PDF |
| Admin | Accounts (client companies), sites, custom KPI fields, users, blog, LinkedIn sync |
| LinkedIn | News → LinkedIn page on publish, LinkedIn page posts → news daily (Community Management API app required); manual “Share on LinkedIn” and post linking work without an app; branded share cards (`opengraph-image`). Setup steps: Admin → LinkedIn |

### Roles

| Role | Can |
| --- | --- |
| **Admin** | Everything, across all accounts: approve and reopen periods, manage accounts/sites/custom KPIs, users and the blog |
| **User** | Enter data, edit materiality, risks, procedures and targets, create periods, prepare and review (own account only) |
| **Viewer** | Read-only access to everything in their account, plus CSV export |

Authorization is enforced server-side on every page and server action (`lib/auth/dal.ts`, `lib/permissions.ts`);
`proxy.ts` only does an optimistic redirect to `/login`.

## Getting started (local)

```bash
npm install
cp .env.example .env.local        # set DATABASE_URL (Neon dev branch or local Docker Postgres)
npm run db:migrate                # create tables
npm run db:seed                   # admin + demo data
npm run dev                       # http://localhost:3000
```

Seeded logins:

- `admin@esgcounts.eu` / `ChangeMe-2026!` (or `ADMIN_EMAIL` / `ADMIN_PASSWORD`) — **change this**
- Demo account *Baltic Manufacturing UAB* (password `Demo-2026-pass`): `engineer@`, `hr@` (users), `viewer@` (viewer), `manager@` (admin) `@demo.esgcounts.eu`

## Scripts

| | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | Checks |
| `npm run db:generate` | New migration after editing `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations; create the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if missing (`RESET_ADMIN_PASSWORD=true` resets its password) |
| `npm run db:seed` | Seed admin and demo data |

## Where things live

- `lib/gri/catalog.ts` — the GRI indicator catalogue (fields, units, site vs account level, formulas)
- `lib/gri/engine.ts` — rollup engine (unit conversion, hierarchy buckets, formulas, completeness)
- `lib/gri/risks.ts`, `lib/gri/topics.ts` — risk matrix and material topics
- `app/(site)` — public pages; `app/dashboard` — the tool; `app/actions` — server actions

## Deploying to Vercel

1. Import the GitHub repo in Vercel (framework: Next.js, defaults).
2. **Storage → Create Database → Neon**, region Frankfurt, connect to all environments. This sets `DATABASE_URL`.
3. **Settings → Environment Variables**: `SESSION_SECRET` (32+ random chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL=https://esgcounts.eu`.
4. Redeploy. `vercel.json` runs `npm run db:migrate` before each build: it applies migrations and creates the `ADMIN_EMAIL` admin if it does not exist. Forgot the password? Set `RESET_ADMIN_PASSWORD=true`, redeploy, sign in, then remove it.
5. **Settings → Domains**: add `esgcounts.eu` and set the DNS records Vercel shows at your registrar.

To load the demo data into a database: `DATABASE_URL=… npm run db:seed` (skip in production, or use `SEED_DEMO=false`).

## Roadmap (from `docs/specs/Roadmap.xlsx`, not built yet)

Data import and integrations, mobile app with OCR, emission-factor library to compute Scope 1/2 from energy data,
industry templates, AI-drafted report narrative, XBRL digital tagging, Word export, economic KPIs.
