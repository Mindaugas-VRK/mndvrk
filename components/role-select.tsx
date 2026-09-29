"use client";

import { ROLES, type Role } from "@/lib/db/schema";
import { ROLE_LABELS } from "@/lib/permissions";
import { inputStyles } from "./ui";

/** Role dropdown that submits its surrounding form on change. */
export function RoleSelect({ value, disabled }: { value: Role; disabled?: boolean }) {
  return (
    <select
      name="role"
      defaultValue={value}
      disabled={disabled}
      aria-label="Role"
      className={`${inputStyles} w-32 py-1.5`}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </select>
  );
}

/** Account dropdown that submits its surrounding form on change. */
export function AccountSelect({ value, accounts }: { value: number | null; accounts: { id: number; name: string }[] }) {
  return (
    <select
      name="accountId"
      defaultValue={value ?? ""}
      aria-label="Account"
      className={`${inputStyles} w-44 py-1.5`}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      <option value="">— none —</option>
      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  );
}
