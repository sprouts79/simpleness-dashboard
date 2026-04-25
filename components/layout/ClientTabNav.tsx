"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { label: "Performance", path: "performance" },
  { label: "Reach", path: "reach" },
  { label: "Creative", path: "creative" },
];

export default function ClientTabNav({ clientSlug }: { clientSlug: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-6 border-b border-[var(--color-border)]">
      {TABS.map((tab) => {
        const href = `/${clientSlug}/${tab.path}`;
        const isActive = pathname.endsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={href}
            className={clsx(
              "text-sm font-medium pb-3 -mb-px border-b-2 transition-colors",
              isActive
                ? "border-[var(--color-fg)] text-[var(--color-fg)]"
                : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
