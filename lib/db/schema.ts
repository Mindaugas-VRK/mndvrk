import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const ROLES = ["admin", "user", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERIOD_STATUSES = ["draft", "in_review", "reviewed", "approved"] as const;
export type PeriodStatus = (typeof PERIOD_STATUSES)[number];

export const SIGNOFF_STAGES = ["prepared", "reviewed", "approved"] as const;
export type SignoffStage = (typeof SIGNOFF_STAGES)[number];

export const PROBABILITIES = ["A", "B", "C", "D", "E"] as const;
export type Probability = (typeof PROBABILITIES)[number];

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
};

/** A client organisation ("account") that reports ESG data. */
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  industry: text("industry").notNull().default(""),
  country: text("country").notNull().default(""),
  ...timestamps,
});

/** Physical locations. Region → Country → City → Site is the rollup hierarchy. */
export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  region: text("region").notNull().default(""),
  country: text("country").notNull().default(""),
  city: text("city").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("viewer"),
  /** Users and viewers belong to one account. Admins can access every account. */
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  jobTitle: text("job_title").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

/** A reporting period for one account (e.g. FY 2025, 1 Jan – 31 Dec). */
export const periods = sqliteTable("periods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  framework: text("framework").notNull().default("GRI"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status", { enum: PERIOD_STATUSES }).notNull().default("draft"),
  ...timestamps,
});

/**
 * One data point. siteId = 0 means an account-level value (disclosures,
 * organisation-specific denominators, remuneration, …).
 */
export const entries = sqliteTable(
  "entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    periodId: integer("period_id").notNull().references(() => periods.id, { onDelete: "cascade" }),
    siteId: integer("site_id").notNull().default(0),
    fieldKey: text("field_key").notNull(),
    value: real("value"),
    unit: text("unit").notNull().default(""),
    text: text("text").notNull().default(""),
    reference: text("reference").notNull().default(""),
    comment: text("comment").notNull().default(""),
    updatedById: integer("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex("entries_period_site_field").on(t.periodId, t.siteId, t.fieldKey)],
);

/** Account-specific KPI fields on top of the GRI catalogue. Keyed as `custom:<id>`. */
export const customFields = sqliteTable("custom_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  groupKey: text("group_key").notNull(),
  label: text("label").notNull(),
  dimension: text("dimension").notNull().default("number"),
  siteLevel: integer("site_level", { mode: "boolean" }).notNull().default(true),
  description: text("description").notNull().default(""),
  ...timestamps,
});

/** Prepared / Reviewed / Approved sign-offs. subject: "period:<id>", "risks", "materiality". */
export const signoffs = sqliteTable("signoffs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  stage: text("stage", { enum: SIGNOFF_STAGES }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  at: integer("at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const materialTopics = sqliteTable(
  "material_topics",
  {
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    topicKey: text("topic_key").notNull(),
    isMaterial: integer("is_material", { mode: "boolean" }).notNull().default(true),
    /** Policies and procedures, markdown. */
    content: text("content").notNull().default(""),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.topicKey] })],
);

/** Materiality assessment workspace, one per account (JSON blob of step notes). */
export const assessments = sqliteTable("assessments", {
  accountId: integer("account_id").primaryKey().references(() => accounts.id, { onDelete: "cascade" }),
  data: text("data", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const risks = sqliteTable("risks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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
export const kpiNotes = sqliteTable(
  "kpi_notes",
  {
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    groupKey: text("group_key").notNull(),
    procedure: text("procedure").notNull().default(""),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.groupKey] })],
);

export const targets = sqliteTable(
  "targets",
  {
    accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    year: integer("year").notNull(),
    value: real("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.fieldKey, t.year] })],
);

/** Append-only audit trail. */
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  at: integer("at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  detail: text("detail").notNull().default(""),
});

export type Account = typeof accounts.$inferSelect;
export type Site = typeof sites.$inferSelect;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Period = typeof periods.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Risk = typeof risks.$inferSelect;
export type CustomField = typeof customFields.$inferSelect;
