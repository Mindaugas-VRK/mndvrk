"use client";

import { useActionForm } from "@/components/use-action-form";
import { useState } from "react";
import { savePost } from "@/app/actions/blog";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Field, inputStyles } from "@/components/ui";

type Initial = { id?: number; title: string; slug: string; excerpt: string; content: string; published: boolean };

export function PostForm({ initial }: { initial: Initial }) {
  const [state, onSubmit, pending] = useActionForm(savePost, undefined);
  const [content, setContent] = useState(initial.content);
  const e = state?.fieldErrors;
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Title" htmlFor="title" errors={e?.title}>
        <input id="title" name="title" defaultValue={initial.title} required className={inputStyles} />
      </Field>
      <Field label="URL slug" htmlFor="slug" hint="Leave empty to generate from the title. Shown as esgcounts.eu/blog/your-slug" errors={e?.slug}>
        <input id="slug" name="slug" defaultValue={initial.slug} className={inputStyles} />
      </Field>
      <Field label="Excerpt" htmlFor="excerpt" hint="One or two sentences shown in the post list and search results." errors={e?.excerpt}>
        <textarea id="excerpt" name="excerpt" rows={2} defaultValue={initial.excerpt} className={inputStyles} />
      </Field>
      <Field label="Content" htmlFor="content" hint="Markdown: ## Heading, **bold**, *italic*, - lists, [link](https://…)" errors={e?.content}>
        <textarea
          id="content"
          name="content"
          rows={18}
          value={content}
          onChange={(ev) => setContent(ev.target.value)}
          className={`${inputStyles} font-mono text-[13px] leading-6`}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-500">
        <input type="checkbox" name="published" defaultChecked={initial.published} className="h-4 w-4 accent-teal-500" />
        Published (visible on the public blog)
      </label>
      <SubmitButton pending={pending}>Save post</SubmitButton>
    </form>
  );
}
