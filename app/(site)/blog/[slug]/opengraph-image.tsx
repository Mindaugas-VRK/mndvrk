import { brandedCard, OG_SIZE } from "@/lib/og";
import { getPublishedPost } from "@/lib/posts";

export const alt = "ESGCounts news";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  const excerpt = post?.excerpt ? (post.excerpt.length > 140 ? `${post.excerpt.slice(0, 137)}…` : post.excerpt) : undefined;
  return brandedCard({ eyebrow: "News", title: post?.title ?? "ESGCounts", subtitle: excerpt });
}
