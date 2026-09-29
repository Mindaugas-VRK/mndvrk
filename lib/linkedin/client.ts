/**
 * Minimal LinkedIn REST client for Company Page posts (Community Management API).
 * Docs: https://learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api
 */

// Overridable only so the integration can be tested against a local mock server.
const API = process.env.LINKEDIN_API_BASE || "https://api.linkedin.com";
const OAUTH = process.env.LINKEDIN_OAUTH_BASE || "https://www.linkedin.com/oauth/v2";

export const DEFAULT_SCOPES = "r_organization_social w_organization_social rw_organization_admin";

export function linkedInConfig() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  return clientId && clientSecret
    ? { clientId, clientSecret, scopes: process.env.LINKEDIN_SCOPES || DEFAULT_SCOPES }
    : null;
}

/**
 * LinkedIn versions its API monthly (YYYYMM) and retires versions after about a
 * year. Default to three months ago, which is always live; override with
 * LINKEDIN_API_VERSION if LinkedIn asks for a specific one.
 */
export function apiVersion(now = new Date()) {
  if (process.env.LINKEDIN_API_VERSION) return process.env.LINKEDIN_API_VERSION;
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export class LinkedInError extends Error {
  constructor(message: string, readonly status: number, readonly body: string) {
    super(message);
  }
}

export type Tokens = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  refreshExpiresAt?: number;
  scope?: string;
};

function tokensFrom(json: Record<string, unknown>): Tokens {
  const now = Date.now();
  return {
    accessToken: String(json.access_token),
    expiresAt: now + Number(json.expires_in ?? 0) * 1000,
    refreshToken: json.refresh_token ? String(json.refresh_token) : undefined,
    refreshExpiresAt: json.refresh_token_expires_in ? now + Number(json.refresh_token_expires_in) * 1000 : undefined,
    scope: json.scope ? String(json.scope) : undefined,
  };
}

export function authorizeUrl(redirectUri: string, state: string) {
  const cfg = linkedInConfig();
  if (!cfg) throw new Error("LinkedIn is not configured.");
  const u = new URL(`${OAUTH}/authorization`);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", cfg.scopes);
  return u.toString();
}

async function tokenRequest(params: Record<string, string>) {
  const cfg = linkedInConfig();
  if (!cfg) throw new Error("LinkedIn is not configured.");
  const res = await fetch(`${OAUTH}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, client_id: cfg.clientId, client_secret: cfg.clientSecret }),
  });
  const text = await res.text();
  if (!res.ok) throw new LinkedInError(`LinkedIn token request failed (${res.status})`, res.status, text);
  return tokensFrom(JSON.parse(text));
}

export function exchangeCode(code: string, redirectUri: string) {
  return tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
}

export function refreshTokens(refreshToken: string) {
  return tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken });
}

async function rest(accessToken: string, path: string, init: RequestInit & { finder?: boolean } = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": apiVersion(),
      "X-Restli-Protocol-Version": "2.0.0",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.finder ? { "X-RestLi-Method": "FINDER" } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new LinkedInError(`LinkedIn API ${init.method ?? "GET"} ${path.split("?")[0]} failed (${res.status})`, res.status, text);
  return { res, json: text ? JSON.parse(text) : null };
}

export type Organization = { urn: string; id: string; name: string; vanityName?: string };

/** Organizations the connected member administers. */
export async function listAdminOrganizations(accessToken: string): Promise<Organization[]> {
  const { json } = await rest(accessToken, "/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=50", { finder: true });
  const urns: string[] = (json?.elements ?? []).map((e: { organization?: string; organizationTarget?: string }) => e.organization ?? e.organizationTarget).filter(Boolean);
  const orgs: Organization[] = [];
  for (const urn of [...new Set(urns)]) {
    const id = urn.split(":").pop()!;
    try {
      const { json: o } = await rest(accessToken, `/rest/organizations/${id}`);
      orgs.push({ urn, id, name: o?.localizedName ?? `Organization ${id}`, vanityName: o?.vanityName });
    } catch {
      orgs.push({ urn, id, name: `Organization ${id}` });
    }
  }
  return orgs;
}

/** Publishes a link post ("article" content) on the Company Page. Returns the post URN. */
export async function createLinkPost(
  accessToken: string,
  orgUrn: string,
  post: { commentary: string; url: string; title: string; description: string },
) {
  const { res } = await rest(accessToken, "/rest/posts", {
    method: "POST",
    body: JSON.stringify({
      author: orgUrn,
      commentary: escapeLittleText(post.commentary),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
      content: { article: { source: post.url, title: post.title.slice(0, 200), description: post.description.slice(0, 250) } },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  const urn = res.headers.get("x-restli-id") ?? res.headers.get("x-linkedin-id");
  if (!urn) throw new LinkedInError("LinkedIn did not return the new post id", res.status, "");
  return decodeURIComponent(urn);
}

export type LinkedInPost = {
  urn: string;
  commentary: string;
  publishedAt: number | null;
  articleUrl?: string;
  articleTitle?: string;
};

/** The organization's latest posts, newest first. */
export async function listOrganizationPosts(accessToken: string, orgUrn: string, count = 20): Promise<LinkedInPost[]> {
  const { json } = await rest(
    accessToken,
    `/rest/posts?q=author&author=${encodeURIComponent(orgUrn)}&count=${count}&sortBy=LAST_MODIFIED`,
    { finder: true },
  );
  type Raw = {
    id: string;
    commentary?: string;
    publishedAt?: number;
    createdAt?: number;
    lifecycleState?: string;
    visibility?: string;
    content?: { article?: { source?: string; title?: string } };
  };
  return ((json?.elements ?? []) as Raw[])
    .filter((p) => (p.lifecycleState ?? "PUBLISHED") === "PUBLISHED" && (p.visibility ?? "PUBLIC") === "PUBLIC")
    .map((p) => ({
      urn: p.id,
      commentary: p.commentary ?? "",
      publishedAt: p.publishedAt ?? p.createdAt ?? null,
      articleUrl: p.content?.article?.source,
      articleTitle: p.content?.article?.title,
    }));
}

/**
 * LinkedIn "little text" format: characters like ( ) [ ] { } < > @ | ~ _ * # \ must
 * be escaped in commentary, otherwise the post is rejected or mangled.
 */
export function escapeLittleText(s: string) {
  return s.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);
}

/** Turns LinkedIn commentary back into plain text: mentions → names, hashtags → #tag, unescape. */
export function plainFromLittleText(s: string) {
  return s
    .replace(/@\[([^\]]+)\]\(urn:li:[^)]+\)/g, "$1")
    .replace(/\{hashtag\|\\?#\|([^}]+)\}/g, "#$1")
    .replace(/\\([\\|{}@[\]()<>#*_~])/g, "$1");
}

/** The public URL of a post, e.g. https://www.linkedin.com/feed/update/urn:li:share:123/ */
export function postUrl(urn: string) {
  return `https://www.linkedin.com/feed/update/${urn}/`;
}

export function embedUrl(urn: string) {
  return `https://www.linkedin.com/embed/feed/update/${urn}`;
}

/** Accepts a LinkedIn post URL, an embed code or a bare URN and returns the URN. */
export function parsePostReference(input: string): string | null {
  const s = decodeURIComponent(input.trim());
  const m = s.match(/urn:li:(share|ugcPost|activity):\d+/);
  if (m) return m[0];
  const slug = s.match(/-(share|ugcPost|activity)-(\d{10,})/); // /posts/company_title-activity-7123456789-abcd
  if (slug) return `urn:li:${slug[1]}:${slug[2]}`;
  return null;
}
