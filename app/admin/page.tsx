"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function AdminPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [metaAccountId, setMetaAccountId] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) setSlug(toSlug(val));
  }

  function handleSlugChange(val: string) {
    setSlug(toSlug(val));
    setSlugEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, metaAccountId }),
      });
      const json = await res.json();

      if (json.ok) {
        setStatus({ ok: true, message: `${name} lagt til. Hent data fra Performance-siden for å synke.` });
        setName(""); setSlug(""); setMetaAccountId(""); setSlugEdited(false);
        router.refresh();
      } else {
        setStatus({ ok: false, message: json.error ?? "Ukjent feil" });
      }
    } catch (e: unknown) {
      setStatus({ ok: false, message: e instanceof Error ? e.message : "Nettverksfeil" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-1">Legg til kunde</h1>
      <p className="text-sm text-[rgba(9,10,8,0.45)] mb-8">
        Ny konto legges til i databasen. Hent data manuelt fra Performance-siden etterpå.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] mb-1.5">
            Kundenavn
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Kokkeløren AS"
            required
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-link)] bg-white"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] mb-1.5">
            Slug <span className="normal-case font-normal">(URL: /slug/performance)</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="kokkeloren"
            required
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--color-link)] bg-white"
          />
        </div>

        {/* Meta Account ID */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] mb-1.5">
            Meta Ad Account ID
          </label>
          <input
            type="text"
            value={metaAccountId}
            onChange={(e) => setMetaAccountId(e.target.value)}
            placeholder="act_431404084344569"
            required
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[var(--color-link)] bg-white"
          />
          <p className="mt-1 text-xs text-[rgba(9,10,8,0.35)]">
            Finn det i Meta Ads Manager URL-en eller Business Manager → Ad Accounts.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !name || !slug || !metaAccountId}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Legger til..." : "Legg til kunde"}
        </button>

        {/* Feedback */}
        {status && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: status.ok ? "rgba(137,255,88,0.10)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${status.ok ? "rgba(137,255,88,0.30)" : "rgba(239,68,68,0.25)"}`,
              color: status.ok ? "var(--color-black)" : "#b91c1c",
            }}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
