import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteCustomField, toggleSite } from "@/app/actions/accounts";
import { ConfirmButton } from "@/components/confirm-button";
import { AccountForm, CustomFieldForm, SiteForm } from "@/components/forms/account-forms";
import { Badge, Card, PageHeader, buttonStyles, tableHead } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getCustomFields, getSites } from "@/lib/data";
import { GROUP_BY_KEY, KPI_GROUPS } from "@/lib/gri/catalog";
import { DIMENSIONS, type Dimension } from "@/lib/gri/units";

export const metadata: Metadata = { title: "Account settings" };

const DIM_LABELS: Record<Dimension, string> = {
  energy: "Energy (kWh, MWh, GJ…)", water: "Water (litres, m³, ML)", mass: "Mass (kg, t)", air: "Air emissions (g, kg, t)",
  emissions: "GHG (kg / t CO₂e)", count: "Count", hours: "Hours", percent: "Percentage", ratio: "Ratio", rate: "Rate", money: "Money (EUR)", number: "Number",
};

export default async function AccountSettingsPage(props: PageProps<"/dashboard/settings/accounts/[id]">) {
  await requireUser("accounts:manage");
  const { id } = await props.params;
  const account = Number.isInteger(Number(id)) ? db.select().from(accounts).where(eq(accounts.id, Number(id))).get() : undefined;
  if (!account) notFound();
  const sites = getSites(account.id, true);
  const custom = getCustomFields(account.id);

  return (
    <>
      <PageHeader title={account.name} crumbs={[{ label: "Admin" }, { label: "Accounts", href: "/dashboard/settings/accounts" }]} />
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold text-teal-500">Account</h2>
        <AccountForm initial={account} />
      </Card>

      <Card className="mt-6">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-bold text-teal-500">Sites</h2>
          <p className="text-sm text-ink-400">Data is entered per site and rolls up Site → City → Country → Region → Total.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHead}>
              <tr><th className="px-5 py-3">Region</th><th className="px-5 py-3">Country</th><th className="px-5 py-3">City</th><th className="px-5 py-3">Site</th><th className="px-5 py-3">Status</th><th /></tr>
            </thead>
            <tbody>
              {sites.map((s, i) => (
                <tr key={s.id} className={i % 2 ? "bg-teal-50/40" : ""}>
                  <td className="px-5 py-3 text-ink-400">{s.region || "—"}</td>
                  <td className="px-5 py-3 text-ink-400">{s.country || "—"}</td>
                  <td className="px-5 py-3 text-ink-400">{s.city || "—"}</td>
                  <td className="px-5 py-3 font-medium text-ink-500">{s.name}</td>
                  <td className="px-5 py-3"><Badge tone={s.active ? "green" : "slate"}>{s.active ? "Active" : "Inactive"}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <form action={toggleSite}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className={`${buttonStyles.ghost} py-1 text-xs`}>{s.active ? "Deactivate" : "Activate"}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {sites.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-ink-400">No sites yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-teal-50 p-6"><SiteForm accountId={account.id} /></div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-teal-500">Custom KPI fields</h2>
        <p className="mb-4 text-sm text-ink-400">Organisation-specific indicators added on top of the GRI catalogue.</p>
        {custom.length > 0 && (
          <ul className="mb-6 divide-y divide-teal-50 rounded-xl border border-teal-50">
            {custom.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-500">{c.label}</p>
                  <p className="text-xs text-ink-400">{GROUP_BY_KEY.get(c.groupKey)?.title} · {DIM_LABELS[c.dimension as Dimension] ?? c.dimension} · {c.siteLevel ? "per site" : "per account"}</p>
                </div>
                <form action={deleteCustomField}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="accountId" value={account.id} />
                  <ConfirmButton variant="ghost" message={`Delete custom KPI "${c.label}"? Its collected values will no longer be shown.`}>Delete</ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
        <CustomFieldForm
          accountId={account.id}
          groups={KPI_GROUPS.map((g) => ({ value: g.key, label: g.title }))}
          dimensions={(Object.keys(DIMENSIONS) as Dimension[]).filter((d) => d !== "rate").map((d) => ({ value: d, label: DIM_LABELS[d] }))}
        />
      </Card>
    </>
  );
}
