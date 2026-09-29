import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, first } from "@/lib/db";
import {
  assessments,
  auditLog,
  customFields,
  entries,
  kpiNotes,
  materialTopics,
  periods,
  risks,
  signoffs,
  sites,
  targets,
  users,
  type SignoffStage,
} from "@/lib/db/schema";
import { PeriodData } from "@/lib/gri/engine";

// Reads are memoised per request with React cache(), so layouts, pages and
// helpers can ask for the same data without extra round trips.

export const getSites = cache(async (accountId: number, includeInactive = false) => {
  const rows = await db
    .select()
    .from(sites)
    .where(eq(sites.accountId, accountId))
    .orderBy(asc(sites.region), asc(sites.country), asc(sites.city), asc(sites.name));
  return includeInactive ? rows : rows.filter((s) => s.active);
});

export const getCustomFields = cache(async (accountId: number) => {
  return db.select().from(customFields).where(eq(customFields.accountId, accountId)).orderBy(asc(customFields.id));
});

export const listPeriods = cache(async (accountId: number) => {
  return await db
    .select({
      id: periods.id,
      title: periods.title,
      startDate: periods.startDate,
      endDate: periods.endDate,
      status: periods.status,
      framework: periods.framework,
      updatedAt: periods.updatedAt,
      ownerId: periods.ownerId,
      owner: users.name,
    })
    .from(periods)
    .leftJoin(users, eq(periods.ownerId, users.id))
    .where(eq(periods.accountId, accountId))
    .orderBy(desc(periods.startDate));
});

export const getPeriod = cache(async (id: number, accountId: number) => {
  if (!Number.isInteger(id)) return undefined;
  return await db
    .select({
      id: periods.id,
      accountId: periods.accountId,
      title: periods.title,
      startDate: periods.startDate,
      endDate: periods.endDate,
      status: periods.status,
      framework: periods.framework,
      ownerId: periods.ownerId,
      owner: users.name,
      createdAt: periods.createdAt,
      updatedAt: periods.updatedAt,
    })
    .from(periods)
    .leftJoin(users, eq(periods.ownerId, users.id))
    .where(and(eq(periods.id, id), eq(periods.accountId, accountId)))
    .then(first);
});

export const loadPeriodData = cache(async (periodId: number, accountId: number) => {
  const [rows, custom] = await Promise.all([
    db.select().from(entries).where(eq(entries.periodId, periodId)),
    getCustomFields(accountId),
  ]);
  return new PeriodData(rows, custom);
});

/** Period data for every period of an account, oldest first (for trend charts). */
export const loadSeries = cache(async (accountId: number) => {
  const list = (await listPeriods(accountId)).slice().reverse();
  if (!list.length) return [];
  const [all, custom] = await Promise.all([
    db.select().from(entries).where(inArray(entries.periodId, list.map((p) => p.id))),
    getCustomFields(accountId),
  ]);
  return list.map((p) => ({ period: p, data: new PeriodData(all.filter((e) => e.periodId === p.id), custom) }));
});

export type Signoff = { stage: SignoffStage; name: string | null; jobTitle: string | null; at: Date };

export const getSignoffs = cache(async (accountId: number, subject: string) => {
  const rows = await db
    .select({ stage: signoffs.stage, at: signoffs.at, name: users.name, jobTitle: users.jobTitle })
    .from(signoffs)
    .leftJoin(users, eq(signoffs.userId, users.id))
    .where(and(eq(signoffs.accountId, accountId), eq(signoffs.subject, subject)))
    .orderBy(asc(signoffs.at));
  const out: Partial<Record<SignoffStage, Signoff>> = {};
  for (const r of rows) out[r.stage] = r;
  return out;
});

export const listRisks = cache(async (accountId: number) => {
  return db.select().from(risks).where(eq(risks.accountId, accountId)).orderBy(asc(risks.title));
});

export async function getActivity(accountId: number, entity?: string, limit = 30) {
  const where = entity ? and(eq(auditLog.accountId, accountId), eq(auditLog.entity, entity)) : eq(auditLog.accountId, accountId);
  return await db
    .select({ id: auditLog.id, at: auditLog.at, action: auditLog.action, entity: auditLog.entity, detail: auditLog.detail, user: users.name })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(where)
    .orderBy(desc(auditLog.id))
    .limit(limit);
}

export async function accountUsers(accountId: number) {
  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role, jobTitle: users.jobTitle, accountId: users.accountId })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name));
  return rows.filter((u) => u.accountId === accountId || u.role === "admin");
}

export const getTopicStates = cache(async (accountId: number) => {
  const rows = await db.select().from(materialTopics).where(eq(materialTopics.accountId, accountId));
  return new Map(rows.map((r) => [r.topicKey, r]));
});

export async function getKpiNote(accountId: number, groupKey: string) {
  return db.select().from(kpiNotes).where(and(eq(kpiNotes.accountId, accountId), eq(kpiNotes.groupKey, groupKey))).then(first);
}

export async function getTargets(accountId: number) {
  const rows = await db.select().from(targets).where(eq(targets.accountId, accountId));
  return new Map(rows.map((t) => [`${t.fieldKey}:${t.year}`, t.value]));
}

export async function getAssessment(accountId: number) {
  return db.select().from(assessments).where(eq(assessments.accountId, accountId)).then(first);
}

/** Year label for a period, e.g. "2025" or "2024/25". */
export function periodLabel(p: { startDate: string; endDate: string }) {
  const a = p.startDate.slice(0, 4);
  const b = p.endDate.slice(0, 4);
  return a === b ? a : `${a}/${b.slice(2)}`;
}
