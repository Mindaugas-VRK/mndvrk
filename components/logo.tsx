import Link from "next/link";

type Variant = "color" | "on-teal" | "teal" | "white";

/**
 * The official ESGCounts wordmark from public/brand (see brand/BRAND.md).
 * - color:   white / light backgrounds (default)
 * - on-teal: teal or dark backgrounds
 * - teal:    pale lime backgrounds
 * - white:   lime backgrounds
 */
export function Logo({
  href = "/",
  variant = "color",
  className = "h-8 w-auto",
}: {
  href?: string | null;
  variant?: Variant;
  className?: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={`/brand/logo-${variant}.svg`} alt="ESGCounts" width={178} height={32} className={className} />;
  if (!href) return img;
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="ESGCounts home">
      {img}
    </Link>
  );
}

export function LogoMark({ variant = "teal", className = "h-8 w-8" }: { variant?: "teal" | "white"; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/brand/mark-${variant}.svg`} alt="" aria-hidden width={32} height={32} className={className} />;
}
