import type { PeriodStatus, Role } from "@/lib/db/schema";
import { ROLE_LABELS } from "@/lib/permissions";
import { Badge } from "./ui";

const STATUS: Record<PeriodStatus, { label: string; tone: "slate" | "amber" | "blue" | "green" }> = {
  draft: { label: "Draft", tone: "slate" },
  in_review: { label: "Prepared · in review", tone: "amber" },
  reviewed: { label: "Reviewed · awaiting approval", tone: "blue" },
  approved: { label: "Approved", tone: "green" },
};

export function StatusBadge({ status }: { status: PeriodStatus }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}

const ROLE_TONE = { admin: "purple", user: "blue", viewer: "slate" } as const;

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={ROLE_TONE[role]}>{ROLE_LABELS[role]}</Badge>;
}
