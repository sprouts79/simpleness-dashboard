"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client } from "@/lib/types";
import clsx from "clsx";

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const isPulse = pathname === "/";

  return (
    <aside className="flex flex-col w-[200px] flex-shrink-0 h-full overflow-y-auto bg-[var(--color-gray-50)] border-r border-[var(--color-border)]">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <span className="text-sm font-semibold tracking-tight text-[var(--color-black)]">
          simpleness
        </span>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-colors mb-0.5",
            isPulse
              ? "bg-white text-[var(--color-black)] font-medium shadow-sm"
              : "text-[var(--color-gray-500)] hover:text-[var(--color-black)] hover:bg-white"
          )}
        >
          Puls
        </Link>

        <div className="mt-6 mb-2 px-3">
          <p className="text-[11px] font-medium text-[var(--color-gray-400)] uppercase tracking-wider">
            Kunder
          </p>
        </div>

        {clients.map((client) => {
          const isActive = pathname.startsWith(`/${client.slug}`);
          return (
            <Link
              key={client.id}
              href={`/${client.slug}/performance`}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-colors mb-0.5",
                isActive
                  ? "bg-white text-[var(--color-black)] font-medium shadow-sm"
                  : "text-[var(--color-gray-500)] hover:text-[var(--color-black)] hover:bg-white"
              )}
            >
              <span className="truncate">{client.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin */}
      <div className="px-3 pb-5 pt-3 mt-2">
        <Link
          href="/admin"
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-colors",
            pathname === "/admin"
              ? "bg-white text-[var(--color-black)] font-medium shadow-sm"
              : "text-[var(--color-gray-400)] hover:text-[var(--color-black)] hover:bg-white"
          )}
        >
          <span className="text-[10px]">+</span>
          Legg til kunde
        </Link>
      </div>
    </aside>
  );
}
