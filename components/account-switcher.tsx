"use client";

import { switchAccount } from "@/app/actions/workspace";

export function AccountSwitcher({ accounts, current }: { accounts: { id: number; name: string }[]; current: number | null }) {
  if (accounts.length <= 1) {
    return accounts[0] ? <span className="hidden text-sm font-semibold text-teal-500 sm:inline">{accounts[0].name}</span> : null;
  }
  return (
    <form action={switchAccount}>
      <label className="sr-only" htmlFor="account-switch">Account</label>
      <select
        id="account-switch"
        name="accountId"
        defaultValue={current ?? undefined}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="max-w-48 rounded-full border-0 bg-smoke py-2 pl-3 pr-8 text-sm font-semibold text-teal-500 focus:ring-2 focus:ring-lime-500/40"
      >
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </form>
  );
}
