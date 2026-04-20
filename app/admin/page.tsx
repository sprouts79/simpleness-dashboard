"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

interface MetaAccount {
  accountId: string;
  name: string;
  status: number;
  alreadyAdded: boolean;
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function AdminPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/meta-accounts")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setAccountsError(d.error);
        else setAccounts(d.accounts ?? []);
      })
      .catch(() => setAccountsError("Kunne ikke hente kontoer fra Meta"))
      .finally(() => setAccountsLoading(false));
  }, []);

  function handleAccountSelect(accountId: string) {
    setSelectedAccountId(accountId);
    const account = accounts.find((a) => a.accountId === accountId);
    if (account && !name) {
      const guessedName = account.name;
      setName(guessedName);
      if (!slugEdited) setSlug(toSlug(guessedName));
    }
  }

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
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, metaAccountId: selectedAccountId }),
      });
      const json = await res.json();

      if (json.ok) {
        setResult({ ok: true, message: `${name} lagt til. Gå til /${slug}/performance og trykk Hent data.` });
        setSelectedAccountId("");
        setName("");
        setSlug("");
        setSlugEdited(false);
        // Mark account as added in the list
        setAccounts((prev) =>
          prev.map((a) => a.accountId === selectedAccountId ? { ...a, alreadyAdded: true } : a)
        );
        router.refresh();
      } else {
        setResult({ ok: false, message: json.error ?? "Ukjent feil" });
      }
    } catch (e: unknown) {
      setResult({ ok: false, message: e instanceof Error ? e.message : "Nettverksfeil" });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAccount = accounts.find((a) => a.accountId === selectedAccountId);
  const canSubmit = selectedAccountId && name && slug && !submitting && !selectedAccount?.alreadyAdded;

  return (
    <div className="px-8 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-1">Legg til kunde</h1>
      <p className="text-sm text-[rgba(9,10,8,0.45)] mb-8">
        Velg en Meta-konto fra listen, gi den et navn og slug, og lagre.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Meta account picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] mb-1.5">
            Meta Ad Account
          </label>

          {accountsLoading && (
            <p className="text-sm text-[rgba(9,10,8,0.4)]">Henter kontoer fra Meta...</p>
          )}

          {accountsError && (
            <p className="text-sm text-red-600">{accountsError}</p>
          )}

          {!accountsLoading && !accountsError && (
            <select
              value={selectedAccountId}
              onChange={(e) => handleAccountSelect(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--color-link)] cursor-pointer"
            >
              <option value="">Velg konto…</option>
              {accounts.map((a) => (
                <option key={a.accountId} value={a.accountId} disabled={a.alreadyAdded}>
                  {a.alreadyAdded ? "✓ " : ""}{a.name}
                  {a.status !== 1 ? " (inaktiv)" : ""}
                  {" — "}{a.accountId}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] mb-1.5">
            Kundenavn i dashbordet
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Kokkeløren"
            required
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-link)] bg-white"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[rgba(9,10,8,0.45)] mb-1.5">
            Slug <span className="normal-case font-normal text-[rgba(9,10,8,0.35)]">— URL: /{slug || "slug"}/performance</span>
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

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={clsx(
            "w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity",
            canSubmit
              ? "bg-[var(--color-accent)] text-[var(--color-black)] hover:opacity-90"
              : "bg-[var(--color-surface)] text-[rgba(9,10,8,0.3)] cursor-not-allowed border border-[var(--color-border)]"
          )}
        >
          {submitting ? "Legger til..." : "Legg til kunde"}
        </button>

        {/* Feedback */}
        {result && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: result.ok ? "rgba(137,255,88,0.10)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${result.ok ? "rgba(137,255,88,0.30)" : "rgba(239,68,68,0.25)"}`,
              color: result.ok ? "var(--color-black)" : "#b91c1c",
            }}
          >
            {result.message}
          </div>
        )}
      </form>
    </div>
  );
}
