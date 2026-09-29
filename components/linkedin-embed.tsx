"use client";

import { useState } from "react";
import { buttonStyles } from "./ui";

/**
 * Click-to-load LinkedIn post. The iframe (and LinkedIn's cookies) only load
 * after the visitor asks for it, so the page stays free of third-party cookies.
 */
export function LinkedInEmbed({ embedUrl, postUrl }: { embedUrl: string; postUrl: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-10 rounded-2xl border border-teal-100 bg-cream p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display font-bold text-ink-500">Also on LinkedIn</p>
        <div className="flex gap-2">
          {!show && (
            <button type="button" onClick={() => setShow(true)} className={buttonStyles.secondary}>
              Show LinkedIn post
            </button>
          )}
          <a href={postUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
            View on LinkedIn ↗
          </a>
        </div>
      </div>
      {show && (
        <iframe
          src={embedUrl}
          title="LinkedIn post"
          className="mt-4 h-[560px] w-full rounded-xl border-0 bg-white"
          allowFullScreen
        />
      )}
      {!show && <p className="mt-2 text-xs text-ink-400">Loading the post shares data with LinkedIn.</p>}
    </div>
  );
}
