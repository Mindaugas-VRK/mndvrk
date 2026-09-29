import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublishedPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const pages = ["", "/features", "/about", "/blog", "/contact", "/privacy"].map((p) => ({
    url: `${SITE_URL}${p}`,
  }));
  const posts = (await getPublishedPosts()).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.publishedAt ?? undefined,
  }));
  return [...pages, ...posts];
}
