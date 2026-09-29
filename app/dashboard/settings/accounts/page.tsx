import type { Metadata } from "next";
import Link from "next/link";
import { AccountForm } from "@/components/forms/account-forms";
import { Card, PageHeader, tableHead } from "@/components/ui";
import { requireUser, accessibleAccounts } from "@/lib/auth/dal";
import { getSites } from "@/lib/data";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const user = await requireUser("accounts:manage");
  const list = await accessibleAccounts(user);
  const siteCounts = new Map(await Promise.all(list.map(async (a) => [a.id, (await getSites(a.id, true)).length] as const)));
  return (
    <>
      <PageHeader title="Accounts" crumbs={[{ label: "Admin" }]} description="Client organisations that report through ESGCounts, with their sites and custom KPIs." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={tableHead}>
            <tr><th className="px-5 py-3">Account</th><th className="px-5 py-3">Industry</th><th className="px-5 py-3">Country</th><th className="px-5 py-3">Sites</th></tr>
          </thead>
          <tbody>
            {list.map((a, i) => (
              <tr key={a.id} className={i % 2 ? "bg-teal-50/40" : ""}>
                <td className="px-5 py-3"><Link href={`/dashboard/settings/accounts/${a.id}`} className="font-semibold text-ink-500 hover:text-teal-500">{a.name}</Link></td>
                <td className="px-5 py-3 text-ink-400">{a.industry || "—"}</td>
                <td className="px-5 py-3 text-ink-400">{a.country || "—"}</td>
                <td className="px-5 py-3 text-ink-500">{siteCounts.get(a.id) ?? 0}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-400">No accounts yet.</td></tr>}
          </tbody>
        </table>
      </Card>
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-lg font-bold text-teal-500">New account</h2>
        <AccountForm />
      </Card>
    </>
  );
}
