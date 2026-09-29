"use client";

import { linkPostToLinkedIn, sharePostToLinkedIn } from "@/app/actions/linkedin";
import { SubmitButton } from "@/components/submit-button";
import { useActionForm } from "@/components/use-action-form";
import { Alert, buttonStyles, inputStyles } from "@/components/ui";

export function LinkedInPostPanel({
  postId,
  published,
  source,
  linkedinUrn,
  linkedinUrl,
  publicUrl,
  canPublishViaApi,
}: {
  postId: number;
  published: boolean;
  source: "site" | "linkedin";
  linkedinUrn: string | null;
  linkedinUrl: string | null;
  publicUrl: string;
  canPublishViaApi: boolean;
}) {
  const [shareState, onShare, sharing] = useActionForm(sharePostToLinkedIn, undefined);
  const [linkState, onLink, linking] = useActionForm(linkPostToLinkedIn, undefined);
  const shareDialog = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;

  return (
    <div className="space-y-5">
      {linkedinUrn ? (
        <Alert tone="info">
          {source === "linkedin" ? "Imported from" : "Shared on"} LinkedIn ·{" "}
          <a href={linkedinUrl ?? "#"} target="_blank" rel="noopener noreferrer" className="font-semibold underline">open the LinkedIn post ↗</a>
        </Alert>
      ) : !published ? (
        <p className="text-sm text-ink-400">Publish the post first, then share it on LinkedIn.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {canPublishViaApi && (
            <form onSubmit={onShare}>
              <input type="hidden" name="id" value={postId} />
              <SubmitButton pending={sharing} pendingText="Publishing…">Publish to LinkedIn page</SubmitButton>
            </form>
          )}
          <a href={shareDialog} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
            Share on LinkedIn manually ↗
          </a>
          <span className="text-xs text-ink-400">
            Manually: LinkedIn opens with the link preview. Choose to post as the ESGCounts page, then paste the post link below.
          </span>
        </div>
      )}
      {shareState?.error && <Alert tone="error">{shareState.error}</Alert>}
      {shareState?.success && <Alert tone="success">{shareState.success}</Alert>}

      <form onSubmit={onLink} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={postId} />
        <label className="min-w-72 flex-1 text-sm font-medium text-ink-500">
          Linked LinkedIn post
          <input
            name="linkedin"
            defaultValue={linkedinUrl ?? ""}
            placeholder="Paste the post link or embed code from LinkedIn"
            className={`${inputStyles} mt-1.5`}
          />
        </label>
        <SubmitButton variant="secondary" pending={linking}>Save link</SubmitButton>
      </form>
      <p className="-mt-3 text-xs text-ink-400">
        Linking shows the LinkedIn post on the news page and stops the daily import from duplicating it. Clear the field to unlink.
      </p>
      {linkState?.error && <Alert tone="error">{linkState.error}</Alert>}
      {linkState?.success && <Alert tone="success">{linkState.success}</Alert>}
    </div>
  );
}
