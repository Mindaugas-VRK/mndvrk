"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { entries, periods, signoffs, sites } from "@/lib/db/schema";
import { assertAccountAccess, requireAccount, requireUser } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { GROUP_BY_KEY } from "@/lib/gri/catalog";
import { fieldsForGroup } from "@/lib/gri/engine";
import { DIMENSIONS, defaultUnit } from "@/lib/gri/units";
import { getCustomFields } from "@/lib/data";
import type { ActionState } from "./types";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Pick a date." });
const PeriodSchema = z
  .object({
    title: z.string().trim().min(2, { error: "Title is too short." }).max(160),
    startDate: date,
    endDate: date,
    ownerId: z.coerce.number().int().optional(),
  })
  .refine((d) => d.endDate > d.startDate, { error: "End date must be after the start date.", path: ["endDate"] });

export async function createPeriod(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, account } = await requireAccount("periods:create");
  const parsed = PeriodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const row = db
    .insert(periods)
    .values({ ...parsed.data, ownerId: parsed.data.ownerId || user.id, accountId: account.id })
    .returning({ id: periods.id })
    .get();
  audit({ userId: user.id, accountId: account.id, action: "created", entity: `period:${row.id}`, detail: parsed.data.title });
  redirect(`/dashboard/reporting/${row.id}`);
}

export async function updatePeriod(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, account } = await requireAccount("data:edit");
  const id = Number(formData.get("id"));
  const parsed = PeriodSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const period = db.select().from(periods).where(and(eq(periods.id, id), eq(periods.accountId, account.id))).get();
  if (!period) return { error: "Reporting period not found." };
  if (period.status === "approved") return { error: "Approved periods are locked. An admin can reopen them." };
  db.update(periods).set({ ...parsed.data, ownerId: parsed.data.ownerId || period.ownerId, updatedAt: new Date() }).where(eq(periods.id, id)).run();
  audit({ userId: user.id, accountId: account.id, action: "updated details", entity: `period:${id}` });
  revalidatePath(`/dashboard/reporting/${id}`);
  return { success: "Saved." };
}

export async function deletePeriod(formData: FormData) {
  const { user, account } = await requireAccount("periods:delete");
  const id = Number(formData.get("id"));
  db.delete(periods).where(and(eq(periods.id, id), eq(periods.accountId, account.id))).run();
  db.delete(signoffs).where(and(eq(signoffs.accountId, account.id), eq(signoffs.subject, `period:${id}`))).run();
  audit({ userId: user.id, accountId: account.id, action: "deleted", entity: `period:${id}` });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/reporting");
}

function parseNumber(raw: FormDataEntryValue | null) {
  const s = String(raw ?? "").trim().replace(/[\s ]/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Saves one KPI group's inputs for one site (or siteId 0 for account-level
 * fields). Editing data after sign-off clears the sign-offs so the period is
 * prepared and reviewed again.
 */
export async function saveEntries(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("data:edit");
  const periodId = Number(formData.get("periodId"));
  const siteId = Number(formData.get("siteId"));
  const group = GROUP_BY_KEY.get(String(formData.get("group")));
  const period = db.select().from(periods).where(eq(periods.id, periodId)).get();
  if (!period || !group) return { error: "Not found." };
  assertAccountAccess(user, period.accountId);
  if (period.status === "approved") return { error: "This period is approved and locked. An admin can reopen it." };
  if (siteId !== 0) {
    const site = db.select().from(sites).where(and(eq(sites.id, siteId), eq(sites.accountId, period.accountId))).get();
    if (!site) return { error: "Site not found." };
  }

  const fields = fieldsForGroup(group, getCustomFields(period.accountId)).filter((f) =>
    siteId === 0 ? f.kind !== "computed" && (f.kind !== "input" || f.level === "account") : f.kind === "input" && f.level === "site",
  );

  const fieldErrors: Record<string, string[]> = {};
  const rows = fields.map((f) => {
    const base = {
      periodId,
      siteId,
      fieldKey: f.key,
      reference: String(formData.get(`ref:${f.key}`) ?? "").slice(0, 120),
      comment: String(formData.get(`comment:${f.key}`) ?? "").slice(0, 1000),
      updatedById: user.id,
      updatedAt: new Date(),
    };
    if (f.kind === "input") {
      const value = parseNumber(formData.get(`value:${f.key}`));
      const unitRaw = String(formData.get(`unit:${f.key}`) ?? "");
      const unit = unitRaw in DIMENSIONS[f.dimension].units ? unitRaw : defaultUnit(f.dimension);
      if (Number.isNaN(value)) fieldErrors[`value:${f.key}`] = ["Must be a number."];
      else if (value !== null && value < 0) fieldErrors[`value:${f.key}`] = ["Can't be negative."];
      else if (value !== null && f.dimension === "percent" && value > 100) fieldErrors[`value:${f.key}`] = ["Must be 0–100."];
      return { ...base, value: Number.isNaN(value) ? null : value, unit, text: "" };
    }
    if (f.kind === "choice") {
      const picked = formData.getAll(`choice:${f.key}`).map(String).filter((o) => f.options.includes(o));
      return { ...base, value: null, unit: "", text: picked.join(", ") };
    }
    return { ...base, value: null, unit: "", text: String(formData.get(`text:${f.key}`) ?? "").slice(0, 10_000) };
  });
  if (Object.keys(fieldErrors).length) return { error: "Some values need fixing.", fieldErrors };

  let changed = 0;
  db.transaction((tx) => {
    for (const r of rows) {
      const existing = tx
        .select()
        .from(entries)
        .where(and(eq(entries.periodId, periodId), eq(entries.siteId, siteId), eq(entries.fieldKey, r.fieldKey)))
        .get();
      const same = existing && existing.value === r.value && existing.unit === r.unit && existing.text === r.text && existing.reference === r.reference && existing.comment === r.comment;
      if (same) continue;
      if (!existing && r.value === null && !r.text && !r.reference && !r.comment) continue;
      changed++;
      tx.insert(entries)
        .values(r)
        .onConflictDoUpdate({
          target: [entries.periodId, entries.siteId, entries.fieldKey],
          set: { value: r.value, unit: r.unit, text: r.text, reference: r.reference, comment: r.comment, updatedById: user.id, updatedAt: new Date() },
        })
        .run();
    }
    if (changed && period.status !== "draft") {
      tx.delete(signoffs).where(and(eq(signoffs.accountId, period.accountId), eq(signoffs.subject, `period:${periodId}`))).run();
      tx.update(periods).set({ status: "draft", updatedAt: new Date() }).where(eq(periods.id, periodId)).run();
    } else if (changed) {
      tx.update(periods).set({ updatedAt: new Date() }).where(eq(periods.id, periodId)).run();
    }
  });

  if (changed) {
    audit({
      userId: user.id,
      accountId: period.accountId,
      action: `updated ${changed} value${changed === 1 ? "" : "s"}`,
      entity: `period:${periodId}`,
      detail: `${group.title} · ${siteId === 0 ? "account level" : `site ${siteId}`}${period.status !== "draft" ? " · sign-offs reset" : ""}`,
    });
  }
  revalidatePath(`/dashboard/reporting/${periodId}`, "layout");
  return { success: changed ? `Saved ${changed} change${changed === 1 ? "" : "s"}.` : "No changes." };
}
