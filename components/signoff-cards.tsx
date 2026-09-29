import { reopen, signOff } from "@/app/actions/signoff";
import { SubmitButton } from "@/components/submit-button";
import type { SignoffStage } from "@/lib/db/schema";
import type { Signoff } from "@/lib/data";
import { can } from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth/dal";
import { formatDate } from "@/lib/utils";

const STAGES: { stage: SignoffStage; label: string; action: string; cap: "signoff:prepare" | "signoff:review" | "signoff:approve" }[] = [
  { stage: "prepared", label: "Prepared", action: "Mark as prepared", cap: "signoff:prepare" },
  { stage: "reviewed", label: "Reviewed", action: "Mark as reviewed", cap: "signoff:review" },
  { stage: "approved", label: "Approved", action: "Approve", cap: "signoff:approve" },
];

/** The Prepared / Reviewed / Approved strip shown at the bottom of wireframe pages. */
export function SignoffCards({
  subject,
  signoffs,
  user,
  path,
  readOnly,
}: {
  subject: string;
  signoffs: Partial<Record<SignoffStage, Signoff>>;
  user: CurrentUser;
  path: string;
  readOnly?: boolean;
}) {
  const next = STAGES.find((s) => !signoffs[s.stage]);
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {STAGES.map((s) => {
          const done = signoffs[s.stage];
          const isNext = next?.stage === s.stage;
          return (
            <div key={s.stage} className="rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(40,55,57,0.06)]">
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>{s.label}:</span>
                {done && <span>{formatDate(done.at)}</span>}
              </div>
              {done ? (
                <>
                  <p className="mt-1 font-display text-lg font-bold text-ink-500">{done.name ?? "Former user"}</p>
                  {done.jobTitle && <p className="text-xs text-ink-400">{done.jobTitle}</p>}
                </>
              ) : isNext && !readOnly && can(user.role, s.cap) ? (
                <form action={signOff} className="mt-2">
                  <input type="hidden" name="subject" value={subject} />
                  <input type="hidden" name="stage" value={s.stage} />
                  <input type="hidden" name="path" value={path} />
                  <SubmitButton pendingText="…" className="px-3 py-1.5">{s.action}</SubmitButton>
                </form>
              ) : (
                <p className="mt-1 text-sm text-stone">{isNext ? (s.stage === "approved" ? "Awaiting admin approval" : "Pending") : "—"}</p>
              )}
            </div>
          );
        })}
      </div>
      {signoffs.prepared && can(user.role, "signoff:reopen") && (
        <form action={reopen} className="mt-3 text-right">
          <input type="hidden" name="subject" value={subject} />
          <input type="hidden" name="path" value={path} />
          <button type="submit" className="text-xs font-semibold text-ink-400 hover:text-red-600">Reopen (clear sign-offs)</button>
        </form>
      )}
    </div>
  );
}
