"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Client } from "@/lib/types";

const AVATAR_BG = "#171717";

interface ClientPickerProps {
  clients: Client[];
}

/**
 * Shopify-stil klient-picker. Erstatter en flat liste av alle klienter:
 *   - Knapp viser aktiv klient + chevron
 *   - Klikk åpner dropdown med søkbar liste
 *   - Velg klient → router.push til /[slug]/performance
 *
 * Skalerer til mange klienter uten å ta vertikal plass i sidebar.
 */
export default function ClientPicker({ clients }: ClientPickerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const slug = pathname.split("/")[1];
  const active = clients.find((c) => c.slug === slug);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Reset query when dropdown opens/closes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = query
    ? clients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : clients;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
      >
        {active ? (
          <>
            <span
              className="w-7 h-7 rounded-md text-[11px] font-semibold flex items-center justify-center flex-shrink-0 text-white"
              style={{ backgroundColor: AVATAR_BG }}
            >
              {active.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate font-medium text-left">{active.name}</span>
          </>
        ) : (
          <>
            <span className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-400 text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
              ?
            </span>
            <span className="flex-1 truncate font-medium text-left text-neutral-500">Velg klient</span>
          </>
        )}
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-[420px] flex flex-col overflow-hidden">
          {clients.length > 6 && (
            <div className="px-2.5 pt-2 pb-1.5 border-b border-neutral-100">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Søk klient…"
                className="w-full px-2 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded-md text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>
          )}

          <div className="overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-neutral-500 italic">Ingen treff</p>
            ) : (
              filtered.map((client) => {
                const isActive = active?.id === client.id;
                return (
                  <Link
                    key={client.id}
                    href={`/${client.slug}/performance`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 mx-1 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded text-[10px] font-semibold flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: AVATAR_BG }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate font-medium">{client.name}</span>
                    {isActive && (
                      <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
