"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client } from "@/lib/types";
import clsx from "clsx";

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const isPulse = pathname === "/";

  return (
    <aside className="flex flex-col w-[220px] flex-shrink-0 h-full overflow-y-auto bg-[var(--color-navy)] text-white">

      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <span className="font-display text-xl font-semibold tracking-tight text-white">
          simpleness
        </span>
      </div>

      {/* Navigation */}
      <nav className="px-4 flex-1">
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all mb-1",
            isPulse
              ? "bg-white/15 text-white font-medium"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-[var(--color-teal)]" />
          Puls
        </Link>

        <div className="mt-8 mb-3 px-4">
          <p className="small-caps text-white/50">
            Kunder
          </p>
        </div>

        {clients.map((client) => {
          const isActive = pathname.startsWith(`/${client.slug}`);
          const initials = client.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <Link
              key={client.id}
              href={`/${client.slug}/performance`}
              className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all mb-1",
                isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <span className="avatar w-7 h-7 text-xs flex-shrink-0">
                {initials}
              </span>
              <span className="truncate">{client.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin */}
      <div className="px-4 pb-6 pt-4 border-t border-white/10">
        <Link
          href="/admin"
          className={clsx(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all",
            pathname === "/admin"
              ? "bg-white/15 text-white font-medium"
              : "text-white/50 hover:text-white hover:bg-white/10"
          )}
        >
          <span className="w-5 h-5 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-xs">
            +
          </span>
          Legg til kunde
        </Link>
      </div>
    </aside>
  );
}
