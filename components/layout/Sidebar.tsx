"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client, ClientStatus } from "@/lib/types";
import clsx from "clsx";

function StatusDot({ status }: { status: ClientStatus }) {
  return (
    <span
      className={clsx("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0", {
        "bg-[#22c55e]": status === "green",
        "bg-[#eab308]": status === "yellow",
        "bg-[#ef4444]": status === "red",
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
    <aside className="flex flex-col w-[210px] flex-shrink-0 h-full overflow-y-auto bg-[#090a08] border-r border-white/[0.06]">

      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        {/* PNG logo inverted for dark background — replace with logo-invers.svg when available */}
        {/* LOGO: logo-standard.png from CDN, inverted for dark background (invers SVG not yet exported) */}
        <img
          src="https://simpleness-design-system.vercel.app/logo-standard.png"
          alt="simpleness"
          height={18}
          style={{ filter: "invert(1)", opacity: 0.92 }}
          className="block"
        />
        <p className="text-[10px] text-white/30 mt-1.5 tracking-wider font-medium uppercase">
          Agency Dashboard
        </p>
      </div>

      {/* Navigation */}
      <nav className="px-2.5 pt-3 flex-1">
        {/* Pulse */}
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5",
            isPulse
              ? "bg-[#89ff58]/10 text-[#89ff58]"
              : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
          )}
        >
          <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", isPulse ? "bg-[#89ff58]" : "bg-white/20")} />
          Pulse
        </Link>

        {/* Clients section */}
        <div className="mt-4 mb-1.5 px-3">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/20">
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
                  ? "bg-[#89ff58]/10 text-[#89ff58] font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <StatusDot status={client.status} />
                <span className="truncate">{client.name}</span>
              </div>
              <span
                className="text-[11px] font-medium ml-2 flex-shrink-0 tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isActive ? "rgba(137,255,88,0.6)" : "rgba(255,255,255,0.2)",
                }}
              >
                {formatSpend(client.weeklySpend)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/20">
          Oppdatert i dag
        </p>
      </div>
    </aside>
  );
}
