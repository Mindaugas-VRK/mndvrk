import type { Metadata } from "next";
import { PostForm } from "@/components/forms/post-form";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireUser("blog:manage");
  return (
    <>
      <PageHeader title="New post" />
      <Card className="p-6">
        <PostForm initial={{ title: "", slug: "", excerpt: "", content: "", published: false }} />
      </Card>
    </>
  );
}
