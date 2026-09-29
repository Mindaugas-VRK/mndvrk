import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";

export default async function NoAccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="No account yet" />
      <Card className="p-6 text-sm text-ink-400">
        {user.role === "admin" ? (
          <>Create your first account under <Link className="font-semibold text-teal-500" href="/dashboard/settings/accounts">Admin → Accounts</Link>.</>
        ) : (
          <>Your user isn&apos;t linked to an account yet. Ask your ESGCounts administrator to add you to one.</>
        )}
      </Card>
    </>
  );
}
