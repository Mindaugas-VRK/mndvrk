import Link from "next/link";
import { formatDate } from "@/lib/utils";

export function PostCard({
  post,
}: {
  post: { slug: string; title: string; excerpt: string; publishedAt: Date | null; author: string | null };
}) {
  return (
    <article className="group flex flex-col rounded-xl border border-teal-100 bg-white p-6 shadow-sm transition hover:border-lime-400 hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-lime-700">
        {formatDate(post.publishedAt)}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-ink-500 group-hover:text-teal-500">
        <Link href={`/blog/${post.slug}`}>
          <span className="absolute inset-0 hidden" />
          {post.title}
        </Link>
      </h3>
      {post.excerpt && <p className="mt-2 flex-1 text-sm leading-6 text-ink-400">{post.excerpt}</p>}
      <Link href={`/blog/${post.slug}`} className="mt-4 text-sm font-medium text-teal-500">
        Read more →
      </Link>
    </article>
  );
}
