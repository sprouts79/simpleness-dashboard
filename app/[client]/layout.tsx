"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { CLIENTS } from "@/lib/mock-data";
import clsx from "clsx";
import { notFound } from "next/navigation";

const TABS = [
  { label: "Performance", path: "performance" },
  { label: "Reach", path: "reach" },
  { label: "Creative", path: "creative" },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const clientSlug = params.client as string;

  const client = CLIENTS.find((c) => c.slug === clientSlug);
  if (!client) return notFound();

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="border-b border-[var(--color-border)] bg-white sticky top-0 z-10">
        <div className="px-8 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{client.name}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded border border-[var(--color-border)] text-[rgba(9,10,8,0.45)] tracking-wide">
                META ADS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[rgba(9,10,8,0.4)]" style={{ fontFamily: "var(--font-mono)" }}>
                Apr 2026
              </span>
            </div>
          </div>

          {/* Tabs */}
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
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {children}
      </div>
    </div>
  );
}
