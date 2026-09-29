# ESGCounts — esgcounts.eu

Public website, blog and ESG reporting tool for [esgcounts.eu](https://esgcounts.eu).

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, SQLite (better-sqlite3 + Drizzle ORM).
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
| Reporting | Reporting periods per account (start/end date, owner). Data is entered **per site** in any unit (kWh, MWh, GJ, m³, kg…) and **rolls up Site → City → Country → Region → Total**; formula fields (e.g. total energy = a + b + c − d, water consumption = withdrawal − discharge, injury rates per 1M hours, intensities with a free denominator) are computed at every level. Prepared → Reviewed → Approved workflow, audit trail, GRI content index (print/PDF), CSV export |
| Admin | Accounts (client companies), sites, custom KPI fields, users, blog |

### Roles

| Role | Can |
| --- | --- |
| **Admin** | Everything, across all accounts: approve and reopen periods, manage accounts/sites/custom KPIs, users and the blog |
| **User** | Enter data, edit materiality, risks, procedures and targets, create periods, prepare and review (own account only) |
| **Viewer** | Read-only access to everything in their account, plus CSV export |

Authorization is enforced server-side on every page and server action (`lib/auth/dal.ts`, `lib/permissions.ts`);
`proxy.ts` only does an optimistic redirect to `/login`.

## Getting started

```bash
npm install
cp .env.example .env.local        # set SESSION_SECRET for production
npm run db:seed                   # creates the admin (+ demo data)
npm run dev                       # http://localhost:3000
```

The database and its migrations are created automatically on first start. Seeded logins:

- `admin@esgcounts.eu` / `ChangeMe-2026!` (or `ADMIN_EMAIL` / `ADMIN_PASSWORD`) — **change this**
- Demo account *Baltic Manufacturing UAB* (password `Demo-2026-pass`): `engineer@`, `hr@` (users), `viewer@` (viewer), `manager@` (admin) `@demo.esgcounts.eu`

Run with `SEED_DEMO=false` to create only the admin.

## Scripts

| | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | Checks |
| `npm run db:generate` | New migration after editing `lib/db/schema.ts` |
| `npm run db:seed` | Seed admin and demo data |

## Where things live

- `lib/gri/catalog.ts` — the GRI indicator catalogue (fields, units, site vs account level, formulas)
- `lib/gri/engine.ts` — rollup engine (unit conversion, hierarchy buckets, formulas, completeness)
- `lib/gri/risks.ts`, `lib/gri/topics.ts` — risk matrix and material topics
- `app/(site)` — public pages; `app/dashboard` — the tool; `app/actions` — server actions

## Deploying

Runs anywhere Node 20.9+ runs with a persistent disk for SQLite (a VPS, Docker, Fly.io, Railway…):
`npm ci && npm run build && npm start`, with `SESSION_SECRET` and `DATABASE_PATH` set, then point esgcounts.eu at it behind HTTPS.
Serverless hosts (e.g. Vercel) need a hosted database instead of the local SQLite file.

## Roadmap (from `docs/specs/Roadmap.xlsx`, not built yet)

Data import and integrations, mobile app with OCR, emission-factor library to compute Scope 1/2 from energy data,
industry templates, AI-drafted report narrative, XBRL digital tagging, Word export, economic KPIs.
