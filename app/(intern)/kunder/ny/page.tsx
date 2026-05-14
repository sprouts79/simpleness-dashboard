"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PERFORMANCE_LEVERANSER,
  PROSJEKT_LEVERANSER,
  toSlug,
} from "@/lib/types-kunder";
import { opprettKundeAction } from "./actions";

const SIMPLENESS_KONTAKTER = ["Jonas", "Halvard"];

export default function NyKundePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [simplenessKontakt, setSimplenessKontakt] = useState<string>("Jonas");
  const [perfActive, setPerfActive] = useState<Set<string>>(
    new Set(PERFORMANCE_LEVERANSER.map((p) => p.slug)),
  );
  const [projActive, setProjActive] = useState<Set<string>>(new Set());
  const [metaAccountId, setMetaAccountId] = useState("");
  const [slackInviteUrl, setSlackInviteUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ slug: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(toSlug(v));
  }

  function handleSlugChange(v: string) {
    setSlug(toSlug(v));
    setSlugEdited(true);
  }

  function togglePerf(s: string) {
    setPerfActive((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleProj(s: string) {
    setProjActive((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const res = await opprettKundeAction({
      name: name.trim(),
      slug: slug.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      simplenessContact: simplenessKontakt,
      slackInviteUrl: slackInviteUrl.trim() || null,
      metaAccountId: metaAccountId.trim() || null,
      performanceSlugs: Array.from(perfActive),
      prosjektSlugs: Array.from(projActive),
    });
    setSubmitting(false);
    if (res.ok && res.slug && res.token) {
      setResult({ slug: res.slug, token: res.token });
    } else {
      setError(res.error ?? "Ukjent feil");
    }
  }

  if (result) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${result.token}`;
    return (
      <div className="max-w-2xl">
        <div className="flex items-start gap-4 p-5 rounded-xl bg-[#dff7cc] border border-[#41bd0e]/25 mb-6">
          <span className="w-6 h-6 rounded-full bg-[#41bd0e] text-white inline-flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
          <div className="text-sm text-neutral-900 flex-1">
            <strong className="font-semibold">{name}</strong> er opprettet. {contactName ? `Send onboarding-lenken til ${contactName}:` : "Onboarding-lenke:"}
            <div className="flex items-center gap-2 mt-2 font-mono text-[13px] text-neutral-700">
              <code className="flex-1 truncate">{url}</code>
              <button
                onClick={() => navigator.clipboard.writeText(url)}
                className="px-2 py-1 rounded text-xs text-[#515b12] hover:bg-neutral-100"
              >
                Kopier
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-6">
          <Row label="Kundeområde" value={`/${result.slug}/oversikt`} />
          <Row label="Onboarding-lenke" value={`/onboard/${result.token}`} />
          <Row label="Performance-leveranser aktivert" value={String(perfActive.size)} />
          {projActive.size > 0 && <Row label="Prosjekter aktivert" value={String(projActive.size)} />}
        </div>

        <div className="flex justify-between">
          <Link href="/kunder" className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100">← Tilbake til Kunder</Link>
          <button
            onClick={() => router.push(`/kunder/${result.slug}`)}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black"
          >
            Åpne kundeprofil →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-6">Ny kunde</h1>

      <Card title="Grunnopplysninger">
        <Field label="Kundenavn">
          <Input value={name} onChange={handleNameChange} placeholder="Bjørklund Bakeri" />
        </Field>
        <Field label="Slug" hint={slug ? `URL: /${slug}/oversikt` : "Auto-genereres fra navn"}>
          <Input value={slug} onChange={handleSlugChange} placeholder="bjorklund-bakeri" mono />
        </Field>
      </Card>

      <Card title="Kontakt" hint="valgfritt — kan legges til senere">
        <Field label="Kontaktperson hos kunden">
          <Input value={contactName} onChange={setContactName} placeholder="Anna Bjørklund" />
        </Field>
        <Field label="E-post">
          <Input value={contactEmail} onChange={setContactEmail} placeholder="anna@bjorklund.no" />
        </Field>
        <Field label="Simpleness-kontakt">
          <ChipGroup>
            {SIMPLENESS_KONTAKTER.map((k) => (
              <Chip key={k} active={simplenessKontakt === k} onClick={() => setSimplenessKontakt(k)}>
                {k}
              </Chip>
            ))}
          </ChipGroup>
        </Field>
      </Card>

      <Card title="Aktive leveranser">
        <Field label="Performance">
          <ChipGroup>
            {PERFORMANCE_LEVERANSER.map((p) => (
              <Chip key={p.slug} active={perfActive.has(p.slug)} onClick={() => togglePerf(p.slug)}>
                {p.navn}
              </Chip>
            ))}
          </ChipGroup>
        </Field>
        <Field label="Prosjekter" hint="valgfritt — kan legges til senere">
          <ChipGroup>
            {PROSJEKT_LEVERANSER.map((p) => (
              <Chip key={p.slug} active={projActive.has(p.slug)} onClick={() => toggleProj(p.slug)}>
                {p.navn}
              </Chip>
            ))}
          </ChipGroup>
        </Field>
      </Card>

      <Card title="Slack-kanal" hint="valgfritt — kan legges til senere">
        <Field label="Invite-lenke til kundens kanal">
          <Input value={slackInviteUrl} onChange={setSlackInviteUrl} placeholder="https://join.slack.com/share/..." mono />
        </Field>
      </Card>

      <Card title="Meta Ad Account" hint="valgfritt — kan kobles senere">
        <Field label="Konto-ID">
          <Input value={metaAccountId} onChange={setMetaAccountId} placeholder="act_123456789" mono />
        </Field>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200">
        <Link href="/kunder" className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100">
          ← Avbryt
        </Link>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Oppretter…" : "Opprett kunde →"}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Building blocks
// ────────────────────────────────────────────────────────────

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-7 mb-4">
      <h3 className="text-base font-semibold text-neutral-900 pb-3.5 mb-5 border-b border-neutral-200">
        {title}
        {hint && <span className="ml-2 text-xs font-normal text-neutral-400">{hint}</span>}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="block text-sm font-medium text-neutral-900 mb-2">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-neutral-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-neutral-400 ${mono ? "font-mono" : ""}`}
    />
  );
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`px-3.5 py-1.5 rounded-full border text-sm transition-colors ${
        active
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center px-5 py-3.5 border-t border-neutral-200 first:border-t-0">
      <span className="text-neutral-400 font-mono text-xs mr-4 w-4">→</span>
      <span className="text-sm font-medium text-neutral-900 flex-1">{label}</span>
      <span className="text-xs text-neutral-500 font-mono">{value}</span>
    </div>
  );
}
