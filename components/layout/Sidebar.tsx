"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client } from "@/lib/types";
import clsx from "clsx";

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const isPulse = pathname === "/";

  return (
    <aside className="flex flex-col w-[210px] flex-shrink-0 h-full overflow-y-auto bg-[var(--color-surface)] border-r border-[var(--color-border)]">

      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border)]">
        <img
          src="https://simpleness-design-system.vercel.app/logo-standard.png"
          alt="simpleness"
          height={18}
          className="block"
        />
      </div>

      {/* Navigation */}
      <nav className="px-2.5 pt-3 flex-1">
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
            isPulse
              ? "bg-white text-[var(--color-black)] shadow-sm"
              : "text-[rgba(9,10,8,0.55)] hover:text-[var(--color-black)] hover:bg-white"
          )}
        >
          <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", isPulse ? "bg-[var(--color-accent)]" : "bg-[rgba(9,10,8,0.2)]")} />
          Puls
        </Link>

        <div className="mt-5 mb-2 px-3">
          <p className="text-2xs font-semibold tracking-widest uppercase text-[rgba(9,10,8,0.4)]">
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
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5",
                isActive
                  ? "bg-white text-[var(--color-black)] font-semibold shadow-sm"
                  : "text-[rgba(9,10,8,0.55)] hover:text-[var(--color-black)] hover:bg-white"
              )}
            >
              <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", isActive ? "bg-[var(--color-accent)]" : "bg-[rgba(9,10,8,0.2)]")} />
              <span className="truncate">{client.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin */}
      <div className="px-2.5 pb-4 border-t border-[var(--color-border)] pt-4 mt-2">
        <Link
          href="/admin"
          className={clsx(
            "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
            pathname === "/admin"
              ? "bg-white text-[var(--color-black)] font-semibold shadow-sm"
              : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)] hover:bg-white"
          )}
        >
          <span className="text-xs">＋</span>
          Legg til kunde
        </Link>
      </div>
    </aside>
  );
}
