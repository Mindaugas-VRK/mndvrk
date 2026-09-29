import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  auditLog,
  kpiNotes,
  materialTopics,
  targets,
  customFields,
  entries,
  periods,
  risks,
  signoffs,
  sites,
  users,
  type SignoffStage,
} from "@/lib/db/schema";
import { PeriodData } from "@/lib/gri/engine";

export function getSites(accountId: number, includeInactive = false) {
  const rows = db.select().from(sites).where(eq(sites.accountId, accountId)).orderBy(asc(sites.region), asc(sites.country), asc(sites.city), asc(sites.name)).all();
  return includeInactive ? rows : rows.filter((s) => s.active);
}

export function getCustomFields(accountId: number) {
  return db.select().from(customFields).where(eq(customFields.accountId, accountId)).orderBy(asc(customFields.id)).all();
}

export function listPeriods(accountId: number) {
  return db
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
    .orderBy(desc(periods.startDate))
    .all();
}

export function getPeriod(id: number, accountId: number) {
  if (!Number.isInteger(id)) return undefined;
  return db
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
    .get();
}

export function loadPeriodData(periodId: number, accountId: number) {
  const rows = db.select().from(entries).where(eq(entries.periodId, periodId)).all();
  return new PeriodData(rows, getCustomFields(accountId));
}

/** Period data for several periods at once, oldest first (for trend charts). */
export function loadSeries(accountId: number) {
  const list = listPeriods(accountId).slice().reverse();
  if (!list.length) return [];
  const all = db.select().from(entries).where(inArray(entries.periodId, list.map((p) => p.id))).all();
  const custom = getCustomFields(accountId);
  return list.map((p) => ({ period: p, data: new PeriodData(all.filter((e) => e.periodId === p.id), custom) }));
}

export type Signoff = { stage: SignoffStage; name: string | null; jobTitle: string | null; at: Date };

export function getSignoffs(accountId: number, subject: string): Partial<Record<SignoffStage, Signoff>> {
  const rows = db
    .select({ stage: signoffs.stage, at: signoffs.at, name: users.name, jobTitle: users.jobTitle })
    .from(signoffs)
    .leftJoin(users, eq(signoffs.userId, users.id))
    .where(and(eq(signoffs.accountId, accountId), eq(signoffs.subject, subject)))
    .orderBy(asc(signoffs.at))
    .all();
  const out: Partial<Record<SignoffStage, Signoff>> = {};
  for (const r of rows) out[r.stage] = r;
  return out;
}

export function listRisks(accountId: number) {
  return db.select().from(risks).where(eq(risks.accountId, accountId)).orderBy(asc(risks.title)).all();
}

export function getActivity(accountId: number, entityPrefix?: string, limit = 30) {
  const rows = db
    .select({ id: auditLog.id, at: auditLog.at, action: auditLog.action, entity: auditLog.entity, detail: auditLog.detail, user: users.name })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .where(eq(auditLog.accountId, accountId))
    .orderBy(desc(auditLog.id))
    .limit(entityPrefix ? 500 : limit)
    .all();
  return entityPrefix ? rows.filter((r) => r.entity.startsWith(entityPrefix)).slice(0, limit) : rows;
}

export function accountUsers(accountId: number) {
  return db
    .select({ id: users.id, name: users.name, role: users.role, jobTitle: users.jobTitle, accountId: users.accountId })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name))
    .all()
    .filter((u) => u.accountId === accountId || u.role === "admin");
}

export function getTopicStates(accountId: number) {
  const rows = db.select().from(materialTopics).where(eq(materialTopics.accountId, accountId)).all();
  return new Map(rows.map((r) => [r.topicKey, r]));
}

export function getKpiNote(accountId: number, groupKey: string) {
  return db.select().from(kpiNotes).where(and(eq(kpiNotes.accountId, accountId), eq(kpiNotes.groupKey, groupKey))).get();
}

export function getTargets(accountId: number) {
  const rows = db.select().from(targets).where(eq(targets.accountId, accountId)).all();
  return new Map(rows.map((t) => [`${t.fieldKey}:${t.year}`, t.value]));
}

export function getAssessment(accountId: number) {
  return db.select().from(assessments).where(eq(assessments.accountId, accountId)).get();
}

/** Year label for a period, e.g. "2025" or "2024/25". */
export function periodLabel(p: { startDate: string; endDate: string }) {
  const a = p.startDate.slice(0, 4);
  const b = p.endDate.slice(0, 4);
  return a === b ? a : `${a}/${b.slice(2)}`;
}
