"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Client } from "@/lib/types";
import clsx from "clsx";
import PulseIcon from "@/components/ui/PulseIcon";
import ClientPicker from "./ClientPicker";

interface NavItem {
  label: string;
  path: string;
  hideInPrototype?: boolean;
}

// Aktivt arbeid — det vi går inn på daglig/ukentlig
const CLIENT_SUBNAV_ACTIVE: NavItem[] = [
  { label: "Oversikt",        path: "oversikt" },
  { label: "Aktivitetsplan",  path: "aktivitetsplan" },
  { label: "Forecast",        path: "forecast" },
  { label: "Kreativ rapport", path: "creative" },
  // Skjules i prototype-modus (innebygget i Oversikt)
  { label: "Reach",           path: "reach", hideInPrototype: true },
];

// Statisk konfig — kvartalsvis revidering
const CLIENT_SUBNAV_STATIC: NavItem[] = [
  { label: "Budsjetter",     path: "budsjetter" },
  { label: "Enhetsøkonomi",  path: "enhetsokonomi" },
];

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPrototype = searchParams.get("prototype") === "1";
  const isPulse = pathname === "/";
  const isGuide = pathname === "/guide";

  // Aktiv klient = første path-segment matcher en client.slug
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments[0];
  const sectionSegment = segments[1];
  const activeClient = clients.find((c) => c.slug === slug);

  return (
    <aside className="w-64 flex-shrink-0 h-full overflow-y-auto bg-white flex flex-col">
      {/* Toppnav: ClientPicker + per-klient sub-nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <ClientPicker clients={clients} />

        {activeClient && (
          <div className="mt-1">
            <NavGroup
              items={CLIENT_SUBNAV_ACTIVE}
              slug={activeClient.slug}
              sectionSegment={sectionSegment}
              isPrototype={isPrototype}
            />
            <div className="my-2 mx-12 border-t border-neutral-200" />
            <NavGroup
              items={CLIENT_SUBNAV_STATIC}
              slug={activeClient.slug}
              sectionSegment={sectionSegment}
              isPrototype={isPrototype}
            />
          </div>
        )}
      </nav>

      {/* Bottom-actions: Puls (global) + Guide + Dokumentasjon */}
      <div className="px-2 py-2 border-t border-neutral-200 space-y-0.5">
        <Link
          href="/"
          className={clsx(
            "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
            isPulse
              ? "bg-neutral-100 text-neutral-900"
              : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          )}
        >
          <PulseIcon className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Puls</span>
        </Link>
        <BottomLink href="/guide" active={isGuide} icon="guide">Guide</BottomLink>
        <BottomLink href="/docs/index.html" active={false} external icon="docs">Dokumentasjon</BottomLink>
      </div>

      {/* Brand-footer */}
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center gap-2.5">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-[#41bd0e]">
          <PulseIcon className="w-4 h-4" strokeWidth={2} />
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

function NavGroup({
  items,
  slug,
  sectionSegment,
  isPrototype,
}: {
  items: NavItem[];
  slug: string;
  sectionSegment: string | undefined;
  isPrototype: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {items
        .filter((item) => !(isPrototype && item.hideInPrototype))
        .map((item) => {
          const baseHref = `/${slug}/${item.path}`;
          const href = isPrototype ? `${baseHref}?prototype=1` : baseHref;
          const active = sectionSegment === item.path;
          return (
            <Link
              key={item.path}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 pl-12 pr-2.5 py-1.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-neutral-100 text-neutral-900 font-medium"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              )}
            >
              {item.label}
            </Link>
          );
        })}
    </div>
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
  icon: "guide" | "docs";
  children: React.ReactNode;
}) {
  const className = clsx(
    "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
    active
      ? "bg-neutral-100 text-neutral-900"
      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
  );

  const inner = (
    <>
      <Icon name={icon} />
      <span className="font-medium">{children}</span>
    </>
  );

  if (external) {
    return <a href={href} className={className}>{inner}</a>;
  }
  return <Link href={href} className={className}>{inner}</Link>;
}

function Icon({ name }: { name: "guide" | "docs" }) {
  if (name === "guide") {
    return (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
