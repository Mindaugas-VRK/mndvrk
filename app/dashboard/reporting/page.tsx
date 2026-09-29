import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status";
import { Card, PageHeader, buttonStyles, tableHead } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getSites, listPeriods, loadSeries } from "@/lib/data";
import { overallCompleteness } from "@/lib/gri/engine";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reporting" };

export default async function ReportingPage() {
  const { user, account } = await requireAccount("data:view");
  const periods = await listPeriods(account.id);
  const series = new Map((await loadSeries(account.id)).map((s) => [s.period.id, s.data]));
  const sites = await getSites(account.id);

  return (
    <>
      <PageHeader
        title="Reporting periods"
        crumbs={[{ label: "Reporting", href: "/dashboard/reporting" }]}
        description="Collect data per site, roll it up, get it prepared, reviewed and approved, then produce the GRI report."
        actions={can(user.role, "periods:create") && <Link href="/dashboard/reporting/new" className={buttonStyles.primary}><Icon.plus className="h-4 w-4" /> New period</Link>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className={tableHead}>
            <tr>
              <th className="px-5 py-3">Period</th>
              <th className="px-5 py-3">Dates</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p, i) => {
              const d = series.get(p.id);
              const c = d ? overallCompleteness(d, sites) : { pct: 0 };
              return (
                <tr key={p.id} className={i % 2 ? "bg-teal-50/40" : ""}>
                  <td className="px-5 py-3"><Link href={`/dashboard/reporting/${p.id}`} className="font-semibold text-ink-500 hover:text-teal-500">{p.title}</Link><span className="block text-xs text-ink-400">{p.framework}</span></td>
                  <td className="px-5 py-3 text-ink-400">{p.startDate} → {p.endDate}</td>
                  <td className="px-5 py-3 text-ink-500">{p.owner ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-500">{c.pct}%</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3 text-ink-400">{formatDate(p.updatedAt)}</td>
                </tr>
              );
            })}
            {periods.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-400">No reporting periods yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
