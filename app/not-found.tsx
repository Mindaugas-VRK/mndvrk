import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonStyles } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-cream px-4 py-24 text-center">
      <Logo />
      <h1 className="mt-10 text-3xl font-bold text-ink-500">Page not found</h1>
      <span className="brand-rule mx-auto mt-4" />
      <p className="mt-4 text-ink-400">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className={`${buttonStyles.primary} mt-8`}>
        Back to home
      </Link>
    </main>
  );
}
