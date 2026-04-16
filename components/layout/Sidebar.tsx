"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client, ClientStatus } from "@/lib/types";
import clsx from "clsx";

function StatusDot({ status }: { status: ClientStatus }) {
  return (
    <span
      className={clsx("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0", {
        "bg-green-500": status === "green",
        "bg-yellow-500": status === "yellow",
        "bg-red-500": status === "red",
      })}
    />
  );
}

function formatSpend(n: number) {
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return `${n}`;
}

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const isPulse = pathname === "/";

  return (
    <aside
      className="flex flex-col w-[220px] flex-shrink-0 h-full overflow-y-auto"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--color-accent)" }}
        >
          Simpleness
        </span>
        <p className="text-white/40 text-2xs mt-0.5 tracking-wide">
          Agency Dashboard
        </p>
      </div>

      {/* Pulse link */}
      <nav className="px-3 pt-4">
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-1",
            isPulse
              ? "sidebar-link-active"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <span className="text-base leading-none">◉</span>
          <span>Pulse</span>
        </Link>

        {/* Divider */}
        <div className="mt-3 mb-2 px-3">
          <p className="text-2xs font-semibold tracking-widest uppercase text-white/25">
            Kunder
          </p>
        </div>

        {/* Client list */}
        {clients.map((client) => {
          const isActive = pathname.startsWith(`/${client.slug}`);
          return (
            <Link
              key={client.id}
              href={`/${client.slug}/performance`}
              className={clsx(
                "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors mb-0.5",
                isActive
                  ? "sidebar-link-active font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <StatusDot status={client.status} />
                <span className="truncate">{client.name}</span>
              </div>
              <span
                className="text-2xs font-medium ml-2 flex-shrink-0"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isActive
                    ? "var(--color-accent)"
                    : "rgba(255,255,255,0.3)",
                }}
              >
                {formatSpend(client.weeklySpend)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-5 py-4 border-t border-white/10">
        <p className="text-2xs text-white/25">
          Siste oppdatering
          <br />
          <span style={{ fontFamily: "var(--font-mono)" }}>15. apr 2026</span>
        </p>
      </div>
    </aside>
  );
}
