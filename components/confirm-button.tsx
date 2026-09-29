"use client";

import { buttonStyles } from "./ui";

/** A submit button that asks for confirmation before submitting its form. */
export function ConfirmButton({
  message,
  children,
  variant = "danger",
  className,
}: {
  message: string;
  children: React.ReactNode;
  variant?: keyof typeof buttonStyles;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className ?? buttonStyles[variant]}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
