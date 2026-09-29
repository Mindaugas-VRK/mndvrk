import Link from "next/link";
import { Logo } from "./logo";
import { buttonStyles } from "./ui";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-teal-100/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={buttonStyles.ghost}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonStyles.primary}>
            Sign in
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-teal-50 px-2 py-1 md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={buttonStyles.ghost}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
