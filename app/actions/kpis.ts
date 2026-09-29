"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { kpiNotes, targets } from "@/lib/db/schema";
import { requireAccount } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { FIELD_BY_KEY, GROUP_BY_KEY, isNumeric } from "@/lib/gri/catalog";
import type { ActionState } from "./types";

export async function saveProcedure(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, account } = await requireAccount("data:edit");
  const groupKey = String(formData.get("group"));
  if (!GROUP_BY_KEY.has(groupKey)) return { error: "Unknown KPI." };
  const procedure = String(formData.get("procedure") ?? "").slice(0, 50_000);
  db.insert(kpiNotes)
    .values({ accountId: account.id, groupKey, procedure, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [kpiNotes.accountId, kpiNotes.groupKey], set: { procedure, updatedAt: new Date() } })
    .run();
  audit({ userId: user.id, accountId: account.id, action: "updated procedure", entity: `kpi:${groupKey}` });
  revalidatePath(`/dashboard/kpis/${groupKey}`);
  return { success: "Procedure saved." };
}

export async function saveTarget(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, account } = await requireAccount("data:edit");
  const fieldKey = String(formData.get("fieldKey"));
  const field = FIELD_BY_KEY.get(fieldKey);
  const year = Number(formData.get("year"));
  const raw = String(formData.get("value") ?? "").trim().replace(",", ".");
  if (!field || !isNumeric(field) || !Number.isInteger(year) || year < 2000 || year > 2100) return { error: "Invalid target." };
  const group = String(formData.get("group"));

  if (raw === "") {
    db.delete(targets).where(and(eq(targets.accountId, account.id), eq(targets.fieldKey, fieldKey), eq(targets.year, year))).run();
  } else {
    const value = Number(raw);
    if (!Number.isFinite(value)) return { error: "Target must be a number." };
    db.insert(targets)
      .values({ accountId: account.id, fieldKey, year, value })
      .onConflictDoUpdate({ target: [targets.accountId, targets.fieldKey, targets.year], set: { value } })
      .run();
  }
  audit({ userId: user.id, accountId: account.id, action: "set target", entity: `kpi:${group}`, detail: `${field.label} ${year}: ${raw || "removed"}` });
  revalidatePath(`/dashboard/kpis/${group}`);
  revalidatePath("/dashboard");
  return { success: "Target saved." };
}
