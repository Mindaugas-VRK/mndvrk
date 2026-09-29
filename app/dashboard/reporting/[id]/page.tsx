import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePeriod } from "@/app/actions/periods";
import { Meter } from "@/components/charts";
import { ConfirmButton } from "@/components/confirm-button";
import { PeriodForm } from "@/components/forms/period-form";
import { Icon } from "@/components/icons";
import { SignoffCards } from "@/components/signoff-cards";
import { StatusBadge } from "@/components/status";
import { Alert, Card, CardHeader, PageHeader, buttonStyles } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { accountUsers, getActivity, getCustomFields, getPeriod, getSignoffs, getSites, loadPeriodData } from "@/lib/data";
import { KPI_GROUPS, PILLARS } from "@/lib/gri/catalog";
import { completeness, overallCompleteness } from "@/lib/gri/engine";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Reporting period" };

export default async function PeriodPage(props: PageProps<"/dashboard/reporting/[id]">) {
  const { user, account } = await requireAccount("data:view");
  const { id } = await props.params;
  const period = await getPeriod(Number(id), account.id);
  if (!period) notFound();
  const sites = await getSites(account.id);
  const custom = await getCustomFields(account.id);
  const data = await loadPeriodData(period.id, account.id);
  const overall = overallCompleteness(data, sites, custom);
  const locked = period.status === "approved";
  const editable = can(user.role, "data:edit") && !locked;
  const activity = await getActivity(account.id, `period:${period.id}`, 15);

  return (
    <>
      <PageHeader
        title={period.title}
        crumbs={[{ label: "Reporting", href: "/dashboard/reporting" }]}
        description={<span className="flex flex-wrap items-center gap-2"><StatusBadge status={period.status} /> {period.startDate} → {period.endDate} · owner {period.owner ?? "—"} · {overall.pct}% complete</span>}
        actions={
          <>
            <Link href={`/dashboard/reporting/${period.id}/results`} className={buttonStyles.secondary}>Results</Link>
            <Link href={`/dashboard/reporting/${period.id}/report`} className={buttonStyles.secondary}><Icon.doc className="h-4 w-4" /> GRI report</Link>
            <a href={`/dashboard/reporting/${period.id}/export`} className={buttonStyles.secondary}><Icon.download className="h-4 w-4" /> CSV</a>
          </>
        }
      />
      {locked && <div className="mb-6"><Alert tone="success">This period is approved and locked. An admin can reopen it to make changes.</Alert></div>}
      {sites.length === 0 && <div className="mb-6"><Alert tone="info">This account has no sites yet. {can(user.role, "accounts:manage") ? <Link className="font-semibold underline" href={`/dashboard/settings/accounts/${account.id}`}>Add sites</Link> : "Ask an admin to add sites"} to collect site-level data.</Alert></div>}

      <h2 className="mb-4 text-lg font-bold text-teal-500">Collect</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_GROUPS.map((g) => {
          const c = completeness(data, sites, g, custom);
          return (
            <Card key={g.key} className="flex flex-col p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone">{PILLARS[g.pillar].title}</p>
              <h3 className="mt-1 font-bold text-ink-500">{g.title}</h3>
              <p className="text-xs text-ink-400">GRI {g.standards[0].ref}</p>
              <div className="mt-4"><Meter value={c.pct} label="Completeness" detail={`${c.filled}/${c.required}`} /></div>
              <Link href={`/dashboard/reporting/${period.id}/collect/${g.key}`} className={`${editable ? buttonStyles.primary : buttonStyles.secondary} mt-4`}>
                {editable ? "Enter data" : "View data"}
              </Link>
            </Card>
          );
        })}
      </div>

      <h2 className="mt-8 mb-4 text-lg font-bold text-teal-500">Approval workflow</h2>
      <SignoffCards subject={`period:${period.id}`} signoffs={await getSignoffs(account.id, `period:${period.id}`)} user={user} path={`/dashboard/reporting/${period.id}`} />
      <p className="mt-2 text-xs text-ink-400">Prepared by the data owner (e.g. engineer / HR), reviewed by a second person, approved by an admin (e.g. site / country manager). Changing data after sign-off resets the workflow.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Details" />
          <div className="p-6">
            <PeriodForm
              accountName={account.name}
              owners={(await accountUsers(account.id)).filter((u) => u.role !== "viewer")}
              initial={{ id: period.id, title: period.title, startDate: period.startDate, endDate: period.endDate, ownerId: period.ownerId }}
              locked={!editable}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Audit trail" />
          <ol className="max-h-96 space-y-3 overflow-y-auto p-6 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime-500" />
                <div>
                  <p className="text-ink-500"><strong>{a.user ?? "System"}</strong> {a.action}{a.detail ? <span className="text-ink-400"> · {a.detail}</span> : null}</p>
                  <p className="text-xs text-stone">{a.at.toLocaleString("en-GB")}</p>
                </div>
              </li>
            ))}
            {activity.length === 0 && <li className="text-stone">No activity yet.</li>}
          </ol>
        </Card>
      </div>

      {can(user.role, "periods:delete") && (
        <form action={deletePeriod} className="mt-6">
          <input type="hidden" name="id" value={period.id} />
          <ConfirmButton variant="secondary" message={`Delete "${period.title}" and all its data? This cannot be undone.`}>Delete period</ConfirmButton>
        </form>
      )}
    </>
  );
}
