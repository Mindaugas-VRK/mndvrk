import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { authorizeUrl, linkedInConfig } from "@/lib/linkedin/client";
import { can } from "@/lib/permissions";
import { SITE_URL } from "@/lib/utils";

const STATE_COOKIE = "esg_li_state";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "blog:manage")) return NextResponse.redirect(new URL("/login", req.url));
  if (!linkedInConfig()) return NextResponse.redirect(new URL("/dashboard/settings/linkedin?error=not-configured", req.url));
  // LinkedIn only accepts the redirect URL registered in the app, so always run OAuth on the canonical host.
  if (new URL(req.url).origin !== new URL(SITE_URL).origin) return NextResponse.redirect(`${SITE_URL}/api/linkedin/connect`);

  const state = crypto.randomBytes(24).toString("base64url");
  (await cookies()).set(STATE_COOKIE, state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  const redirectUri = `${SITE_URL}/api/linkedin/callback`;
  return NextResponse.redirect(authorizeUrl(redirectUri, state));
}
