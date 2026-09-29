import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { Badge, Card, PageHeader, buttonStyles } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogAdminPage() {
  await requireUser("blog:manage");
  const rows = db.select().from(posts).orderBy(desc(posts.updatedAt)).all();

  return (
    <>
      <PageHeader
        title="Blog"
        description="News posts shown on esgcounts.eu/blog."
        actions={<Link href="/dashboard/blog/new" className={buttonStyles.primary}>New post</Link>}
      />
      <Card>
        <ul className="divide-y divide-teal-50">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div>
                <Link href={`/dashboard/blog/${p.id}`} className="font-medium text-ink-500 hover:text-teal-500">{p.title}</Link>
                <p className="text-xs text-ink-400">/blog/{p.slug} · updated {formatDate(p.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
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
