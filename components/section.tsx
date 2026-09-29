import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  children,
  center,
  light,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && (
        <p className={cn("text-xs font-semibold uppercase tracking-[0.25em]", light ? "text-lime-400" : "text-stone")}>
          {eyebrow}
        </p>
      )}
      <h2 className={cn("mt-3 text-3xl font-bold tracking-tight sm:text-4xl", light ? "text-white" : "text-ink-500")}>
        {title}
      </h2>
      <span className={cn("brand-rule mt-5", center && "mx-auto")} />
      {children && <div className={cn("mt-5 text-base leading-7", light ? "text-teal-100" : "text-ink-400")}>{children}</div>}
    </div>
  );
}
