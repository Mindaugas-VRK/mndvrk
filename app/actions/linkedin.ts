"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, first } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { audit } from "@/lib/audit";
import { parsePostReference } from "@/lib/linkedin/client";
import { getLinkedIn, saveLinkedIn } from "@/lib/linkedin/store";
import { importFromLinkedIn, publishToLinkedIn } from "@/lib/linkedin/sync";
import type { ActionState } from "./types";

export async function saveLinkedInSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("blog:manage");
  const { settings } = await getLinkedIn();
  const orgInput = String(formData.get("organization") ?? "").trim();
  let organization = settings.organization;
  if (orgInput) {
    const listed = settings.organizations?.find((o) => o.urn === orgInput);
    const id = orgInput.match(/(\d{3,})$/)?.[1];
    if (listed) organization = listed;
    else if (id) organization = { urn: `urn:li:organization:${id}`, id, name: String(formData.get("organizationName") || `Page ${id}`) };
    else return { error: "Enter the numeric LinkedIn page ID (from the page admin URL, e.g. linkedin.com/company/12345678/admin)." };
  }
  await saveLinkedIn({
    settings: { organization, autoPublish: formData.get("autoPublish") === "on", autoImport: formData.get("autoImport") === "on" },
  });
  await audit({ userId: user.id, accountId: null, action: "updated LinkedIn settings", entity: "integration:linkedin", detail: organization?.name ?? "" });
  revalidatePath("/dashboard/settings/linkedin");
  return { success: "LinkedIn settings saved." };
}

export async function disconnectLinkedIn() {
  const user = await requireUser("blog:manage");
  await saveLinkedIn({ tokens: null, settings: { organizations: [], lastError: undefined } });
  await audit({ userId: user.id, accountId: null, action: "disconnected LinkedIn", entity: "integration:linkedin" });
  revalidatePath("/dashboard/settings/linkedin");
}

export async function importLinkedInNow(): Promise<ActionState> {
  await requireUser("blog:manage");
  try {
    const r = await importFromLinkedIn();
    revalidatePath("/dashboard/settings/linkedin");
    return { success: `Checked ${r.checked} LinkedIn posts, imported ${r.imported} new.` };
  } catch (e) {
    revalidatePath("/dashboard/settings/linkedin");
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sharePostToLinkedIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("blog:manage");
  const id = Number(formData.get("id"));
  try {
    const urn = await publishToLinkedIn(id);
    await audit({ userId: user.id, accountId: null, action: "shared post on LinkedIn", entity: `post:${id}`, detail: urn });
    revalidatePath(`/dashboard/blog/${id}`);
    return { success: "Published on the LinkedIn page." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Links a blog post to an existing LinkedIn post (pasted URL or embed code), e.g. one posted by hand. */
export async function linkPostToLinkedIn(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser("blog:manage");
  const id = Number(formData.get("id"));
  const raw = String(formData.get("linkedin") ?? "");
  if (!raw.trim()) {
    await db.update(posts).set({ linkedinUrn: null, linkedinSharedAt: null }).where(eq(posts.id, id));
    revalidatePath(`/dashboard/blog/${id}`);
    return { success: "LinkedIn link removed." };
  }
  const urn = parsePostReference(raw);
  if (!urn) return { error: "That doesn't look like a LinkedIn post link. Copy it from the post's ⋯ menu → Copy link to post, or → Embed this post." };
  const clash = await db.select({ id: posts.id }).from(posts).where(and(eq(posts.linkedinUrn, urn), ne(posts.id, id))).then(first);
  if (clash) return { error: "Another news item is already linked to that LinkedIn post." };
  await db.update(posts).set({ linkedinUrn: urn, linkedinSharedAt: new Date() }).where(eq(posts.id, id));
  const post = await db.select({ slug: posts.slug }).from(posts).where(eq(posts.id, id)).then(first);
  revalidatePath(`/dashboard/blog/${id}`);
  if (post) revalidatePath(`/blog/${post.slug}`);
  return { success: "Linked to the LinkedIn post." };
}
