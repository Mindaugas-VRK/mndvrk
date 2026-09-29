import { getAccountContext } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { loadReport, reportFileName } from "@/lib/reporting/context";
import { buildWorkbook } from "@/lib/reporting/xlsx";

export async function GET(_req: Request, ctx: RouteContext<"/dashboard/reporting/[id]/export/xlsx">) {
  const { user, account } = await getAccountContext();
  if (!account || !can(user.role, "data:export")) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const report = await loadReport(account, Number(id));
  if (!report) return new Response("Not found", { status: 404 });

  const body = await buildWorkbook(report);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${reportFileName(report, "xlsx")}"`,
      "Cache-Control": "no-store",
    },
  });
}
