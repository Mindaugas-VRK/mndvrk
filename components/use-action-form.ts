"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Like useActionState, but submits through onSubmit instead of the form's
 * `action` prop. React resets uncontrolled forms after an `action` completes,
 * which would wipe everything the user typed when validation fails.
 */
export function useActionForm<S>(fn: (state: Awaited<S>, formData: FormData) => S | Promise<S>, initial: Awaited<S>) {
  const [state, dispatch, pending] = useActionState<S, FormData>(fn, initial);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(formData));
  };
  return [state, onSubmit, pending] as const;
}
