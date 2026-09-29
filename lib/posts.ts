import { and, desc, eq } from "drizzle-orm";
import { db, first } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";

export async function getPublishedPosts(limit?: number) {
  const q = db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      publishedAt: posts.publishedAt,
      author: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt));
  return limit ? await q.limit(limit) : await q;
}

export async function getPublishedPost(slug: string) {
  return await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      source: posts.source,
      linkedinUrn: posts.linkedinUrn,
      author: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, slug), eq(posts.published, true)))
    .then(first);
}
