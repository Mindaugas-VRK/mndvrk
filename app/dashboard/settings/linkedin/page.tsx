import type { Metadata } from "next";
import { disconnectLinkedIn } from "@/app/actions/linkedin";
import { ConfirmButton } from "@/components/confirm-button";
import { ImportNowButton, LinkedInSettingsForm } from "@/components/forms/linkedin-settings";
import { Alert, Badge, Card, PageHeader, buttonStyles } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { linkedInConfig } from "@/lib/linkedin/client";
import { getLinkedIn } from "@/lib/linkedin/store";
import { SITE_URL, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "LinkedIn" };

export default async function LinkedInSettingsPage(props: PageProps<"/dashboard/settings/linkedin">) {
  await requireUser("blog:manage");
  const { error, connected: justConnected } = await props.searchParams;
  const configured = !!linkedInConfig();
  const li = await getLinkedIn();
  const expiresAt = li.tokens?.refreshExpiresAt ?? li.tokens?.expiresAt;

  return (
    <>
      <PageHeader
        title="LinkedIn"
        crumbs={[{ label: "Admin" }, { label: "Blog", href: "/dashboard/blog" }]}
        description="Keep news on esgcounts.eu and the ESGCounts LinkedIn page in sync."
      />
      {error && <div className="mb-4"><Alert tone="error">{error === "not-configured" ? "LinkedIn app credentials are not set yet. Follow the setup steps below." : `LinkedIn: ${error}`}</Alert></div>}
      {justConnected && <div className="mb-4"><Alert tone="success">LinkedIn connected.</Alert></div>}
      {li.settings.lastError && <div className="mb-4"><Alert tone="error">Last LinkedIn error: {li.settings.lastError}</Alert></div>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-teal-500">Automatic sync</h2>
            {li.connected ? <Badge tone="green">Connected</Badge> : <Badge>Not connected</Badge>}
          </div>
          {!configured ? (
            <p className="mt-3 text-sm text-ink-400">Needs a LinkedIn app with the Community Management API. See the setup steps.</p>
          ) : !li.connected ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-ink-400">Sign in with a LinkedIn account that is an <strong>admin of the ESGCounts page</strong>.</p>
              <a href="/api/linkedin/connect" className={buttonStyles.primary}>Connect LinkedIn</a>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              <LinkedInSettingsForm
                organizations={li.settings.organizations ?? []}
                organization={li.settings.organization}
                autoPublish={!!li.settings.autoPublish}
                autoImport={!!li.settings.autoImport}
              />
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-teal-50 pt-5 text-sm text-ink-400">
                <div>
                  {li.settings.organization && <p>Page: <strong className="text-ink-500">{li.settings.organization.name}</strong></p>}
                  <p>Last import: {li.settings.lastImportAt ? new Date(li.settings.lastImportAt).toLocaleString("en-GB") : "never"}</p>
                  {expiresAt && <p>Connection valid until {formatDate(new Date(expiresAt))}. Reconnect before then.</p>}
                </div>
                <div className="flex items-start gap-3">
                  {li.settings.organization && <ImportNowButton />}
                  <a href="/api/linkedin/connect" className={buttonStyles.secondary}>Reconnect</a>
                  <form action={disconnectLinkedIn}>
                    <ConfirmButton variant="ghost" message="Disconnect LinkedIn? Automatic sync stops; existing news stays.">Disconnect</ConfirmButton>
                  </form>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-teal-500">Works without setup</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-500">
            <li>Every news post has a <strong>Share on LinkedIn</strong> button. LinkedIn opens with a branded preview card; choose to post as the ESGCounts page.</li>
            <li>Paste a LinkedIn post link into a news post to <strong>link it</strong>: the news page gets a “View on LinkedIn” button and can show the LinkedIn post.</li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-teal-500">Setup (one time)</h2>
        <p className="mt-1 text-sm text-ink-400">LinkedIn only allows automatic posting to company pages through an approved app. Approval usually takes from a few days to a few weeks.</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-ink-500">
          <li>Go to <a className="font-semibold text-teal-500 underline" href="https://www.linkedin.com/developers/apps/new" target="_blank" rel="noopener noreferrer">linkedin.com/developers/apps/new</a> and create an app: name <em>ESGCounts website</em>, LinkedIn Page <em>ESGCounts</em>, privacy policy <code>{SITE_URL}/privacy</code>, the ESGCounts logo.</li>
          <li>On the app&apos;s <strong>Settings</strong> tab, click <strong>Verify</strong> next to the page and send the link to a page admin (or open it yourself if you are one).</li>
          <li>On the <strong>Products</strong> tab, request <strong>Community Management API</strong>. LinkedIn asks for company details (ESG COUNTS UAB) and how the app is used: <em>&quot;Publish our own news posts to our company page and show our page posts on our website.&quot;</em></li>
          <li>On the <strong>Auth</strong> tab, add the redirect URL <code>{SITE_URL}/api/linkedin/callback</code>. Copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.</li>
          <li>In Vercel → Settings → Environment Variables add <code>LINKEDIN_CLIENT_ID</code>, <code>LINKEDIN_CLIENT_SECRET</code> and <code>CRON_SECRET</code> (any random text, used by the daily import), then redeploy.</li>
          <li>Come back here, click <strong>Connect LinkedIn</strong>, choose the page and switch on the sync directions you want.</li>
        </ol>
      </Card>
    </>
  );
}
