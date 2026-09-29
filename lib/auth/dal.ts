import "server-only";
import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { accounts, users, type Account, type Role } from "@/lib/db/schema";
import { can, type Capability } from "@/lib/permissions";
import { SESSION_COOKIE, decrypt } from "./session";

export const ACCOUNT_COOKIE = "esg_account";

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  accountId: number | null;
  jobTitle: string;
};

/**
 * Returns the signed-in user, re-validated against the database on every
 * request so role changes and deactivations take effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);
  if (!session) return null;

  const user = db.select().from(users).where(eq(users.id, session.userId)).get();
  if (!user || !user.active) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountId: user.accountId,
    jobTitle: user.jobTitle,
  };
});

/** Require a signed-in user, optionally with a capability. Redirects otherwise. */
export async function requireUser(capability?: Capability) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (capability && !can(user.role, capability)) redirect("/dashboard?denied=1");
  return user;
}

/** Accounts the user may open: all for admins, their own for everyone else. */
export function accessibleAccounts(user: CurrentUser): Account[] {
  if (user.role === "admin") return db.select().from(accounts).orderBy(asc(accounts.name)).all();
  if (!user.accountId) return [];
  const a = db.select().from(accounts).where(eq(accounts.id, user.accountId)).get();
  return a ? [a] : [];
}

export const getAccountContext = cache(async () => {
  const user = await requireUser();
  const list = accessibleAccounts(user);
  const wanted = Number((await cookies()).get(ACCOUNT_COOKIE)?.value);
  const account = list.find((a) => a.id === wanted) ?? list[0] ?? null;
  return { user, account, accounts: list };
});

/** Require a user with an active account. Users without an account see a notice page. */
export async function requireAccount(capability?: Capability) {
  const ctx = await getAccountContext();
  if (capability && !can(ctx.user.role, capability)) redirect("/dashboard?denied=1");
  if (!ctx.account) redirect("/dashboard/no-account");
  return { ...ctx, account: ctx.account };
}

/** For server actions: verify the user may act on the given account. */
export function assertAccountAccess(user: CurrentUser, accountId: number) {
  if (user.role !== "admin" && user.accountId !== accountId) {
    throw new Error("Forbidden");
  }
}
