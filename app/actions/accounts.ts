"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db, first } from "@/lib/db";
import { accounts, customFields, sites } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { GROUP_BY_KEY } from "@/lib/gri/catalog";
import { DIMENSIONS } from "@/lib/gri/units";
import type { ActionState } from "./types";

const AccountSchema = z.object({
  name: z.string().trim().min(2, { error: "Name is too short." }).max(160),
  industry: z.string().trim().max(120).default(""),
  country: z.string().trim().max(80).default(""),
});

export async function createAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("accounts:manage");
  const parsed = AccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const [row] = await db.insert(accounts).values(parsed.data).returning({ id: accounts.id });
  await audit({ userId: user.id, accountId: row.id, action: "created", entity: "account", detail: parsed.data.name });
  redirect(`/dashboard/settings/accounts/${row.id}`);
}

export async function updateAccount(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("accounts:manage");
  const id = Number(formData.get("id"));
  const parsed = AccountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  await db.update(accounts).set({ ...parsed.data, updatedAt: new Date() }).where(eq(accounts.id, id));
  await audit({ userId: user.id, accountId: id, action: "updated", entity: "account" });
  revalidatePath("/dashboard", "layout");
  return { success: "Account saved." };
}

const SiteSchema = z.object({
  name: z.string().trim().min(1, { error: "Site name is required." }).max(120),
  region: z.string().trim().max(80).default(""),
  country: z.string().trim().max(80).default(""),
  city: z.string().trim().max(80).default(""),
});

export async function createSite(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("accounts:manage");
  const accountId = Number(formData.get("accountId"));
  const parsed = SiteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  await db.insert(sites).values({ ...parsed.data, accountId });
  await audit({ userId: user.id, accountId, action: "created", entity: "site", detail: parsed.data.name });
  revalidatePath(`/dashboard/settings/accounts/${accountId}`);
  return { success: `Added ${parsed.data.name}.` };
}

export async function toggleSite(formData: FormData) {
  const user = await requireUser("accounts:manage");
  const id = Number(formData.get("id"));
  const site = await db.select().from(sites).where(eq(sites.id, id)).then(first);
  if (!site) return;
  await db.update(sites).set({ active: !site.active, updatedAt: new Date() }).where(eq(sites.id, id));
  await audit({ userId: user.id, accountId: site.accountId, action: site.active ? "deactivated" : "activated", entity: "site", detail: site.name });
  revalidatePath(`/dashboard/settings/accounts/${site.accountId}`);
}

const CustomFieldSchema = z.object({
  label: z.string().trim().min(2, { error: "Label is too short." }).max(200),
  groupKey: z.string().refine((k) => GROUP_BY_KEY.has(k), { error: "Pick a KPI group." }),
  dimension: z.string().refine((d) => d in DIMENSIONS, { error: "Pick a unit type." }),
  siteLevel: z.enum(["site", "account"]),
  description: z.string().trim().max(500).default(""),
});

export async function createCustomField(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("accounts:manage");
  const accountId = Number(formData.get("accountId"));
  const parsed = CustomFieldSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  await db.insert(customFields)
    .values({ ...parsed.data, siteLevel: parsed.data.siteLevel === "site", accountId });
  await audit({ userId: user.id, accountId, action: "created", entity: "custom-field", detail: parsed.data.label });
  revalidatePath(`/dashboard/settings/accounts/${accountId}`);
  return { success: `Added custom KPI “${parsed.data.label}”.` };
}

export async function deleteCustomField(formData: FormData) {
  const user = await requireUser("accounts:manage");
  const id = Number(formData.get("id"));
  const accountId = Number(formData.get("accountId"));
  await db.delete(customFields).where(and(eq(customFields.id, id), eq(customFields.accountId, accountId)));
  await audit({ userId: user.id, accountId, action: "deleted", entity: "custom-field", detail: String(id) });
  revalidatePath(`/dashboard/settings/accounts/${accountId}`);
}
