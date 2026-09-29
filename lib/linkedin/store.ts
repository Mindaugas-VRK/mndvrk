import "server-only";
import { eq } from "drizzle-orm";
import { db, first } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { refreshTokens, type Organization, type Tokens } from "./client";
import { decrypt, encrypt } from "./crypto";

export type LinkedInSettings = {
  organization?: Organization;
  organizations?: Organization[];
  memberName?: string;
  autoPublish?: boolean;
  autoImport?: boolean;
  lastImportAt?: string;
  lastError?: string;
};

export async function getLinkedIn() {
  const row = await db.select().from(integrations).where(eq(integrations.key, "linkedin")).then(first);
  const tokens = row ? decrypt<Tokens>(row.data) : null;
  const settings = (row?.settings ?? {}) as LinkedInSettings;
  return { connected: !!tokens, tokens, settings, updatedAt: row?.updatedAt ?? null };
}

export async function saveLinkedIn(update: { tokens?: Tokens | null; settings?: Partial<LinkedInSettings> }) {
  const current = await getLinkedIn();
  const tokens = update.tokens === undefined ? current.tokens : update.tokens;
  const settings = { ...current.settings, ...update.settings };
  const data = tokens ? encrypt(tokens) : "";
  await db
    .insert(integrations)
    .values({ key: "linkedin", data, settings, updatedAt: new Date() })
    .onConflictDoUpdate({ target: integrations.key, set: { data, settings, updatedAt: new Date() } });
}

/** A usable access token, refreshing it when it expires within a day. Null when not connected or expired. */
export async function accessToken() {
  const { tokens } = await getLinkedIn();
  if (!tokens) return null;
  const soon = Date.now() + 24 * 60 * 60 * 1000;
  if (tokens.expiresAt > soon) return tokens.accessToken;
  if (tokens.refreshToken && (!tokens.refreshExpiresAt || tokens.refreshExpiresAt > Date.now())) {
    const fresh = await refreshTokens(tokens.refreshToken);
    // LinkedIn may not return a new refresh token; keep the old one and its expiry.
    await saveLinkedIn({ tokens: { ...fresh, refreshToken: fresh.refreshToken ?? tokens.refreshToken, refreshExpiresAt: fresh.refreshExpiresAt ?? tokens.refreshExpiresAt } });
    return fresh.accessToken;
  }
  return tokens.expiresAt > Date.now() ? tokens.accessToken : null;
}
