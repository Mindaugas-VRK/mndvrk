"use client";

import { useActionForm } from "@/components/use-action-form";

import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputStyles } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, onSubmit, pending] = useActionForm(login, undefined);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" required className={inputStyles} />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputStyles} />
      </Field>
      <SubmitButton pending={pending} pendingText="Signing in…" className="w-full py-2.5">
        Sign in
      </SubmitButton>
    </form>
  );
}
