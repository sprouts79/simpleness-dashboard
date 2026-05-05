"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DataSources from "@/components/ui/DataSources";
import clsx from "clsx";

/**
 * Sub-header for client-routes — datakilder + prototype-toggle + sist oppdatert.
 *
 * Datakilder følger ruten (vekst → manuell input, ellers meta).
 * Prototype-toggle skjules på vekst-ruten (gir ingen mening der).
 */
export default function ClientSubHeader({ now }: { now: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isVekst = pathname.includes("/vekst");
  const sources: ("meta" | "manual")[] = isVekst ? ["manual"] : ["meta"];

  const isPrototype = searchParams.get("prototype") === "1";
  const togglePrototype = () => {
    const params = new URLSearchParams(searchParams);
    if (isPrototype) {
      params.delete("prototype");
    } else {
      params.set("prototype", "1");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex items-center justify-between mb-5">
      <DataSources sources={sources} />

      <div className="flex items-center gap-4">
        {!isVekst && (
          <button
            type="button"
            onClick={togglePrototype}
            className={clsx(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border transition-colors",
              isPrototype
                ? "bg-[#dff7cc] border-[#41bd0e]/40 text-[#3b8d0a]"
                : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-900"
            )}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full", isPrototype ? "bg-[#41bd0e]" : "bg-neutral-300")} />
            Prototype{isPrototype ? "" : ""}
          </button>
        )}
        <span
          className="text-xs text-neutral-500 capitalize tabular-nums"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {now}
        </span>
      </div>
    </div>
  );
}
