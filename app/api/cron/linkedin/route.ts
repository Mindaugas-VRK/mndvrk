import { importFromLinkedIn } from "@/lib/linkedin/sync";
import { getLinkedIn } from "@/lib/linkedin/store";

/**
 * Daily import of Company Page posts (scheduled in vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { connected, settings } = await getLinkedIn();
  if (!connected || !settings.autoImport || !settings.organization) {
    return Response.json({ skipped: true, reason: "LinkedIn import is not enabled" });
  }
  try {
    return Response.json(await importFromLinkedIn());
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
