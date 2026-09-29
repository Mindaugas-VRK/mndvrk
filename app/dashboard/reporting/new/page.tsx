import type { Metadata } from "next";
import { PeriodForm } from "@/components/forms/period-form";
import { Card, PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { accountUsers } from "@/lib/data";

export const metadata: Metadata = { title: "New reporting period" };

export default async function NewPeriodPage() {
  const { account } = await requireAccount("periods:create");
  const y = new Date().getFullYear() - 1;
  return (
    <>
      <PageHeader title="New reporting period" crumbs={[{ label: "Reporting", href: "/dashboard/reporting" }]} />
      <Card className="p-6">
        <PeriodForm
          accountName={account.name}
          owners={accountUsers(account.id).filter((u) => u.role !== "viewer")}
          initial={{ title: `FY ${y}`, startDate: `${y}-01-01`, endDate: `${y}-12-31` }}
        />
      </Card>
    </>
  );
}
