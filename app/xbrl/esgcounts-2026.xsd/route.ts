import { taxonomySchema } from "@/lib/reporting/taxonomy";

// Public: XBRL processors fetch the schema referenced by Inline XBRL reports.
export function GET() {
  return new Response(taxonomySchema(), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
