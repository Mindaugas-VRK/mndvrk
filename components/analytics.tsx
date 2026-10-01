"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-REBVR1N779";
const STORAGE_KEY = "esg_cookie_consent";
export const OPEN_COOKIE_SETTINGS = "esg:open-cookie-settings";

type Consent = "granted" | "denied" | null;
const CONSENT_CHANGED = "esg:consent-changed";

function readConsent(): Consent {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_CHANGED, onChange);
  };
}

/** "unknown" while rendering on the server, so the banner never flashes for visitors who already chose. */
function useConsent() {
  return useSyncExternalStore<Consent | "unknown">(subscribe, readConsent, () => "unknown");
}

/** Analytics only on the public site, never inside the reporting tool. */
function isTracked(pathname: string) {
  return !pathname.startsWith("/dashboard") && !pathname.startsWith("/login");
}

/**
 * Google Analytics 4 with consent: gtag.js is only loaded after the visitor
 * clicks "Accept" (GDPR / ePrivacy). "Reject" keeps the site cookie-free.
 */
export function Analytics() {
  const pathname = usePathname();
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  function choose(value: "granted" | "denied") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    if (value === "denied" && consent === "granted") {
      // Withdrawing consent: remove GA cookies and reload so the tag is gone.
      for (const c of document.cookie.split(";")) {
        const name = c.split("=")[0].trim();
        if (name.startsWith("_ga")) {
          for (const domain of ["", location.hostname, `.${location.hostname.replace(/^www\./, "")}`]) {
            document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
          }
        }
      }
      location.reload();
      return;
    }
    setReopened(false);
    window.dispatchEvent(new Event(CONSENT_CHANGED));
  }

  const tracked = isTracked(pathname);

  return (
    <>
      {consent === "granted" && tracked && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
          </Script>
        </>
      )}
      {(consent === null || reopened) && tracked && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-teal-100 bg-white p-5 shadow-[0_8px_30px_rgba(40,55,57,0.18)] sm:inset-x-6 sm:bottom-6"
        >
          <p className="font-display font-bold text-ink-500">Cookies</p>
          <p className="mt-1 text-sm text-ink-400">
            We&apos;d like to use Google Analytics cookies to understand how visitors use esgcounts.eu. They are only set if you
            accept. <Link href="/privacy" className="font-semibold text-teal-500 underline">Privacy policy</Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => choose("granted")} className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600">
              Accept
            </button>
            <button type="button" onClick={() => choose("denied")} className="rounded-lg border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-ink-500 hover:bg-teal-50">
              Reject
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}>
      Cookie settings
    </button>
  );
}
