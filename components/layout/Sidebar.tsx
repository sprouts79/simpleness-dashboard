"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client } from "@/lib/types";
import clsx from "clsx";
import PulseIcon from "@/components/ui/PulseIcon";

// Avatar-palett — neutral grå-skala. Speiler adlaunch-sidebar.
const AVATAR_PALETTE = ["#171717", "#404040", "#525252", "#737373"];

function avatarColor(client: { id: string; name: string }) {
  const seed = (client.id || client.name).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
}

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const isPulse = pathname === "/";
  const isGuide = pathname === "/guide";

  return (
    <aside className="w-64 flex-shrink-0 h-full overflow-y-auto bg-[var(--color-card)] border-r border-[var(--color-border)] flex flex-col">
      {/* Klient-liste */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <PulseLink active={isPulse} />

        <p className="px-3 pt-4 pb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Klienter
        </p>

        {clients.length === 0 && (
          <p className="px-3 py-2 text-xs text-neutral-500 leading-relaxed">
            Ingen klienter. Legg til i Innstillinger.
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
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
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

      {/* Bottom-actions — speiler adlaunch (Innstillinger ligger i footer) */}
      <div className="px-3 py-3 border-t border-neutral-200 space-y-1">
        <BottomLink href="/guide" active={isGuide} icon="guide">Guide</BottomLink>
        <BottomLink href="/docs/index.html" active={false} external icon="docs">Dokumentasjon</BottomLink>
      </div>

      {/* Brand-footer — eksakt struktur som adlaunch (ikon + stack + høyre-action) */}
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-md bg-neutral-900 text-white flex items-center justify-center flex-shrink-0">
          <PulseIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-xs text-neutral-900 truncate">Simple Dashboard</p>
          <p className="text-[10px] text-neutral-500">betaversjon 1.0</p>
        </div>
        <Link
          href="/admin"
          className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors font-medium flex-shrink-0"
        >
          Admin
        </Link>
      </div>
    </aside>
  );
}

function PulseLink({ active }: { active: boolean }) {
  return (
    <Link
      href="/"
      className={clsx(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
        active
          ? "bg-neutral-100 text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
      )}
    >
      <span className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center flex-shrink-0">
        <PulseIcon className="w-5 h-5" />
      </span>
      <span className="flex-1 truncate font-medium">Puls</span>
    </Link>
  );
}

function BottomLink({
  href,
  active,
  external = false,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  external?: boolean;
  icon: "guide" | "docs" | "settings";
  children: React.ReactNode;
}) {
  const className = clsx(
    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
    active
      ? "bg-neutral-100 text-neutral-900 shadow-sm"
      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
  );

  const inner = (
    <>
      <Icon name={icon} />
      <span className="font-medium">{children}</span>
    </>
  );

  if (external) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function Icon({ name }: { name: "guide" | "docs" | "settings" }) {
  if (name === "guide") {
    return (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  if (name === "docs") {
    return (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
