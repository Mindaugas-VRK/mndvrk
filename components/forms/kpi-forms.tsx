"use client";

import { useActionForm } from "@/components/use-action-form";

import { saveProcedure, saveTarget } from "@/app/actions/kpis";
import { SubmitButton } from "@/components/submit-button";
import { inputStyles } from "@/components/ui";

export function ProcedureForm({ group, procedure }: { group: string; procedure: string }) {
  const [state, onSubmit, pending] = useActionForm(saveProcedure, undefined);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="group" value={group} />
      <textarea name="procedure" aria-label="Procedure" rows={8} defaultValue={procedure} className={`${inputStyles} font-mono text-[13px] leading-6`} placeholder="How this KPI is collected: data owners, sources, meters, conversion factors, frequency, controls…" />
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending} variant="secondary">Save procedure</SubmitButton>
        {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
      </div>
    </form>
  );
}

export function TargetForm({ group, fieldKey, year, value, unit }: { group: string; fieldKey: string; year: number; value?: number; unit: string }) {
  const [state, onSubmit, pending] = useActionForm(saveTarget, undefined);
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="group" value={group} />
      <input type="hidden" name="fieldKey" value={fieldKey} />
      <input name="year" type="number" aria-label="Target year" defaultValue={year} className={`${inputStyles} w-24 py-1.5`} />
      <input name="value" inputMode="decimal" aria-label="Target value" defaultValue={value ?? ""} placeholder="Target" className={`${inputStyles} w-32 py-1.5 text-right`} />
      <span className="text-xs text-ink-400">{unit}</span>
      <SubmitButton pending={pending} variant="secondary" pendingText="…" className="py-1.5">Set</SubmitButton>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state?.success && <span className="text-xs text-lime-800">✓</span>}
    </form>
  );
}
