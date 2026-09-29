"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; children?: NavLink[] };
export type NavSection = { href: string; label: string; icon: IconName; exact?: boolean; children?: NavLink[] };

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function SubLinks({ links, pathname, depth }: { links: NavLink[]; pathname: string; depth: number }) {
  return (
    <ul className={cn("space-y-0.5", depth === 1 ? "mt-1 ml-9" : "ml-4")}>
      {links.map((l) => {
        const active = pathname === l.href;
        const within = isActive(pathname, l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              className={cn(
                "relative block rounded-md py-1.5 pr-2 text-[13px] transition",
                active ? "font-semibold text-teal-500" : within ? "font-medium text-teal-500" : "text-ink-400 hover:text-teal-500",
              )}
            >
              {l.label}
              {active && <span className="absolute -right-4 top-1 bottom-1 w-[3px] rounded-l bg-lime-500" />}
            </Link>
            {l.children && within && <SubLinks links={l.children} pathname={pathname} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}

export function AppSidebar({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Main" className="space-y-1">
      {sections.map((s) => {
        const active = isActive(pathname, s.href, s.exact);
        const expanded = open[s.href] ?? active;
        const I = Icon[s.icon];
        return (
          <div key={s.href}>
            <div className="relative flex items-center">
              <Link
                href={s.href}
                className={cn(
                  "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                  active ? "font-semibold text-teal-500" : "text-ink-400 hover:bg-teal-50 hover:text-teal-500",
                )}
              >
                <I className={cn("h-5 w-5", active ? "text-lime-500" : "text-ink-300")} />
                {s.label}
              </Link>
              {s.children && (
                <button
                  type="button"
                  aria-label={`${expanded ? "Collapse" : "Expand"} ${s.label}`}
                  aria-expanded={expanded}
                  onClick={() => setOpen((o) => ({ ...o, [s.href]: !expanded }))}
                  className="rounded-md p-1.5 text-ink-300 hover:bg-teal-50 hover:text-teal-500"
                >
                  <Icon.chevronDown className={cn("h-4 w-4 transition", expanded && "rotate-180")} />
                </button>
              )}
              {active && !s.children && <span className="absolute -right-4 top-1.5 bottom-1.5 w-[3px] rounded-l bg-lime-500" />}
            </div>
            {s.children && expanded && <SubLinks links={s.children} pathname={pathname} depth={1} />}
          </div>
        );
      })}
    </nav>
  );
}
