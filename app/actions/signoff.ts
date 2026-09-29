"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, first } from "@/lib/db";
import { periods, signoffs, type SignoffStage } from "@/lib/db/schema";
import { requireAccount } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { getSignoffs } from "@/lib/data";

const ORDER: SignoffStage[] = ["prepared", "reviewed", "approved"];
const STATUS = { prepared: "in_review", reviewed: "reviewed", approved: "approved" } as const;

function validSubject(s: string) {
  return s === "risks" || s === "materiality" || /^period:\d+$/.test(s);
}

/** Records the next Prepared → Reviewed → Approved step for a subject. */
export async function signOff(formData: FormData) {
  const { user, account } = await requireAccount();
  const subject = String(formData.get("subject"));
  const stage = String(formData.get("stage")) as SignoffStage;
  const path = String(formData.get("path") || "/dashboard");
  if (!validSubject(subject) || !ORDER.includes(stage)) return;

  const cap = { prepared: "signoff:prepare", reviewed: "signoff:review", approved: "signoff:approve" } as const;
  if (!can(user.role, cap[stage])) return;

  const existing = await getSignoffs(account.id, subject);
  const idx = ORDER.indexOf(stage);
  if (idx > 0 && !existing[ORDER[idx - 1]]) return; // previous stage missing
  if (existing[stage]) return;

  let periodId: number | null = null;
  if (subject.startsWith("period:")) {
    periodId = Number(subject.split(":")[1]);
    const period = await db.select({ id: periods.id }).from(periods).where(and(eq(periods.id, periodId), eq(periods.accountId, account.id))).then(first);
    if (!period) return;
  }
  const inserted = await db.transaction(async (tx) => {
    // The unique (account, subject, stage) index makes a double click a no-op.
    const rows = await tx.insert(signoffs).values({ accountId: account.id, subject, stage, userId: user.id }).onConflictDoNothing().returning({ id: signoffs.id });
    if (rows.length && periodId !== null) {
      await tx.update(periods).set({ status: STATUS[stage], updatedAt: new Date() }).where(eq(periods.id, periodId));
    }
    return rows.length > 0;
  });
  if (!inserted) return;
  await audit({ userId: user.id, accountId: account.id, action: stage, entity: subject });
  revalidatePath(path);
  revalidatePath("/dashboard", "layout");
}

/** Clears all sign-offs (admin only) so the subject can be edited and signed again. */
export async function reopen(formData: FormData) {
  const { user, account } = await requireAccount("signoff:reopen");
  const subject = String(formData.get("subject"));
  const path = String(formData.get("path") || "/dashboard");
  if (!validSubject(subject)) return;
  await db.delete(signoffs).where(and(eq(signoffs.accountId, account.id), eq(signoffs.subject, subject)));
  if (subject.startsWith("period:")) {
    const id = Number(subject.split(":")[1]);
    await db.update(periods).set({ status: "draft", updatedAt: new Date() }).where(and(eq(periods.id, id), eq(periods.accountId, account.id)));
  }
  await audit({ userId: user.id, accountId: account.id, action: "reopened", entity: subject });
  revalidatePath(path);
  revalidatePath("/dashboard", "layout");
}
