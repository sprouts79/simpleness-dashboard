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
    <nav className="flex gap-6">
      {TABS.map((tab) => {
        const href = `/${clientSlug}/${tab.path}`;
        const isActive = pathname.endsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={href}
            className={clsx(
              "text-sm font-medium pb-3 border-b-2 transition-colors",
              isActive
                ? "border-[var(--color-black)] text-[var(--color-black)]"
                : "border-transparent text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
