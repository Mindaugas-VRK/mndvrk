"use client";

import { useActionForm } from "@/components/use-action-form";
import { useState } from "react";
import { saveRisk } from "@/app/actions/risks";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Card, Field, inputStyles, pillInputStyles, tableHead } from "@/components/ui";
import { PROBABILITIES, type Probability, type Risk } from "@/lib/db/schema";
import { IMPACT_LABELS, LEVEL_STYLES, PROBABILITY_LABELS, RISK_LEVELS, riskLevel, riskScore } from "@/lib/gri/risks";
import { TOPICS } from "@/lib/gri/topics";
import { cn } from "@/lib/utils";

type Initial = Partial<Risk>;

export function RiskForm({ initial, readOnly }: { initial: Initial; readOnly: boolean }) {
  const [state, onSubmit, pending] = useActionForm(saveRisk, undefined);
  const [p, setP] = useState<Probability>((initial.probability as Probability) ?? "C");
  const [imp, setImp] = useState<number>(initial.impact ?? 3);
  const score = riskScore(p, imp);
  const lvl = riskLevel(score);
  const e = state?.fieldErrors;

  const hazard = (name: keyof Risk, label: string) => (
    <div className="grid items-center gap-2 sm:grid-cols-[120px_1fr]">
      <label htmlFor={name} className="text-sm font-medium text-ink-500 sm:text-right">{label}</label>
      <input id={name} name={name} defaultValue={(initial[name] as string) ?? ""} placeholder="Type in" readOnly={readOnly} className={pillInputStyles} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state?.error && <Alert tone="error">{state.error}</Alert>}

      <Card className="grid gap-4 p-6 md:grid-cols-[1fr_280px_auto] md:items-end">
        <Field label="Risk" htmlFor="title" errors={e?.title}>
          <input id="title" name="title" defaultValue={initial.title ?? ""} required readOnly={readOnly} className={inputStyles} placeholder="e.g. Water scarcity at production sites" />
        </Field>
        <Field label="Links to material topic" htmlFor="topicKey">
          <select id="topicKey" name="topicKey" defaultValue={initial.topicKey ?? ""} disabled={readOnly} className={inputStyles}>
            <option value="">—</option>
            {TOPICS.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}
          </select>
        </Field>
        <div className={cn("rounded-xl px-5 py-2.5 text-center font-display text-lg font-bold", LEVEL_STYLES[lvl].cell)} aria-live="polite">
          {RISK_LEVELS[lvl].label} - {score}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-bold text-teal-500">Hazard identification</h2>
          <div className="space-y-3">
            {hazard("physical", "Physical")}
            {hazard("regulatory", "Regulatory")}
            {hazard("reputational", "Reputational")}
            {hazard("financial", "Financial")}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-bold text-teal-500">Analysis probability and impact</h2>
          <div className="overflow-hidden rounded-xl">
            <table className="w-full table-fixed text-sm">
              <thead className={tableHead}>
                <tr><th className="w-24 px-4 py-3" /><th className="w-[40%] px-4 py-3">Rating</th><th className="px-4 py-3">Rationale</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-medium text-ink-500">Probability</td>
                  <td className="px-4 py-3">
                    <select name="probability" aria-label="Probability" value={p} onChange={(ev) => setP(ev.target.value as Probability)} disabled={readOnly} className={inputStyles}>
                      {PROBABILITIES.map((x) => <option key={x} value={x}>{x}. {PROBABILITY_LABELS[x]}</option>)}
                    </select>
                    {readOnly && <input type="hidden" name="probability" value={p} />}
                  </td>
                  <td className="px-4 py-3"><textarea name="probabilityRationale" aria-label="Probability rationale" rows={2} defaultValue={initial.probabilityRationale ?? ""} readOnly={readOnly} className={inputStyles} /></td>
                </tr>
                <tr className="bg-teal-50/50">
                  <td className="px-4 py-3 font-medium text-ink-500">Impact</td>
                  <td className="px-4 py-3">
                    <select name="impact" aria-label="Impact" value={imp} onChange={(ev) => setImp(Number(ev.target.value))} disabled={readOnly} className={inputStyles}>
                      {[1, 2, 3, 4, 5].map((x) => <option key={x} value={x}>{x}. {IMPACT_LABELS[x]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><textarea name="impactRationale" aria-label="Impact rationale" rows={2} defaultValue={initial.impactRationale ?? ""} readOnly={readOnly} className={inputStyles} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-teal-500">Mitigation</h2>
          <textarea name="mitigation" aria-label="Mitigation" rows={5} defaultValue={initial.mitigation ?? ""} readOnly={readOnly} className={inputStyles} placeholder="Actions, owners and deadlines" />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-teal-500">Monitoring and review</h2>
          <textarea name="monitoring" aria-label="Monitoring and review" rows={5} defaultValue={initial.monitoring ?? ""} readOnly={readOnly} className={inputStyles} placeholder="How and how often the risk is monitored; which KPIs track it" />
        </Card>
      </div>

      {!readOnly && (
        <div className="flex items-center gap-3">
          <SubmitButton pending={pending}>{initial.id ? "Save risk" : "Create risk"}</SubmitButton>
          {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
        </div>
      )}
    </form>
  );
}
