"use client";

import { importLinkedInNow, saveLinkedInSettings } from "@/app/actions/linkedin";
import { SubmitButton } from "@/components/submit-button";
import { useActionForm } from "@/components/use-action-form";
import { Alert, Field, inputStyles } from "@/components/ui";
import type { Organization } from "@/lib/linkedin/client";

export function LinkedInSettingsForm({
  organizations,
  organization,
  autoPublish,
  autoImport,
}: {
  organizations: Organization[];
  organization?: Organization;
  autoPublish: boolean;
  autoImport: boolean;
}) {
  const [state, onSubmit, pending] = useActionForm(saveLinkedInSettings, undefined);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {organizations.length > 0 ? (
        <Field label="LinkedIn page" htmlFor="organization">
          <select id="organization" name="organization" defaultValue={organization?.urn ?? ""} className={inputStyles}>
            <option value="">— choose —</option>
            {organizations.map((o) => (
              <option key={o.urn} value={o.urn}>{o.name}{o.vanityName ? ` (linkedin.com/company/${o.vanityName})` : ""}</option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn page ID" htmlFor="organization" hint="Numbers from the page admin URL: linkedin.com/company/12345678/admin">
            <input id="organization" name="organization" defaultValue={organization?.id ?? ""} inputMode="numeric" className={inputStyles} />
          </Field>
          <Field label="Page name" htmlFor="organizationName">
            <input id="organizationName" name="organizationName" defaultValue={organization?.name ?? "ESGCounts"} className={inputStyles} />
          </Field>
        </div>
      )}
      <label className="flex items-start gap-3 text-sm text-ink-500">
        <input type="checkbox" name="autoPublish" defaultChecked={autoPublish} className="mt-0.5 h-4 w-4 accent-teal-500" />
        <span><strong>Website → LinkedIn:</strong> when a news post is published on esgcounts.eu, post it on the LinkedIn page with a link back.</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-ink-500">
        <input type="checkbox" name="autoImport" defaultChecked={autoImport} className="mt-0.5 h-4 w-4 accent-teal-500" />
        <span><strong>LinkedIn → website:</strong> once a day, add new LinkedIn page posts to the news on esgcounts.eu.</span>
      </label>
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending}>Save</SubmitButton>
        {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
      </div>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
    </form>
  );
}

export function ImportNowButton() {
  const [state, onSubmit, pending] = useActionForm(async () => importLinkedInNow(), undefined);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <SubmitButton variant="secondary" pending={pending} pendingText="Importing…">Import from LinkedIn now</SubmitButton>
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      {state?.error && <Alert tone="error">{state.error}</Alert>}
    </form>
  );
}
