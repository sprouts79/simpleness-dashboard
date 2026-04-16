"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client, ClientStatus } from "@/lib/types";
import clsx from "clsx";

function StatusDot({ status }: { status: ClientStatus }) {
  return (
    <span
      className={clsx("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0", {
        "bg-[var(--color-status-green)]": status === "green",
        "bg-[var(--color-status-yellow)]": status === "yellow",
        "bg-[var(--color-status-red)]": status === "red",
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
    <aside className="flex flex-col w-[210px] flex-shrink-0 h-full overflow-y-auto bg-[var(--color-surface)] border-r border-[var(--color-border)]">

      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border)]">
        {/* LOGO: logo-standard.png — replace with logo-standard.svg when exported from Figma */}
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
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5",
            isPulse
              ? "bg-[var(--color-green-pale)] text-[var(--color-link)]"
              : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)] hover:bg-[var(--color-border)]"
          )}
        >
          <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[var(--color-accent)]", !isPulse && "opacity-30")} />
          Pulse
        </Link>

        <div className="mt-4 mb-1.5 px-3">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[rgba(9,10,8,0.3)]">
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
                "flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors mb-0.5",
                isActive
                  ? "bg-[var(--color-green-pale)] text-[var(--color-link)] font-semibold"
                  : "text-[rgba(9,10,8,0.45)] hover:text-[var(--color-black)] hover:bg-[var(--color-border)]"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <StatusDot status={client.status} />
                <span className="truncate">{client.name}</span>
              </div>
              <span
                className="text-[11px] ml-2 flex-shrink-0 tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isActive ? "var(--color-link)" : "rgba(9,10,8,0.25)",
                }}
              >
                {formatSpend(client.weeklySpend)}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
