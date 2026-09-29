import type { Metadata } from "next";
import { AssessmentForm } from "@/components/forms/assessment-form";
import { SignoffCards } from "@/components/signoff-cards";
import { PageHeader } from "@/components/ui";
import { requireAccount } from "@/lib/auth/dal";
import { getAssessment, getSignoffs } from "@/lib/data";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Materiality assessment" };

export default async function AssessmentPage() {
  const { user, account } = await requireAccount("data:view");
  const a = await getAssessment(account.id);
  return (
    <>
      <PageHeader
        title="Materiality assessment"
        crumbs={[{ label: "Materiality", href: "/dashboard/materiality" }]}
        description="Double materiality in three steps: desktop research, stakeholder engagement and ESG Committee approval, repeated regularly."
      />
      <AssessmentForm data={a?.data ?? {}} readOnly={!can(user.role, "data:edit")} />
      <div className="mt-8">
        <SignoffCards subject="materiality" signoffs={await getSignoffs(account.id, "materiality")} user={user} path="/dashboard/materiality/assessment" />
      </div>
    </>
  );
}
