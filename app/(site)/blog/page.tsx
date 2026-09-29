import type { Metadata } from "next";
import { connection } from "next/server";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "News and insights on ESG reporting, CSRD and sustainability from the ESGCounts team.",
};

export default async function BlogPage() {
  await connection();
  const posts = await getPublishedPosts();

  return (
    <>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="Blog" title="News & insights">
            Updates on ESGCounts and practical guidance on CSRD, ESRS and sustainability reporting.
          </SectionHeading>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {posts.length === 0 ? (
          <p className="text-ink-400">No posts yet. Check back soon.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
