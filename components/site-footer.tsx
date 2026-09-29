import Link from "next/link";
import { COMPANY_LEGAL_NAME, LINKEDIN_URL } from "@/lib/utils";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-teal-500 text-teal-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo variant="on-teal" />
          <p className="mt-4 max-w-sm text-sm text-teal-100">
            ESG reporting for European companies. Collect your data once, track progress every year,
            and report with confidence under CSRD / ESRS, GRI and VSME.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-lime-400">Product</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/features">Features</Link></li>
            <li><Link className="hover:text-white" href="/blog">Blog</Link></li>
            <li><Link className="hover:text-white" href="/login">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-lime-400">Company</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/about">About</Link></li>
            <li><Link className="hover:text-white" href="/contact">Contact</Link></li>
            <li><Link className="hover:text-white" href="/privacy">Privacy</Link></li>
            {LINKEDIN_URL && <li><a className="hover:text-white" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-teal-200 sm:px-6">
          © {new Date().getFullYear()} {COMPANY_LEGAL_NAME} · esgcounts.eu
        </div>
      </div>
    </footer>
  );
}
