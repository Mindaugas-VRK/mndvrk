"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db, first } from "@/lib/db";
import { PROBABILITIES, risks } from "@/lib/db/schema";
import { requireAccount } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { TOPIC_BY_KEY } from "@/lib/gri/topics";
import { riskScore } from "@/lib/gri/risks";
import type { ActionState } from "./types";

const txt = (max = 4000) => z.string().trim().max(max).default("");
const RiskSchema = z.object({
  title: z.string().trim().min(3, { error: "Give the risk a short title." }).max(200),
  topicKey: z.string().refine((k) => k === "" || TOPIC_BY_KEY.has(k)).default(""),
  physical: txt(),
  regulatory: txt(),
  reputational: txt(),
  financial: txt(),
  probability: z.enum(PROBABILITIES, { error: "Pick a probability." }),
  impact: z.coerce.number().int().min(1).max(5),
  probabilityRationale: txt(),
  impactRationale: txt(),
  mitigation: txt(),
  monitoring: txt(),
});

export async function saveRisk(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, account } = await requireAccount("data:edit");
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const parsed = RiskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const score = riskScore(parsed.data.probability, parsed.data.impact);

  if (id) {
    const existing = await db.select().from(risks).where(and(eq(risks.id, id), eq(risks.accountId, account.id))).then(first);
    if (!existing) return { error: "Risk not found." };
    await db.update(risks).set({ ...parsed.data, updatedAt: new Date() }).where(eq(risks.id, id));
    await audit({ userId: user.id, accountId: account.id, action: "updated", entity: `risk:${id}`, detail: `${parsed.data.title} (score ${score})` });
    revalidatePath("/dashboard/risks", "layout");
    return { success: "Risk saved." };
  }
  const [row] = await db.insert(risks).values({ ...parsed.data, accountId: account.id, ownerId: user.id }).returning({ id: risks.id });
  await audit({ userId: user.id, accountId: account.id, action: "created", entity: `risk:${row.id}`, detail: `${parsed.data.title} (score ${score})` });
  revalidatePath("/dashboard/risks", "layout");
  redirect(`/dashboard/risks/${row.id}`);
}

export async function deleteRisk(formData: FormData) {
  const { user, account } = await requireAccount("data:edit");
  const id = Number(formData.get("id"));
  await db.delete(risks).where(and(eq(risks.id, id), eq(risks.accountId, account.id)));
  await audit({ userId: user.id, accountId: account.id, action: "deleted", entity: `risk:${id}` });
  revalidatePath("/dashboard/risks", "layout");
  redirect("/dashboard/risks/key");
}
