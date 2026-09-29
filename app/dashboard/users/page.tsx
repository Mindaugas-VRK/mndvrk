import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { toggleUserActive, updateUserAccount, updateUserRole } from "@/app/actions/users";
import { CreateUserForm, ResetPasswordForm } from "@/components/forms/user-forms";
import { RoleSelect } from "@/components/role-select";
import { Badge, Card, PageHeader, buttonStyles } from "@/components/ui";
import { AccountSelect } from "@/components/role-select";
import { accessibleAccounts, requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { ROLES, users } from "@/lib/db/schema";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireUser("users:manage");
  const rows = db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt, accountId: users.accountId, jobTitle: users.jobTitle })
    .from(users)
    .orderBy(asc(users.name))
    .all();
  const accounts = accessibleAccounts(me).map((a) => ({ id: a.id, name: a.name }));

  return (
    <>
      <PageHeader title="Users" crumbs={[{ label: "Admin" }]} description="Invite people, assign them to an account and control what they can do." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-x-auto xl:col-span-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-teal-500 text-xs text-white">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Account</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50">
              {rows.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-500">{u.name}{self && <span className="text-ink-400"> (you)</span>}</p>
                      <p className="text-xs text-ink-400">{u.email}{u.jobTitle ? ` · ${u.jobTitle}` : ""} · since {formatDate(u.createdAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateUserRole}>
                        <input type="hidden" name="id" value={u.id} />
                        <RoleSelect value={u.role} disabled={self} />
                      </form>
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateUserAccount}>
                        <input type="hidden" name="id" value={u.id} />
                        <AccountSelect value={u.accountId} accounts={accounts} />
                      </form>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Badge tone={u.active ? "green" : "slate"}>{u.active ? "Active" : "Disabled"}</Badge>
                        {!self && (
                          <form action={toggleUserActive}>
                            <input type="hidden" name="id" value={u.id} />
                            <button type="submit" className={`${buttonStyles.ghost} px-2 py-1 text-xs`}>
                              {u.active ? "Disable" : "Enable"}
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">{!self && <ResetPasswordForm id={u.id} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-bold text-ink-500">Add a user</h2>
            <CreateUserForm accounts={accounts} />
          </Card>
          <Card className="p-6">
            <h2 className="font-bold text-ink-500">Roles</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {ROLES.map((r) => (
                <div key={r}>
                  <dt className="font-semibold text-ink-500">{ROLE_LABELS[r]}</dt>
                  <dd className="text-ink-400">{ROLE_DESCRIPTIONS[r]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
