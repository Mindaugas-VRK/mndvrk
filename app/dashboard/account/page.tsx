import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/forms/account-form";
import { RoleBadge } from "@/components/status";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { ROLE_DESCRIPTIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Account" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <p className="text-lg font-bold text-ink-500">{user.name}</p>
          <p className="text-sm text-ink-400">{user.email}</p>
          <div className="mt-4"><RoleBadge role={user.role} /></div>
          <p className="mt-2 text-sm text-ink-400">{ROLE_DESCRIPTIONS[user.role]}</p>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold text-ink-500">Change password</h2>
          <ChangePasswordForm />
        </Card>
      </div>
    </>
  );
}
