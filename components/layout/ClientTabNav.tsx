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
    <nav className="flex gap-5">
      {TABS.map((tab) => {
        const href = `/${clientSlug}/${tab.path}`;
        const isActive = pathname.endsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={href}
            className={clsx(
              "text-sm font-medium pb-2.5 -mb-px border-b-2 transition-colors",
              isActive
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
