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
 * Shopify-stil klient-picker. Knapp viser aktiv klient + chevron;
 * klikk åpner dropdown med liste. Velg klient → naviger til
 * /[slug]/performance.
 */
export default function ClientPicker({ clients }: ClientPickerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-[420px] overflow-y-auto py-1">
          {clients.map((client) => {
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
          })}
        </div>
      )}
    </div>
  );
}
