import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export function audit(params: {
  userId: number;
  accountId: number | null;
  action: string;
  entity: string;
  detail?: string;
}) {
  db.insert(auditLog)
    .values({
      userId: params.userId,
      accountId: params.accountId,
      action: params.action,
      entity: params.entity,
      detail: params.detail ?? "",
    })
    .run();
}
