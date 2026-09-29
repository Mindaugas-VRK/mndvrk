"use client";

import { useActionForm } from "@/components/use-action-form";

import { saveAssessment } from "@/app/actions/materiality";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputStyles } from "@/components/ui";
import type { AssessmentKey } from "@/lib/gri/assessment";

type Data = Partial<Record<AssessmentKey, string>>;

function Step({ n, title, done, name, readOnly, children }: { n: number; title: string; done?: boolean; name: AssessmentKey; readOnly: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(40,55,57,0.06)]">
      <div className="flex items-center justify-between gap-3 border-l-[6px] border-teal-500 pl-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Step {n}</p>
          <h2 className="text-lg font-bold text-teal-500">{title}</h2>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input type="checkbox" name={name} defaultChecked={done} disabled={readOnly} className="h-4 w-4 accent-lime-600" />
          Done
        </label>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function AssessmentForm({ data, readOnly }: { data: Data; readOnly: boolean }) {
  const [state, onSubmit, pending] = useActionForm(saveAssessment, undefined);
  const area = (name: AssessmentKey, label: string, hint?: string) => (
    <Field label={label} htmlFor={name} hint={hint}>
      <textarea id={name} name={name} rows={4} defaultValue={data[name] ?? ""} readOnly={readOnly} className={inputStyles} />
    </Field>
  );
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Step n={1} title="Desktop research" name="step1Done" done={!!data.step1Done} readOnly={readOnly}>
        {area("existingTopics", "Existing material topics", "What the organisation already reports on, regulatory requirements, prior assessments.")}
        {area("benchmarking", "Benchmarking with peers", "Topics peers in your industry treat as material.")}
      </Step>
      <Step n={2} title="Stakeholder engagement" name="step2Done" done={!!data.step2Done} readOnly={readOnly}>
        {area("internalStakeholders", "Internal stakeholders", "Legal, finance, investor relations, deals, ESG…")}
        {area("externalStakeholders", "External stakeholders", "Government, investors, banks, insurers, media, customers, industry associations, unions, NGOs…")}
        {area("engagementPlan", "Stakeholder engagement plan", "Link or summary of the plan.")}
        {area("meetingMinutes", "Meeting minutes", "Links to or summaries of engagement meetings.")}
      </Step>
      <Step n={3} title="Approval" name="step3Done" done={!!data.step3Done} readOnly={readOnly}>
        {area("committee", "ESG Committee", "Members of the committee that reviews and approves the findings.")}
        {area("approvalNotes", "Committee review and approval of findings")}
      </Step>
      <section className="rounded-2xl bg-pale-lime p-6">
        <h2 className="text-lg font-bold text-teal-500">Regular re-assessment</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Last assessed" htmlFor="lastAssessed">
            <input id="lastAssessed" name="lastAssessed" type="date" defaultValue={data.lastAssessed ?? ""} readOnly={readOnly} className={inputStyles} />
          </Field>
          <Field label="Next assessment due" htmlFor="nextAssessment">
            <input id="nextAssessment" name="nextAssessment" type="date" defaultValue={data.nextAssessment ?? ""} readOnly={readOnly} className={inputStyles} />
          </Field>
        </div>
      </section>
      {!readOnly && (
        <div className="flex items-center gap-3">
          <SubmitButton pending={pending}>Save assessment</SubmitButton>
          {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
        </div>
      )}
    </form>
  );
}
