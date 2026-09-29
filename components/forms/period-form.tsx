"use client";

import { useActionForm } from "@/components/use-action-form";

import { createPeriod, updatePeriod } from "@/app/actions/periods";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputStyles } from "@/components/ui";

type Initial = { id?: number; title: string; startDate: string; endDate: string; ownerId?: number | null };

export function PeriodForm({
  initial,
  accountName,
  owners,
  locked,
}: {
  initial: Initial;
  accountName: string;
  owners: { id: number; name: string; jobTitle: string }[];
  locked?: boolean;
}) {
  const [state, onSubmit, pending] = useActionForm(initial.id ? updatePeriod : createPeriod, undefined);
  const e = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <fieldset disabled={locked} className="grid gap-5 md:grid-cols-2">
        <Field label="Account" htmlFor="account">
          <input id="account" value={accountName} readOnly className={`${inputStyles} bg-smoke`} />
        </Field>
        <Field label="Title" htmlFor="title" errors={e?.title}>
          <input id="title" name="title" defaultValue={initial.title} required className={inputStyles} />
        </Field>
        <Field label="Reporting period – start date" htmlFor="startDate" errors={e?.startDate}>
          <input id="startDate" name="startDate" type="date" defaultValue={initial.startDate} required className={inputStyles} />
        </Field>
        <Field label="Reporting period – end date" htmlFor="endDate" errors={e?.endDate}>
          <input id="endDate" name="endDate" type="date" defaultValue={initial.endDate} required className={inputStyles} />
        </Field>
        <Field label="Report owner" htmlFor="ownerId" hint="Responsible for preparing the report.">
          <select id="ownerId" name="ownerId" defaultValue={initial.ownerId ?? ""} className={inputStyles}>
            <option value="">Me</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.name}{o.jobTitle ? ` · ${o.jobTitle}` : ""}</option>)}
          </select>
        </Field>
        <Field label="Framework" htmlFor="framework">
          <input id="framework" value="GRI" readOnly className={`${inputStyles} bg-smoke`} />
        </Field>
      </fieldset>
      {!locked && (
        <div className="flex items-center gap-3">
          <SubmitButton pending={pending}>{initial.id ? "Save details" : "Create reporting period"}</SubmitButton>
          {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
        </div>
      )}
    </form>
  );
}
