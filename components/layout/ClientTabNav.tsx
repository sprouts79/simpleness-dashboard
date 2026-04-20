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
    <nav className="flex gap-2">
      {TABS.map((tab) => {
        const href = `/${clientSlug}/${tab.path}`;
        const isActive = pathname.endsWith(tab.path);
        return (
          <Link
            key={tab.path}
            href={href}
            className={clsx(
              "btn-pill text-sm",
              isActive
                ? "btn-pill-primary"
                : "btn-pill-secondary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
