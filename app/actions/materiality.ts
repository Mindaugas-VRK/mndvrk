"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assessments, materialTopics } from "@/lib/db/schema";
import { requireAccount } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { TOPIC_BY_KEY } from "@/lib/gri/topics";
import { ASSESSMENT_KEYS } from "@/lib/gri/assessment";
import type { ActionState } from "./types";

export async function saveTopic(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, account } = await requireAccount("data:edit");
  const topicKey = String(formData.get("topicKey"));
  if (!TOPIC_BY_KEY.has(topicKey)) return { error: "Unknown topic." };
  const isMaterial = formData.get("isMaterial") === "on";
  const content = String(formData.get("content") ?? "").slice(0, 100_000);
  await db.insert(materialTopics)
    .values({ accountId: account.id, topicKey, isMaterial, content, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [materialTopics.accountId, materialTopics.topicKey], set: { isMaterial, content, updatedAt: new Date() } });
  await audit({ userId: user.id, accountId: account.id, action: "updated", entity: `topic:${topicKey}`, detail: isMaterial ? "material" : "not material" });
  revalidatePath("/dashboard/materiality", "layout");
  revalidatePath("/dashboard");
  return { success: "Topic saved." };
}


export async function saveAssessment(_: ActionState, formData: FormData): Promise<ActionState> {
  const { user, account } = await requireAccount("data:edit");
  const data: Record<string, string> = {};
  for (const k of ASSESSMENT_KEYS) {
    const v = formData.get(k);
    data[k] = k.endsWith("Done") ? (v === "on" ? "1" : "") : String(v ?? "").slice(0, 20_000);
  }
  await db.insert(assessments)
    .values({ accountId: account.id, data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: assessments.accountId, set: { data, updatedAt: new Date() } });
  await audit({ userId: user.id, accountId: account.id, action: "updated", entity: "materiality", detail: "assessment" });
  revalidatePath("/dashboard/materiality/assessment");
  return { success: "Assessment saved." };
}
