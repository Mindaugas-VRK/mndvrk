"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { PasswordSchema } from "@/lib/validation";
import type { ActionState } from "./types";

const LoginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const user = db.select().from(users).where(eq(users.email, parsed.data.email)).get();
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !ok || !user.active) return { error: "Invalid email or password." };

  await createSession({ userId: user.id, role: user.role });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/dashboard") ? next : "/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function changePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = PasswordSchema.safeParse(formData.get("password"));
  if (!next.success) return { fieldErrors: { password: next.error.issues.map((i) => i.message) } };
  if (next.data !== formData.get("confirm")) return { fieldErrors: { confirm: ["Passwords do not match."] } };

  const user = db.select().from(users).where(eq(users.id, me.id)).get();
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return { fieldErrors: { current: ["Current password is incorrect."] } };
  }

  db.update(users)
    .set({ passwordHash: await hashPassword(next.data), updatedAt: new Date() })
    .where(eq(users.id, me.id))
    .run();
  return { success: "Password updated." };
}
