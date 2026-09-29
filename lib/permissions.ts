import type { Role } from "@/lib/db/schema";

/**
 * Role capabilities:
 * - viewer: read dashboards, KPIs, materiality, risks and reports; export data
 * - user:   also enter data, edit materiality/risks/procedures, prepare and review
 * - admin:  everything, plus approving, reopening, accounts, users and the blog
 */
const CAPABILITIES = {
  "data:view": ["admin", "user", "viewer"],
  "data:export": ["admin", "user", "viewer"],
  "data:edit": ["admin", "user"],
  "periods:create": ["admin", "user"],
  "periods:delete": ["admin"],
  "signoff:prepare": ["admin", "user"],
  "signoff:review": ["admin", "user"],
  "signoff:approve": ["admin"],
  "signoff:reopen": ["admin"],
  "accounts:manage": ["admin"],
  "users:manage": ["admin"],
  "blog:manage": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: Role | undefined, capability: Capability) {
  if (!role) return false;
  return (CAPABILITIES[capability] as readonly Role[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  user: "User",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Full access to every account: approve, manage accounts, users and the blog",
  user: "Enter data, maintain materiality and risks, prepare and review",
  viewer: "Read-only access to dashboards, KPIs and reports",
};
