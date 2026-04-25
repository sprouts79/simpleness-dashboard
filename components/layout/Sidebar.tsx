"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client } from "@/lib/types";
import clsx from "clsx";

// Avatar-palett — neutral grå-skala. Holder sidebaren visuelt rolig;
// klienter skilles på navn + initial. Speiler adlaunch-sidebar.
const AVATAR_PALETTE = ["#171717", "#404040", "#525252", "#737373"];

function avatarColor(client: { id: string; name: string }) {
  const seed = (client.id || client.name).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const isPulse = pathname === "/";
  const isAdmin = pathname === "/admin";

  return (
    <aside className="w-64 flex-shrink-0 h-full overflow-y-auto bg-[var(--color-card)] border-r border-[var(--color-border)] flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-5 pb-3">
        <img
          src="https://simpleness-design-system.vercel.app/logo-standard.png"
          alt="simpleness"
          height={18}
          className="block"
        />
      </div>

      {/* Top section: Puls + klient-liste */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Puls */}
        <Link
          href="/"
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
            isPulse
              ? "bg-neutral-100 text-[var(--color-fg)]"
              : "text-neutral-600 hover:bg-neutral-50 hover:text-[var(--color-fg)]"
          )}
        >
          <span className="w-8 h-8 rounded-lg bg-[var(--color-fg)] text-white flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12h3l3-9 4 18 3-9h5"
              />
            </svg>
          </span>
          <span className="flex-1 truncate font-medium">Puls</span>
        </Link>

        <p className="px-3 pt-4 pb-2 text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
          Klienter
        </p>

        {clients.length === 0 && (
          <p className="px-3 py-2 text-xs text-[var(--color-fg-muted)] leading-relaxed">
            Ingen klienter. Legg til under.
          </p>
        )}

        {clients.map((client) => {
          const isActive = pathname.startsWith(`/${client.slug}`);
          return (
            <Link
              key={client.id}
              href={`/${client.slug}/performance`}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-neutral-100 text-[var(--color-fg)]"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-[var(--color-fg)]"
              )}
            >
              <span
                className="w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: avatarColor({ id: client.id, name: client.name }) }}
              >
                {client.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 truncate font-medium">{client.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions — speiler adlaunch's pattern */}
      <div className="px-3 py-3 border-t border-[var(--color-border)] space-y-1">
        <Link
          href="/admin"
          className={clsx(
            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
            isAdmin
              ? "bg-neutral-100 text-[var(--color-fg)] shadow-sm"
              : "text-[var(--color-fg-muted)] hover:bg-neutral-50 hover:text-[var(--color-fg)]"
          )}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">Legg til kunde</span>
        </Link>
      </div>
    </aside>
  );
}
