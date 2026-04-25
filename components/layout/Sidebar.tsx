"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client } from "@/lib/types";
import clsx from "clsx";

export default function Sidebar({ clients }: { clients: Client[] }) {
  const pathname = usePathname();
  const isPulse = pathname === "/";

  return (
    <aside className="flex flex-col w-[220px] flex-shrink-0 h-full overflow-y-auto bg-[var(--color-card)] border-r border-[var(--color-border)]">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <img
          src="https://simpleness-design-system.vercel.app/logo-standard.png"
          alt="simpleness"
          height={18}
          className="block"
        />
      </div>

      {/* Navigation */}
      <nav className="px-2.5 pt-2 flex-1">
        <NavItem href="/" active={isPulse}>
          Puls
        </NavItem>

        <p className="label mt-6 mb-2 px-3">Kunder</p>

        {clients.map((client) => {
          const isActive = pathname.startsWith(`/${client.slug}`);
          return (
            <NavItem
              key={client.id}
              href={`/${client.slug}/performance`}
              active={isActive}
            >
              <span className="truncate">{client.name}</span>
            </NavItem>
          );
        })}
      </nav>

      {/* Admin */}
      <div className="px-2.5 pb-4 pt-3 border-t border-[var(--color-border)] mt-2">
        <Link
          href="/admin"
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === "/admin"
              ? "bg-[var(--color-muted)] text-[var(--color-fg)] font-medium"
              : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)]"
          )}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Legg til kunde
        </Link>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
        active
          ? "bg-[var(--color-muted)] text-[var(--color-fg)] font-semibold"
          : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)]"
      )}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          active ? "bg-[var(--color-deep)]" : "bg-[var(--color-border-strong)]"
        )}
      />
      {children}
    </Link>
  );
}
