"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { db, first } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { slugify } from "@/lib/utils";
import type { ActionState } from "./types";

const PostSchema = z.object({
  title: z.string().trim().min(3, { error: "Title is too short." }).max(200),
  slug: z.string().trim().max(80).optional(),
  excerpt: z.string().trim().max(400).default(""),
  content: z.string().max(100_000).default(""),
  published: z.literal("on").optional(),
});

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/dashboard/blog");
}

export async function savePost(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("blog:manage");
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const parsed = PostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const slug = slugify(parsed.data.slug || parsed.data.title);
  if (!slug) return { fieldErrors: { slug: ["Slug can't be empty."] } };

  const clash = await db
    .select({ id: posts.id })
    .from(posts)
    .where(id ? and(eq(posts.slug, slug), ne(posts.id, id)) : eq(posts.slug, slug))
    .then(first);
  if (clash) return { fieldErrors: { slug: ["Another post already uses this slug."] } };

  const published = parsed.data.published === "on";
  const fields = {
    title: parsed.data.title,
    slug,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    published,
    updatedAt: new Date(),
  };

  let previousSlug: string | undefined;
  if (id) {
    const existing = await db.select().from(posts).where(eq(posts.id, id)).then(first);
    if (!existing) return { error: "Post not found." };
    previousSlug = existing.slug;
    await db.update(posts)
      .set({ ...fields, publishedAt: published ? (existing.publishedAt ?? new Date()) : existing.publishedAt })
      .where(eq(posts.id, id));
  } else {
    await db.insert(posts)
      .values({ ...fields, authorId: user.id, publishedAt: published ? new Date() : null });
  }

  revalidateBlog(slug);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
  redirect("/dashboard/blog");
}

export async function deletePost(formData: FormData) {
  await requireUser("blog:manage");
  const id = Number(formData.get("id"));
  const post = await db.select().from(posts).where(eq(posts.id, id)).then(first);
  await db.delete(posts).where(eq(posts.id, id));
  revalidateBlog(post?.slug);
  redirect("/dashboard/blog");
}
