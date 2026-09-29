"use client";

import { useActionForm } from "@/components/use-action-form";
import { useRef, useEffect } from "react";
import { createUser, resetUserPassword } from "@/app/actions/users";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputStyles } from "@/components/ui";
import { ROLES } from "@/lib/db/schema";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions";

export function CreateUserForm({ accounts }: { accounts: { id: number; name: string }[] }) {
  const [state, onSubmit, pending] = useActionForm(createUser, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);
  const e = state?.fieldErrors;
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Full name" htmlFor="name" errors={e?.name}>
        <input id="name" name="name" required className={inputStyles} />
      </Field>
      <Field label="Email" htmlFor="new-email" errors={e?.email}>
        <input id="new-email" name="email" type="email" required className={inputStyles} />
      </Field>
      <Field label="Role" htmlFor="role" errors={e?.role}>
        <select id="role" name="role" defaultValue="viewer" className={inputStyles}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}: {ROLE_DESCRIPTIONS[r]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Account" htmlFor="accountId" hint="Admins can open every account; users and viewers see only theirs." errors={e?.accountId}>
        <select id="accountId" name="accountId" defaultValue={accounts[0]?.id ?? ""} className={inputStyles}>
          <option value="">— none (admins only) —</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="Job title" htmlFor="jobTitle" hint="Shown on sign-offs, e.g. Engineer, HR manager, Country manager.">
        <input id="jobTitle" name="jobTitle" className={inputStyles} />
      </Field>
      <Field label="Temporary password" htmlFor="new-password" hint="At least 10 characters with a letter and a number." errors={e?.password}>
        <input id="new-password" name="password" type="text" autoComplete="off" required className={inputStyles} />
      </Field>
      <SubmitButton pending={pending} pendingText="Creating…">Create user</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: number }) {
  const [state, onSubmit, pending] = useActionForm(resetUserPassword, undefined);
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="password" placeholder="New password" aria-label="New password" autoComplete="off" required className={`${inputStyles} w-40 py-1.5`} />
      <SubmitButton pending={pending} variant="secondary" pendingText="…" className="py-1.5">Reset</SubmitButton>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state?.success && <span className="text-xs text-lime-800">{state.success}</span>}
    </form>
  );
}
