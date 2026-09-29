import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next } = await props.searchParams;

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="h-9 w-auto" />
          <h1 className="mt-12 text-3xl font-bold text-ink-500">Welcome back</h1>
          <span className="brand-rule mt-4" />
          <p className="mt-4 text-sm text-ink-400">Sign in to your ESGCounts workspace.</p>
          <div className="mt-8">
            <LoginForm next={typeof next === "string" ? next : undefined} />
          </div>
          <p className="mt-8 text-sm text-ink-400">
            No account? Accounts are created by your administrator.{" "}
            <Link href="/contact" className="font-semibold text-teal-500 hover:text-teal-600">
              Contact us
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-teal-500 lg:flex lg:flex-col lg:justify-end lg:p-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mark-white.svg" alt="" aria-hidden className="absolute -right-24 -top-16 h-[34rem] w-auto opacity-10" />
        <p className="relative font-display text-3xl font-bold leading-snug text-white">
          Collect once. Track every year.
          <br />
          <span className="text-lime-400">Report with confidence.</span>
        </p>
      </div>
    </main>
  );
}
