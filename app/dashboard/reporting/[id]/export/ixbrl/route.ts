import { getAccountContext } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { loadReport, reportFileName } from "@/lib/reporting/context";
import { buildInlineXbrl } from "@/lib/reporting/ixbrl";

export async function GET(req: Request, ctx: RouteContext<"/dashboard/reporting/[id]/export/ixbrl">) {
  const { user, account } = await getAccountContext();
  if (!account || !can(user.role, "data:export")) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const report = await loadReport(account, Number(id));
  if (!report) return new Response("Not found", { status: 404 });

  // ?view opens the report in the browser; otherwise it downloads.
  const inline = new URL(req.url).searchParams.has("view");
  return new Response(buildInlineXbrl(report), {
    headers: {
      "Content-Type": "application/xhtml+xml; charset=utf-8",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${reportFileName(report, "xhtml")}"`,
      "Cache-Control": "no-store",
    },
  });
}
