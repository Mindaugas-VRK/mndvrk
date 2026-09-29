"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { ROLES, users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { PasswordSchema } from "@/lib/validation";
import type { ActionState } from "./types";

const CreateUserSchema = z.object({
  name: z.string().trim().min(2, { error: "Name is too short." }),
  email: z.email({ error: "Enter a valid email." }).trim().toLowerCase(),
  role: z.enum(ROLES),
  jobTitle: z.string().trim().max(120).default(""),
  accountId: z.coerce.number().int().optional(),
  password: PasswordSchema,
});

export async function createUser(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("users:manage");
  const parsed = CreateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  if (parsed.data.role !== "admin" && !parsed.data.accountId) {
    return { fieldErrors: { accountId: ["Users and viewers must belong to an account."] } };
  }

  const exists = db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).get();
  if (exists) return { fieldErrors: { email: ["A user with this email already exists."] } };

  db.insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      jobTitle: parsed.data.jobTitle,
      accountId: parsed.data.accountId || null,
      passwordHash: await hashPassword(parsed.data.password),
    })
    .run();

  revalidatePath("/dashboard/users");
  return { success: `Created ${parsed.data.email}. Share the temporary password with them securely.` };
}

/** Prevents an admin from removing the last remaining active admin. */
function isLastActiveAdmin(userId: number) {
  const others = db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, userId)))
    .all();
  return others.length === 0;
}

export async function updateUserRole(formData: FormData) {
  await requireUser("users:manage");
  const id = Number(formData.get("id"));
  const role = z.enum(ROLES).parse(formData.get("role"));
  const target = db.select().from(users).where(eq(users.id, id)).get();
  if (!target) return;
  if (target.role === "admin" && role !== "admin" && isLastActiveAdmin(id)) return;

  db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).run();
  revalidatePath("/dashboard/users");
}

export async function toggleUserActive(formData: FormData) {
  const me = await requireUser("users:manage");
  const id = Number(formData.get("id"));
  if (id === me.id) return;
  const target = db.select().from(users).where(eq(users.id, id)).get();
  if (!target) return;
  if (target.active && target.role === "admin" && isLastActiveAdmin(id)) return;

  db.update(users).set({ active: !target.active, updatedAt: new Date() }).where(eq(users.id, id)).run();
  revalidatePath("/dashboard/users");
}

export async function resetUserPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("users:manage");
  const id = Number(formData.get("id"));
  const parsed = PasswordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  db.update(users)
    .set({ passwordHash: await hashPassword(parsed.data), updatedAt: new Date() })
    .where(eq(users.id, id))
    .run();
  return { success: "Password reset." };
}

export async function updateUserAccount(formData: FormData) {
  await requireUser("users:manage");
  const id = Number(formData.get("id"));
  const accountId = Number(formData.get("accountId")) || null;
  db.update(users).set({ accountId, updatedAt: new Date() }).where(eq(users.id, id)).run();
  revalidatePath("/dashboard/users");
}
