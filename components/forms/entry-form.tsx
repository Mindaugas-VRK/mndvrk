"use client";

import { useActionForm } from "@/components/use-action-form";

import { saveEntries } from "@/app/actions/periods";
import { SubmitButton } from "@/components/submit-button";
import { Alert, inputStyles } from "@/components/ui";
import { cn } from "@/lib/utils";

export type EntryRow =
  | { type: "heading"; code: string; title: string }
  | {
      type: "input";
      key: string;
      code?: string;
      label: string;
      hint?: string;
      indent?: number;
      units: { key: string; label: string }[];
      value: string;
      unit: string;
      reference: string;
      comment: string;
    }
  | { type: "computed"; key: string; code?: string; label: string; indent?: number; formula: string; display: string }
  | { type: "text"; key: string; code?: string; label: string; hint?: string; multiline: boolean; value: string; comment: string }
  | { type: "choice"; key: string; code?: string; label: string; options: string[]; selected: string[]; comment: string };

export function EntryForm({
  periodId,
  group,
  siteId,
  rows,
  locked,
}: {
  periodId: number;
  group: string;
  siteId: number;
  rows: EntryRow[];
  locked: boolean;
}) {
  const [state, onSubmit, pending] = useActionForm(saveEntries, undefined);
  const errs = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} key={`${group}:${siteId}`}>
      <input type="hidden" name="periodId" value={periodId} />
      <input type="hidden" name="group" value={group} />
      <input type="hidden" name="siteId" value={siteId} />
      {state?.error && <div className="mb-4"><Alert tone="error">{state.error}</Alert></div>}
      <fieldset disabled={locked} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(40,55,57,0.06)]">
        <div className="divide-y divide-teal-50">
          {rows.map((r, i) => {
            if (r.type === "heading") {
              return (
                <div key={`h${i}`} className="bg-cream px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-teal-500">
                  {r.code} · {r.title}
                </div>
              );
            }
            const labelCell = (
              <label htmlFor={`f-${r.key}`} className="block" style={{ paddingLeft: `${("indent" in r && r.indent ? r.indent : 0) * 1.25}rem` }}>
                <span className={cn("text-sm", r.type === "computed" ? "font-semibold text-ink-500" : "text-ink-500")}>{r.label}</span>
                {r.code && <span className="ml-2 text-[11px] text-stone">{r.code}</span>}
                {"hint" in r && r.hint && <span className="block text-xs text-ink-400">{r.hint}</span>}
              </label>
            );
            if (r.type === "computed") {
              return (
                <div key={r.key} className="grid gap-3 bg-lime-50/60 px-6 py-3 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-5">{labelCell}</div>
                  <div className="md:col-span-3 text-right font-display font-bold text-ink-500" id={`f-${r.key}`}>{r.display}</div>
                  <div className="md:col-span-4 text-xs text-ink-400"><span className="mr-1 rounded bg-lime-100 px-1.5 py-0.5 font-semibold text-lime-800">Σ rollup</span>{r.formula}</div>
                </div>
              );
            }
            if (r.type === "input") {
              const err = errs?.[`value:${r.key}`];
              return (
                <div key={r.key} className="grid gap-3 px-6 py-3 md:grid-cols-12 md:items-start">
                  <div className="md:col-span-5">{labelCell}</div>
                  <div className="md:col-span-3">
                    <div className="flex">
                      <input
                        id={`f-${r.key}`}
                        name={`value:${r.key}`}
                        inputMode="decimal"
                        defaultValue={r.value}
                        placeholder="—"
                        aria-invalid={!!err}
                        className={cn(inputStyles, r.units.length > 1 || r.units[0]?.label ? "rounded-r-none" : "", "text-right", err && "border-red-400")}
                      />
                      {r.units.length > 1 ? (
                        <select name={`unit:${r.key}`} defaultValue={r.unit} aria-label={`${r.label} unit`} className="rounded-r-lg border border-l-0 border-teal-100 bg-cream px-2 text-xs text-ink-500">
                          {r.units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
                        </select>
                      ) : r.units[0]?.label && r.units[0].label !== "number" ? (
                        <>
                          <input type="hidden" name={`unit:${r.key}`} value={r.units[0].key} />
                          <span className="inline-flex items-center rounded-r-lg border border-l-0 border-teal-100 bg-cream px-3 text-xs text-ink-400">{r.units[0].label}</span>
                        </>
                      ) : (
                        <input type="hidden" name={`unit:${r.key}`} value={r.units[0]?.key ?? ""} />
                      )}
                    </div>
                    {err?.map((e) => <p key={e} className="mt-1 text-xs text-red-600">{e}</p>)}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 md:col-span-4">
                    <input name={`ref:${r.key}`} defaultValue={r.reference} placeholder="Meter no. / source" aria-label={`${r.label} reference`} className={inputStyles} />
                    <input name={`comment:${r.key}`} defaultValue={r.comment} placeholder="Comment" aria-label={`${r.label} comment`} className={inputStyles} />
                  </div>
                </div>
              );
            }
            if (r.type === "choice") {
              return (
                <div key={r.key} className="grid gap-3 px-6 py-3 md:grid-cols-12">
                  <div className="md:col-span-5">{labelCell}</div>
                  <div className="flex flex-wrap gap-2 md:col-span-7" id={`f-${r.key}`}>
                    {r.options.map((o) => (
                      <label key={o} className="flex items-center gap-1.5 rounded-full bg-smoke px-3 py-1 text-sm text-ink-500">
                        <input type="checkbox" name={`choice:${r.key}`} value={o} defaultChecked={r.selected.includes(o)} className="accent-teal-500" /> {o}
                      </label>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <div key={r.key} className="grid gap-3 px-6 py-3 md:grid-cols-12">
                <div className="md:col-span-5">{labelCell}</div>
                <div className="md:col-span-7">
                  {r.multiline ? (
                    <textarea id={`f-${r.key}`} name={`text:${r.key}`} rows={3} defaultValue={r.value} className={inputStyles} />
                  ) : (
                    <input id={`f-${r.key}`} name={`text:${r.key}`} defaultValue={r.value} className={inputStyles} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>
      {!locked && (
        <div className="sticky bottom-0 z-10 mt-4 flex items-center gap-4 rounded-2xl bg-white/95 px-6 py-4 shadow-[0_-2px_12px_rgba(40,55,57,0.08)] backdrop-blur">
          <SubmitButton pending={pending} pendingText="Saving…">Save</SubmitButton>
          {state?.success && <span className="text-sm font-medium text-lime-800">✓ {state.success}</span>}
          <span className="ml-auto hidden text-xs text-ink-400 sm:block">Energy, water and waste can be entered in any unit; totals are converted automatically.</span>
        </div>
      )}
    </form>
  );
}
