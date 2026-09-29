import "server-only";
import type { Account } from "@/lib/db/schema";
import { getActivity, getCustomFields, getPeriod, getSignoffs, getSites, getTopicStates, loadPeriodData } from "@/lib/data";
import { TOPICS } from "@/lib/gri/topics";

/** Everything an exported report needs for one reporting period. */
export async function loadReport(account: Account, periodId: number) {
  const period = await getPeriod(periodId, account.id);
  if (!period) return null;
  const [sites, custom, data, signoffs, activity, topicStates] = await Promise.all([
    getSites(account.id),
    getCustomFields(account.id),
    loadPeriodData(period.id, account.id),
    getSignoffs(account.id, `period:${period.id}`),
    getActivity(account.id, `period:${period.id}`, 500),
    getTopicStates(account.id),
  ]);
  const materialTopics = TOPICS.filter((t) => topicStates.get(t.key)?.isMaterial ?? true);
  return { account, period, sites, custom, data, signoffs, activity, materialTopics };
}

export type ReportData = NonNullable<Awaited<ReturnType<typeof loadReport>>>;

export function reportFileName(r: Pick<ReportData, "account" | "period">, ext: string) {
  const slug = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `esgcounts-${slug(r.account.name)}-${slug(r.period.title)}.${ext}`;
}
