"use client";

import { useActionForm } from "@/components/use-action-form";

import { changePassword } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputStyles } from "@/components/ui";

export function ChangePasswordForm() {
  const [state, onSubmit, pending] = useActionForm(changePassword, undefined);
  const e = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <Field label="Current password" htmlFor="current" errors={e?.current}>
        <input id="current" name="current" type="password" autoComplete="current-password" required className={inputStyles} />
      </Field>
      <Field label="New password" htmlFor="password" hint="At least 10 characters with a letter and a number." errors={e?.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" required className={inputStyles} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm" errors={e?.confirm}>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={inputStyles} />
      </Field>
      <SubmitButton pending={pending}>Update password</SubmitButton>
    </form>
  );
}
