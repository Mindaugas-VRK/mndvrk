import "server-only";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, first } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { SITE_URL, slugify } from "@/lib/utils";
import { LinkedInError, createLinkPost, listOrganizationPosts, plainFromLittleText } from "./client";
import { accessToken, getLinkedIn, saveLinkedIn } from "./store";

function describe(e: unknown) {
  if (e instanceof LinkedInError) {
    if (e.status === 401) return "LinkedIn session expired. Reconnect LinkedIn.";
    if (e.status === 403) return "LinkedIn refused the request (403). Check that the app has the Community Management API and that you are an admin of the page.";
    return `${e.message}${e.body ? `: ${e.body.slice(0, 200)}` : ""}`;
  }
  return e instanceof Error ? e.message : String(e);
}

/** Shares a published blog post on the Company Page. Returns the LinkedIn post URN. */
export async function publishToLinkedIn(postId: number) {
  const post = await db.select().from(posts).where(eq(posts.id, postId)).then(first);
  if (!post || !post.published) throw new Error("Only published posts can be shared.");
  if (post.linkedinUrn) return post.linkedinUrn;
  const { settings } = await getLinkedIn();
  const token = await accessToken();
  if (!token || !settings.organization) throw new Error("Connect LinkedIn and choose the ESGCounts page first.");

  try {
    const urn = await createLinkPost(token, settings.organization.urn, {
      commentary: [post.title, post.excerpt].filter(Boolean).join("\n\n"),
      url: `${SITE_URL}/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
    });
    await db.update(posts).set({ linkedinUrn: urn, linkedinSharedAt: new Date() }).where(eq(posts.id, post.id));
    await saveLinkedIn({ settings: { lastError: undefined } });
    revalidatePath("/dashboard/blog");
    return urn;
  } catch (e) {
    const msg = describe(e);
    await saveLinkedIn({ settings: { lastError: msg } });
    throw new Error(msg);
  }
}

function titleFrom(text: string) {
  const firstLine = text.split(/\n/).map((l) => l.trim()).find(Boolean) ?? "LinkedIn update";
  return firstLine.length > 90 ? `${firstLine.slice(0, 87).trimEnd()}…` : firstLine;
}

/** Imports new Company Page posts as published news items. Posts that started on this site are skipped. */
export async function importFromLinkedIn() {
  const { settings } = await getLinkedIn();
  const token = await accessToken();
  if (!token || !settings.organization) throw new Error("Connect LinkedIn and choose the ESGCounts page first.");

  try {
    const remote = await listOrganizationPosts(token, settings.organization.urn, 20);
    const known = new Set(
      remote.length
        ? (await db.select({ urn: posts.linkedinUrn }).from(posts).where(inArray(posts.linkedinUrn, remote.map((r) => r.urn)))).map((r) => r.urn)
        : [],
    );
    let imported = 0;
    for (const r of remote) {
      if (known.has(r.urn)) continue;
      // Our own shares link back to esgcounts.eu; don't import them as duplicates.
      if (r.articleUrl?.startsWith(`${SITE_URL}/blog/`)) continue;
      const text = plainFromLittleText(r.commentary).trim();
      if (!text && !r.articleTitle) continue;
      const title = r.articleTitle || titleFrom(text);
      const base = slugify(title) || "linkedin-update";
      const slug = `${base}-${r.urn.split(":").pop()!.slice(-6)}`;
      const content = [text, r.articleUrl ? `[Read more](${r.articleUrl})` : ""].filter(Boolean).join("\n\n");
      const inserted = await db
        .insert(posts)
        .values({
          slug,
          title,
          excerpt: text.replace(/\s+/g, " ").slice(0, 280),
          content,
          published: true,
          publishedAt: r.publishedAt ? new Date(r.publishedAt) : new Date(),
          source: "linkedin",
          linkedinUrn: r.urn,
          linkedinSharedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning({ id: posts.id });
      imported += inserted.length;
    }
    await saveLinkedIn({ settings: { lastImportAt: new Date().toISOString(), lastError: undefined } });
    if (imported) {
      revalidatePath("/blog");
      revalidatePath("/");
      revalidatePath("/dashboard/blog");
    }
    return { checked: remote.length, imported };
  } catch (e) {
    const msg = describe(e);
    await saveLinkedIn({ settings: { lastError: msg } });
    throw new Error(msg);
  }
}
