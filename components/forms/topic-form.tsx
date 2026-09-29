"use client";

import { useActionForm } from "@/components/use-action-form";

import { saveTopic } from "@/app/actions/materiality";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputStyles } from "@/components/ui";

export function TopicForm({ topicKey, isMaterial, content }: { topicKey: string; isMaterial: boolean; content: string }) {
  const [state, onSubmit, pending] = useActionForm(saveTopic, undefined);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="topicKey" value={topicKey} />
      <label className="flex items-center gap-2 text-sm font-medium text-ink-500">
        <input type="checkbox" name="isMaterial" defaultChecked={isMaterial} className="h-4 w-4 accent-teal-500" />
        This topic is material to the organisation
      </label>
      <Field label="Policies and procedures" htmlFor="content" hint="Markdown: ## Heading, **bold**, - lists, [link](https://…)">
        <textarea id="content" name="content" rows={14} defaultValue={content} className={`${inputStyles} font-mono text-[13px] leading-6`} />
      </Field>
      <div className="flex items-center gap-3">
        <SubmitButton pending={pending}>Save topic</SubmitButton>
        {state?.success && <span className="text-sm text-lime-800">✓ {state.success}</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
