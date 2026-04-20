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
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        const href = `/${clientSlug}/${tab.path}`;
        const isActive = pathname.endsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={href}
            className={clsx(
              "text-sm px-3 py-1.5 rounded-md transition-colors",
              isActive
                ? "bg-[var(--color-gray-100)] text-[var(--color-black)] font-medium"
                : "text-[var(--color-gray-500)] hover:text-[var(--color-black)] hover:bg-[var(--color-gray-50)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
