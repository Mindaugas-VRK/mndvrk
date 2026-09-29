import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { Alert, Badge, Card, PageHeader, buttonStyles } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { postUrl } from "@/lib/linkedin/client";
import { getLinkedIn } from "@/lib/linkedin/store";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogAdminPage(props: PageProps<"/dashboard/blog">) {
  await requireUser("blog:manage");
  const { linkedin: flash } = await props.searchParams;
  const [rows, li] = await Promise.all([db.select().from(posts).orderBy(desc(posts.updatedAt)), getLinkedIn()]);

  return (
    <>
      <PageHeader
        title="Blog"
        description="News posts shown on esgcounts.eu/blog."
        actions={
          <>
            <Link href="/dashboard/settings/linkedin" className={buttonStyles.secondary}>
              LinkedIn {li.connected && li.settings.organization ? "· connected" : "· set up"}
            </Link>
            <Link href="/dashboard/blog/new" className={buttonStyles.primary}>New post</Link>
          </>
        }
      />
      {flash === "shared" && <div className="mb-4"><Alert tone="success">Published on the site and shared on the LinkedIn page.</Alert></div>}
      {flash === "failed" && (
        <div className="mb-4">
          <Alert tone="error">
            Published on the site, but sharing to LinkedIn failed: {li.settings.lastError ?? "unknown error"}. Open the post to retry.
          </Alert>
        </div>
      )}
      <Card>
        <ul className="divide-y divide-teal-50">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <Link href={`/dashboard/blog/${p.id}`} className="font-medium text-ink-500 hover:text-teal-500">{p.title}</Link>
                <p className="text-xs text-ink-400">/blog/{p.slug} · updated {formatDate(p.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                {p.source === "linkedin" ? (
                  <Badge tone="blue">From LinkedIn</Badge>
                ) : p.linkedinUrn ? (
                  <a href={postUrl(p.linkedinUrn)} target="_blank" rel="noopener noreferrer"><Badge tone="blue">On LinkedIn ↗</Badge></a>
                ) : null}
                <Badge tone={p.published ? "green" : "slate"}>{p.published ? "Published" : "Draft"}</Badge>
                {p.published && (
                  <Link href={`/blog/${p.slug}`} target="_blank" className="text-xs font-semibold text-teal-500">View ↗</Link>
                )}
              </div>
            </li>
          ))}
          {rows.length === 0 && <li className="px-6 py-10 text-center text-sm text-ink-400">No posts yet.</li>}
        </ul>
      </Card>
    </>
  );
}
