"use client";

import { useActionForm } from "@/components/use-action-form";
import { useEffect, useRef } from "react";
import { createAccount, createCustomField, createSite, updateAccount } from "@/app/actions/accounts";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputStyles } from "@/components/ui";

type Opt = { value: string; label: string };

function useResetOnSuccess(success?: string) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (success) ref.current?.reset();
  }, [success]);
  return ref;
}

export function AccountForm({ initial }: { initial?: { id: number; name: string; industry: string; country: string } }) {
  const [state, onSubmit, pending] = useActionForm(initial ? updateAccount : createAccount, undefined);
  const e = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Account name" htmlFor="name" errors={e?.name}>
        <input id="name" name="name" defaultValue={initial?.name} required className={inputStyles} />
      </Field>
      <Field label="Industry" htmlFor="industry">
        <input id="industry" name="industry" defaultValue={initial?.industry} className={inputStyles} placeholder="e.g. Manufacturing" />
      </Field>
      <Field label="Headquarters country" htmlFor="country">
        <input id="country" name="country" defaultValue={initial?.country} className={inputStyles} />
      </Field>
      <div className="flex items-center gap-3 md:col-span-3">
        <SubmitButton pending={pending}>{initial ? "Save account" : "Create account"}</SubmitButton>
        {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
      </div>
    </form>
  );
}

export function SiteForm({ accountId }: { accountId: number }) {
  const [state, onSubmit, pending] = useActionForm(createSite, undefined);
  const ref = useResetOnSuccess(state?.success);
  const e = state?.fieldErrors;
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-3 md:grid-cols-5 md:items-end">
      <input type="hidden" name="accountId" value={accountId} />
      <Field label="Site" htmlFor="site-name" errors={e?.name}><input id="site-name" name="name" required className={inputStyles} placeholder="e.g. Kaunas plant" /></Field>
      <Field label="Region" htmlFor="site-region"><input id="site-region" name="region" className={inputStyles} placeholder="e.g. Baltics" /></Field>
      <Field label="Country" htmlFor="site-country"><input id="site-country" name="country" className={inputStyles} /></Field>
      <Field label="City" htmlFor="site-city"><input id="site-city" name="city" className={inputStyles} /></Field>
      <SubmitButton pending={pending}>Add site</SubmitButton>
      {state?.success && <p className="text-sm text-lime-800 md:col-span-5">✓ {state.success}</p>}
    </form>
  );
}

export function CustomFieldForm({ accountId, groups, dimensions }: { accountId: number; groups: Opt[]; dimensions: Opt[] }) {
  const [state, onSubmit, pending] = useActionForm(createCustomField, undefined);
  const ref = useResetOnSuccess(state?.success);
  const e = state?.fieldErrors;
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="accountId" value={accountId} />
      <Field label="Label" htmlFor="cf-label" errors={e?.label}><input id="cf-label" name="label" required className={inputStyles} placeholder="e.g. Solar panels installed capacity" /></Field>
      <Field label="KPI group" htmlFor="cf-group" errors={e?.groupKey}>
        <select id="cf-group" name="groupKey" className={inputStyles}>{groups.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</select>
      </Field>
      <Field label="Unit type" htmlFor="cf-dim" errors={e?.dimension}>
        <select id="cf-dim" name="dimension" className={inputStyles}>{dimensions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
      </Field>
      <Field label="Collected" htmlFor="cf-level">
        <select id="cf-level" name="siteLevel" className={inputStyles}>
          <option value="site">Per site (rolls up)</option>
          <option value="account">Once per account</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field label="Description" htmlFor="cf-desc"><input id="cf-desc" name="description" className={inputStyles} /></Field>
      </div>
      <div className="flex items-center gap-3 md:col-span-2">
        <SubmitButton pending={pending}>Add custom KPI</SubmitButton>
        {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
        {state?.error && <Alert tone="error">{state.error}</Alert>}
      </div>
    </form>
  );
}
