"use client";

import { useFormStatus } from "react-dom";
import { buttonStyles } from "./ui";

export function SubmitButton({
  children,
  pendingText = "Saving…",
  variant = "primary",
  className,
  pending: pendingProp,
  ...rest
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: keyof typeof buttonStyles;
  /** Pass when the form submits via onSubmit (useActionForm) rather than `action`. */
  pending?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending} className={`${buttonStyles[variant]} ${className ?? ""}`} {...rest}>
      {pending ? pendingText : children}
    </button>
  );
}
