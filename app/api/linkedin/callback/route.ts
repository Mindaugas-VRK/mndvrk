import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { exchangeCode, listAdminOrganizations } from "@/lib/linkedin/client";
import { saveLinkedIn } from "@/lib/linkedin/store";
import { can } from "@/lib/permissions";
import { SITE_URL } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/dashboard/settings/linkedin?${q}`, req.url));
  const user = await getCurrentUser();
  if (!user || !can(user.role, "blog:manage")) return NextResponse.redirect(new URL("/login", req.url));

  const store = await cookies();
  const expected = store.get("esg_li_state")?.value;
  store.delete("esg_li_state");
  if (url.searchParams.get("error")) return back(`error=${encodeURIComponent(url.searchParams.get("error_description") ?? url.searchParams.get("error")!)}`);
  const code = url.searchParams.get("code");
  if (!code || !expected || url.searchParams.get("state") !== expected) return back("error=invalid-state");

  try {
    const tokens = await exchangeCode(code, `${SITE_URL}/api/linkedin/callback`);
    let organizations: Awaited<ReturnType<typeof listAdminOrganizations>> = [];
    try {
      organizations = await listAdminOrganizations(tokens.accessToken);
    } catch {
      // Without rw_organization_admin the page list is unavailable; the admin can enter the page ID instead.
    }
    await saveLinkedIn({
      tokens,
      settings: { organizations, organization: organizations.length === 1 ? organizations[0] : undefined, lastError: undefined },
    });
    await audit({ userId: user.id, accountId: null, action: "connected LinkedIn", entity: "integration:linkedin", detail: organizations.map((o) => o.name).join(", ") });
    return back("connected=1");
  } catch (e) {
    return back(`error=${encodeURIComponent(e instanceof Error ? e.message : "LinkedIn connection failed")}`);
  }
}
