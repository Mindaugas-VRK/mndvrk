"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCOUNT_COOKIE, accessibleAccounts, requireUser } from "@/lib/auth/dal";

export async function switchAccount(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("accountId"));
  if (!(await accessibleAccounts(user)).some((a) => a.id === id)) return;
  (await cookies()).set(ACCOUNT_COOKIE, String(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/dashboard");
}
