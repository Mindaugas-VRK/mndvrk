import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { renderMarkdown } from "@/lib/markdown";
import { getPublishedPost } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  await connection();
  const { slug } = await props.params;
  const post = getPublishedPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: { type: "article", title: post.title, description: post.excerpt || undefined },
  };
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  await connection();
  const { slug } = await props.params;
  const post = getPublishedPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href="/blog" className="text-sm font-semibold text-teal-500 hover:text-teal-600">
        ← All posts
      </Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
        {formatDate(post.publishedAt)}
        {post.author && <> · {post.author}</>}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-500">{post.title}</h1>
      <span className="brand-rule mt-6" />
      {post.excerpt && <p className="mt-6 text-lg leading-8 text-ink-400">{post.excerpt}</p>}
      <div className="prose-post mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
    </article>
  );
}
