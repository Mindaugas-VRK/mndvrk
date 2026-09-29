import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deletePost } from "@/app/actions/blog";
import { ConfirmButton } from "@/components/confirm-button";
import { PostForm } from "@/components/forms/post-form";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage(props: PageProps<"/dashboard/blog/[id]">) {
  await requireUser("blog:manage");
  const { id } = await props.params;
  const post = Number.isInteger(Number(id)) ? db.select().from(posts).where(eq(posts.id, Number(id))).get() : undefined;
  if (!post) notFound();

  return (
    <>
      <Link href="/dashboard/blog" className="text-sm font-semibold text-teal-500">← Blog</Link>
      <div className="mt-4"><PageHeader title="Edit post" /></div>
      <Card className="p-6">
        <PostForm initial={post} />
      </Card>
      <Card className="mt-6 border-red-200 p-6">
        <h2 className="font-bold text-ink-500">Delete post</h2>
        <form action={deletePost} className="mt-4">
          <input type="hidden" name="id" value={post.id} />
          <ConfirmButton message={`Delete "${post.title}"?`}>Delete post</ConfirmButton>
        </form>
      </Card>
    </>
  );
}
