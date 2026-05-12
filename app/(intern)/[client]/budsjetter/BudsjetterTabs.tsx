"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { value: "salg",  label: "Salgsbudsjett" },
  { value: "media", label: "Mediebudsjett" },
] as const;

export default function BudsjetterTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "salg";

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <nav className="flex items-center gap-1 border-b border-neutral-200 mb-6">
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => setTab(t.value)}
          className={clsx(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            active === t.value
              ? "border-neutral-900 text-neutral-900"
              : "border-transparent text-neutral-500 hover:text-neutral-900",
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
