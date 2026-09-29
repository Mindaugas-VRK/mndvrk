import * as z from "zod";

export const PasswordSchema = z
  .string()
  .min(10, { error: "Use at least 10 characters." })
  .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });
