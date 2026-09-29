import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const ROLES = ["admin", "user", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERIOD_STATUSES = ["draft", "in_review", "reviewed", "approved"] as const;
export type PeriodStatus = (typeof PERIOD_STATUSES)[number];

export const SIGNOFF_STAGES = ["prepared", "reviewed", "approved"] as const;
export type SignoffStage = (typeof SIGNOFF_STAGES)[number];

export const POST_SOURCES = ["site", "linkedin"] as const;

export const PROBABILITIES = ["A", "B", "C", "D", "E"] as const;
export type Probability = (typeof PROBABILITIES)[number];

const ts = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();

const timestamps = {
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at"),
};

/** A client organisation ("account") that reports ESG data. */
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default(""),
  country: text("country").notNull().default(""),
  ...timestamps,
});

/** Physical locations. Region → Country → City → Site is the rollup hierarchy. */
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  region: text("region").notNull().default(""),
  country: text("country").notNull().default(""),
  city: text("city").notNull().default(""),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("viewer"),
  /** Users and viewers belong to one account. Admins can access every account. */
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  jobTitle: text("job_title").notNull().default(""),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  /** "site" = written here; "linkedin" = imported from the LinkedIn page. */
  source: text("source", { enum: POST_SOURCES }).notNull().default("site"),
  /** The matching LinkedIn post (urn:li:share:… / urn:li:ugcPost:…), when shared or imported. */
  linkedinUrn: text("linkedin_urn").unique(),
  linkedinSharedAt: timestamp("linkedin_shared_at", { withTimezone: true }),
  ...timestamps,
});

/** A reporting period for one account (e.g. FY 2025, 1 Jan – 31 Dec). */
export const periods = pgTable("periods", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  framework: text("framework").notNull().default("GRI"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status", { enum: PERIOD_STATUSES }).notNull().default("draft"),
  ...timestamps,
}, (t) => [index("periods_account_idx").on(t.accountId)]);

/**
 * One data point. siteId = 0 means an account-level value (disclosures,
 * organisation-specific denominators, remuneration, …).
 */
export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    periodId: integer("period_id").notNull().references(() => periods.id, { onDelete: "cascade" }),
    siteId: integer("site_id").notNull().default(0),
    fieldKey: text("field_key").notNull(),
    value: doublePrecision("value"),
    unit: text("unit").notNull().default(""),
    text: text("text").notNull().default(""),
    reference: text("reference").notNull().default(""),
    comment: text("comment").notNull().default(""),
    updatedById: integer("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    updatedAt: ts("updated_at"),
  },
  (t) => [uniqueIndex("entries_period_site_field").on(t.periodId, t.siteId, t.fieldKey)],
);

/** Account-specific KPI fields on top of the GRI catalogue. Keyed as `custom:<id>`. */
export const customFields = pgTable("custom_fields", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  groupKey: text("group_key").notNull(),
  label: text("label").notNull(),
  dimension: text("dimension").notNull().default("number"),
  siteLevel: boolean("site_level").notNull().default(true),
  description: text("description").notNull().default(""),
  ...timestamps,
});

/** Prepared / Reviewed / Approved sign-offs. subject: "period:<id>", "risks", "materiality". */
export const signoffs = pgTable("signoffs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  stage: text("stage", { enum: SIGNOFF_STAGES }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  at: ts("at"),
}, (t) => [uniqueIndex("signoffs_subject_stage").on(t.accountId, t.subject, t.stage)]);

export const materialTopics = pgTable(
  "material_topics",
  {
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    topicKey: text("topic_key").notNull(),
    isMaterial: boolean("is_material").notNull().default(true),
    /** Policies and procedures, markdown. */
    content: text("content").notNull().default(""),
    updatedAt: ts("updated_at"),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.topicKey] })],
);

/** Materiality assessment workspace, one per account (JSON blob of step notes). */
export const assessments = pgTable("assessments", {
  accountId: integer("account_id").primaryKey().references(() => accounts.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, string>>().notNull().default({}),
  updatedAt: ts("updated_at"),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  topicKey: text("topic_key").notNull().default(""),
  physical: text("physical").notNull().default(""),
  regulatory: text("regulatory").notNull().default(""),
  reputational: text("reputational").notNull().default(""),
  financial: text("financial").notNull().default(""),
  probability: text("probability", { enum: PROBABILITIES }).notNull(),
  impact: integer("impact").notNull(),
  probabilityRationale: text("probability_rationale").notNull().default(""),
  impactRationale: text("impact_rationale").notNull().default(""),
  mitigation: text("mitigation").notNull().default(""),
  monitoring: text("monitoring").notNull().default(""),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

/** KPI procedure text per account and KPI group. */
export const kpiNotes = pgTable(
  "kpi_notes",
  {
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    groupKey: text("group_key").notNull(),
    procedure: text("procedure").notNull().default(""),
    updatedAt: ts("updated_at"),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.groupKey] })],
);

export const targets = pgTable(
  "targets",
  {
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    year: integer("year").notNull(),
    value: doublePrecision("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.fieldKey, t.year] })],
);

/** Append-only audit trail. */
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  at: ts("at"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  detail: text("detail").notNull().default(""),
}, (t) => [index("audit_log_account_idx").on(t.accountId, t.id)]);

/**
 * Third-party connections (currently only "linkedin"). Secrets in `data` are
 * encrypted with lib/linkedin/crypto.ts before they are stored.
 */
export const integrations = pgTable("integrations", {
  key: text("key").primaryKey(),
  data: text("data").notNull().default(""),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: ts("updated_at"),
});

export type Account = typeof accounts.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Period = typeof periods.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Risk = typeof risks.$inferSelect;
export type CustomField = typeof customFields.$inferSelect;
