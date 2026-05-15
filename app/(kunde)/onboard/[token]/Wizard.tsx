"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  PLATFORMS,
  type OnboardingSession,
  type OnboardingAccess,
  type OnboardingInsights,
  type OnboardingDocument,
  type OnboardingPlatform,
} from "@/lib/types-onboarding";
import { teamMember, initials, type TeamMember } from "@/lib/team";
import {
  setStepAction,
  togglePlatformAction,
  saveInsightsAction,
  submitInsightsAction,
  unlockInsightsAction,
  uploadDocumentAction,
  addLinkAction,
  deleteDocumentAction,
} from "./actions";

interface Props {
  token: string;
  kundeNavn: string;
  contactName: string;
  simplenessKontakt: string;
  slackInviteUrl: string | null;
  session: OnboardingSession;
  access: OnboardingAccess[];
  insights: OnboardingInsights | null;
  documents: OnboardingDocument[];
}

type StepKey = 0 | 1 | 2 | 3;

export default function Wizard(props: Props) {
  // initial step: completed → 0 (Welcome) so delte lenker lander på Velkomst,
  // ellers fortsett der kunden slapp
  const completed = Boolean(props.session.completed_at);
  const initialStep: StepKey = completed ? 0 : ((props.session.current_step as StepKey) ?? 0);
  const [step, setStep] = useState<StepKey>(initialStep);

  function goTo(s: StepKey) {
    setStep(s);
    // server: bump current_step (but only forward, never backward)
    if (s > props.session.current_step && !props.session.completed_at) {
      setStepAction(props.token, s);
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (step === 0) {
    return (
      <Welcome
        token={props.token}
        kundeNavn={props.kundeNavn}
        simplenessKontakt={props.simplenessKontakt}
        slackInviteUrl={props.slackInviteUrl}
        completed={completed}
        onStart={() => goTo(1)}
        onEditAfterCompletion={() => setStep(2)}
      />
    );
  }

  return (
    <div>
      <Topbar kundeNavn={props.kundeNavn} step={step} />
      <Progress step={step} onJump={(s) => goTo(s)} />

      {step === 1 && (
        <AccessStep
          token={props.token}
          access={props.access}
          simplenessKontakt={props.simplenessKontakt}
          slackInviteUrl={props.slackInviteUrl}
          onBack={() => goTo(0)}
          onNext={() => goTo(2)}
        />
      )}
      {step === 2 && (
        <InsightStep
          token={props.token}
          insights={props.insights}
          documents={props.documents}
          locked={props.session.insights_locked}
          onBack={() => goTo(1)}
          onSubmit={() => goTo(3)}
        />
      )}
      {step === 3 && (
        <NextStepsScreen
          token={props.token}
          simplenessKontakt={props.simplenessKontakt}
          completed={Boolean(props.session.completed_at)}
          locked={props.session.insights_locked}
          onBack={() => goTo(2)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// WELCOME
// ════════════════════════════════════════════════════════════

function Welcome({
  token,
  kundeNavn,
  simplenessKontakt,
  slackInviteUrl,
  completed,
  onStart,
  onEditAfterCompletion,
}: {
  token: string;
  kundeNavn: string;
  simplenessKontakt: string;
  slackInviteUrl: string | null;
  completed: boolean;
  onStart: () => void;
  onEditAfterCompletion: () => void;
}) {
  const [unlocking, setUnlocking] = useState(false);

  async function handleEdit() {
    if (unlocking) return;
    setUnlocking(true);
    try {
      await unlockInsightsAction(token);
      onEditAfterCompletion();
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="max-w-[720px] mx-auto py-4">
      <header className="border-b border-neutral-200 pb-8 mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Velkommen, {kundeNavn}</h1>
        <p className="mt-2 text-neutral-500">Onboarding</p>
      </header>

      {completed ? (
        <p className="text-[15px] text-neutral-600 mb-8 leading-relaxed">
          Du har fullført onboardingen —{" "}
          <button
            type="button"
            onClick={handleEdit}
            disabled={unlocking}
            className="text-[#515b12] hover:underline disabled:opacity-50"
          >
            {unlocking ? "låser opp …" : "klikk her for å redigere svarene dine"}
          </button>
          .
        </p>
      ) : (
        <p className="text-[15px] text-neutral-600 mb-8 leading-relaxed">
          Vi trenger tilganger og litt innsikt før oppstartsmøte. Alt lagres automatisk, så du kan stoppe og fortsette når du vil.
        </p>
      )}

      {slackInviteUrl && (
        <a
          href={slackInviteUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 mb-8 px-5 py-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
        >
          <SlackIcon />
          <div className="flex-1">
            <div className="text-[15px] font-medium text-neutral-900">Bli med i Slack-kanalen</div>
            <div className="text-[13px] text-neutral-500 mt-0.5">Spørsmål underveis? Ta dem her — vi svarer raskt.</div>
          </div>
          <span className="text-[#515b12] text-sm font-medium whitespace-nowrap">Åpne Slack →</span>
        </a>
      )}

      {!completed && (
        <>
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-8">
            <StepRow num="1" name="Tilganger"      time="~5 min"  />
            <StepRow num="2" name="Innsikt"        time="~10 min" />
            <StepRow num="3" name="Veien videre"   time="~2 min"  />
          </div>

          <div className="flex justify-end">
            <button onClick={onStart} className="px-4 py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black transition-colors">
              Start →
            </button>
          </div>
        </>
      )}

      <div className="mt-10 pt-6 border-t border-neutral-200">
        <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">Kontaktperson</div>
        <ContactCard kontaktNavn={simplenessKontakt} />
      </div>
    </div>
  );
}

function ContactCard({ kontaktNavn }: { kontaktNavn: string }) {
  const member = teamMember(kontaktNavn);
  if (!member) {
    return <div className="text-[13px] text-neutral-700">{kontaktNavn}</div>;
  }
  return (
    <div className="flex items-center gap-3.5">
      <Avatar member={member} />
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-neutral-900 truncate">{member.name}</div>
        <a href={`mailto:${member.email}`} className="text-[13px] text-[#515b12] hover:underline font-mono">{member.email}</a>
      </div>
    </div>
  );
}

function Avatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  const [errored, setErrored] = useState(false);
  const showImage = member.photoUrl && !errored;
  return (
    <div
      className="rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center flex-shrink-0 text-neutral-700 text-[13px] font-medium"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photoUrl}
          alt={member.name}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials(member.name)}</span>
      )}
    </div>
  );
}

function SlackIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 122.8 122.8" aria-hidden="true" className="flex-shrink-0">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#E01E5A"/>
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36C5F0"/>
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2EB67D"/>
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ECB22E"/>
    </svg>
  );
}

function StepRow({ num, name, time }: { num: string; name: string; time: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-200 first:border-t-0">
      <span className="font-mono text-xs text-neutral-400 mr-3.5 w-4">{num}</span>
      <span className="flex-1 text-[15px] font-medium text-neutral-900">{name}</span>
      <span className="font-mono text-xs text-neutral-500">{time}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TOPBAR + PROGRESS
// ════════════════════════════════════════════════════════════

function Topbar({ kundeNavn, step }: { kundeNavn: string; step: number }) {
  return (
    <div className="flex items-center justify-between pb-5 mb-8 border-b border-neutral-200">
      <div className="text-[13px] text-neutral-500">
        <strong className="text-neutral-900 font-semibold">{kundeNavn}</strong> · Onboarding
      </div>
      <div className="text-xs text-neutral-500 font-mono tracking-wider">STEG {step} AV 3</div>
    </div>
  );
}

function Progress({ step, onJump }: { step: number; onJump: (s: StepKey) => void }) {
  const steps: { num: StepKey; name: string }[] = [
    { num: 1, name: "Tilganger" },
    { num: 2, name: "Innsikt" },
    { num: 3, name: "Veien videre" },
  ];

  return (
    <div className="flex items-center mb-10">
      {steps.map((s, i) => {
        const state = s.num < step ? "done" : s.num === step ? "active" : "upcoming";
        return (
          <div key={s.num} className="flex items-center" style={{ flex: i < steps.length - 1 ? "0 0 auto" : "0 0 auto" }}>
            <button
              type="button"
              onClick={() => onJump(s.num)}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <span className={`w-2 h-2 rounded-full ${
                state === "done" ? "bg-green-500" :
                state === "active" ? "bg-neutral-900" :
                "bg-neutral-300"
              }`} />
              <span className={`text-[13px] ${
                state === "done" ? "text-neutral-700" :
                state === "active" ? "text-neutral-900 font-medium" :
                "text-neutral-400"
              }`}>{s.name}</span>
            </button>
            {i < steps.length - 1 && (
              <span className={`flex-1 h-px mx-3.5 w-12 sm:w-24 ${state === "done" ? "bg-green-500/40" : "bg-neutral-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 1 — TILGANGER
// ════════════════════════════════════════════════════════════

function AccessStep({
  token,
  access,
  simplenessKontakt,
  slackInviteUrl,
  onBack,
  onNext,
}: {
  token: string;
  access: OnboardingAccess[];
  simplenessKontakt: string;
  slackInviteUrl: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const completedCount = access.filter((a) => a.completed).length;
  const member = teamMember(simplenessKontakt);

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Tilganger</h2>
        <div className="mt-1 text-[13px] text-neutral-500 font-mono">
          {completedCount} av {access.length} fullført
        </div>
      </header>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        {access.map((a) => (
          <PlatformItem key={a.id} token={token} access={a} />
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="text-[15px] font-semibold text-neutral-900 mb-1.5">Andre tilganger</h3>
        <p className="text-[14px] text-neutral-600 leading-relaxed mb-4">
          Har dere en bildebank, video-arkiv eller andre delte ressurser vi bør ha tilgang til? Del lenker eller invitasjoner med oss her:
        </p>
        <div className="flex gap-2 flex-wrap">
          {slackInviteUrl && (
            <a
              href={slackInviteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-200 text-[13px] text-neutral-700 hover:bg-neutral-50"
            >
              Del i Slack →
            </a>
          )}
          {member?.email && (
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-200 text-[13px] text-neutral-700 hover:bg-neutral-50"
            >
              Send til {member.email} →
            </a>
          )}
        </div>
      </div>

      <BottomNav backLabel="← Velkomst" nextLabel="Neste: Innsikt →" onBack={onBack} onNext={onNext} />
    </div>
  );
}

function PlatformItem({ token, access }: { token: string; access: OnboardingAccess }) {
  const [expanded, setExpanded] = useState(false);
  const [, startTransition] = useTransition();

  const platform = PLATFORMS.find((p) => p.id === access.platform);
  if (!platform) return null;

  function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(() => {
      togglePlatformAction(token, access.platform, !access.completed);
    });
    setExpanded(false);
  }

  return (
    <div className="border-t border-neutral-200 first:border-t-0">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-neutral-50"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${access.completed ? "bg-green-500" : "bg-neutral-300"}`} />
        <span className="flex-1 font-medium text-neutral-900">{platform.navn}</span>
        <span className={`text-[11px] font-medium uppercase tracking-wider px-2 py-1 rounded ${
          access.required ? "bg-[#dff7cc] text-neutral-900" : "bg-neutral-100 text-neutral-500"
        }`}>
          {access.required ? "Obligatorisk" : "Valgfri"}
        </span>
        <span className="text-xs text-neutral-500 font-mono ml-2">{expanded ? "−" : "+"}</span>
      </div>

      {expanded && (
        <div className="px-5 pl-12 pb-6 pt-2 bg-neutral-50 border-t border-neutral-200">
          <PlatformGuide platform={access.platform} />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={toggleDone}
              className="px-3.5 py-2 rounded-lg bg-neutral-900 text-white text-[13px] font-medium hover:bg-black"
            >
              {access.completed ? "Marker som ikke fullført" : "Marker som fullført"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformGuide({ platform }: { platform: OnboardingPlatform }) {
  if (platform === "meta") {
    return (
      <Guide
        steps={[
          "Gå til business.facebook.com",
          "Velg riktig Business Manager (øverst til venstre)",
          "Innstillinger → Brukere → Partnere",
          "Legg til → Gi partner tilgang til aktiver",
          "Skriv inn Simpleness byrå-ID (under)",
          "Velg aktiver: Facebook-side, Annonsekonto, Instagram-konto, Pixel, Catalog, Domain",
          "Tilgangsnivå: Full tilgang",
        ]}
        copyValue="1757731204238112"
        copyLabel="Simpleness byrå-ID"
        helpUrl="https://www.facebook.com/business/help/1717412048538897"
      />
    );
  }
  if (platform === "ga4") {
    return (
      <Guide
        steps={[
          "Gå til analytics.google.com",
          "Velg riktig konto og eiendom (property)",
          "Admin (⚙️ nederst til venstre)",
          "Konto- eller Eiendomstilgang → Legg til bruker",
          "E-post: performance@simpleness.no",
          "Tilgangsnivå: Administrator",
        ]}
        copyValue="performance@simpleness.no"
        copyLabel="Simpleness e-post"
      />
    );
  }
  if (platform === "google_ads") {
    return (
      <Guide
        steps={[
          "Gå til ads.google.com",
          "Finn konto-ID (format: 123-456-7890) — vises flere steder i grensesnittet",
          "Send konto-ID til kontaktpersonen din i Slack",
          "Vi sender en tilgangsforespørsel til kontoen din",
          "Godkjenn forespørselen når den dukker opp",
        ]}
      />
    );
  }
  if (platform === "shopify") {
    return (
      <Guide
        steps={[
          "Shopify Admin → Settings → Users and Permissions",
          "Add staff or collaborator → Add staff",
          "E-post: performance@simpleness.no",
          "Tilganger: Online Store, Orders, Analytics, Apps and Channels",
          "Send invite",
        ]}
        copyValue="performance@simpleness.no"
        copyLabel="Simpleness e-post"
      />
    );
  }
  if (platform === "snapchat") {
    return (
      <Guide
        steps={[
          "Gå til business.snapchat.com",
          "Business Settings → Members → Invite Members",
          "Legg til performance@simpleness.no, rolle: Business Admin",
          "Account Membership: Legg til alle aktuelle ad accounts (Account Admin)",
          "Catalog Memberships: Legg til alle aktuelle cataloger",
        ]}
        copyValue="performance@simpleness.no"
        copyLabel="Simpleness e-post"
      />
    );
  }
  return null;
}

function Guide({
  steps,
  copyValue,
  copyLabel,
  helpUrl,
}: {
  steps: string[];
  copyValue?: string;
  copyLabel?: string;
  helpUrl?: string;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">Steg</h4>
      <ol className="space-y-1.5 mb-4">
        {steps.map((s, i) => (
          <li key={i} className="text-sm text-neutral-700 pl-7 relative leading-snug">
            <span className="absolute left-0 top-0 font-mono text-xs text-neutral-400 w-5 text-right">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      {copyValue && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">{copyLabel}</h4>
          <CopyBox value={copyValue} />
        </div>
      )}
      {helpUrl && (
        <a href={helpUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[13px] text-[#515b12] hover:underline">
          Hjelp fra Meta ↗
        </a>
      )}
    </div>
  );
}

function CopyBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-md px-3 py-2 max-w-sm">
      <span className="font-mono text-[13px] text-neutral-900">{value}</span>
      <button onClick={copy} className={`text-xs px-2 py-0.5 rounded hover:bg-neutral-100 ${copied ? "text-green-700" : "text-[#515b12]"}`}>
        {copied ? "Kopiert ✓" : "Kopier"}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 2 — INNSIKT
// ════════════════════════════════════════════════════════════

function InsightStep({
  token,
  insights,
  documents,
  locked,
  onBack,
  onSubmit,
}: {
  token: string;
  insights: OnboardingInsights | null;
  documents: OnboardingDocument[];
  locked: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [data, setData] = useState<OnboardingInsights>(() => ({
    id: 0,
    session_id: "",
    forretningsmal: insights?.forretningsmal ?? null,
    omsetningsmal: insights?.omsetningsmal ?? null,
    prioritet: insights?.prioritet ?? null,
    utfordringer: insights?.utfordringer ?? null,
    malgruppe: insights?.malgruppe ?? null,
    konkurrenter: insights?.konkurrenter ?? null,
    referanser_anti: insights?.referanser_anti ?? null,
    ambassadorer_kreatorer: insights?.ambassadorer_kreatorer ?? null,
    prioriterte_produkter: insights?.prioriterte_produkter ?? null,
    snittordre_nok: insights?.snittordre_nok ?? null,
    sesongvariasjoner: insights?.sesongvariasjoner ?? null,
    rabatter_bundles: insights?.rabatter_bundles ?? null,
    manedlig_annonsebudsjett_nok: insights?.manedlig_annonsebudsjett_nok ?? null,
    kpis: insights?.kpis ?? [],
    slack_medlemmer: insights?.slack_medlemmer ?? null,
    suksess_definisjon: insights?.suksess_definisjon ?? null,
    noe_mer: insights?.noe_mer ?? null,
    salgsmal_fjoraret_nok: toNumOrNull(insights?.salgsmal_fjoraret_nok),
    salgsmal_vekstmal_pct: toNumOrNull(insights?.salgsmal_vekstmal_pct),
    salgsmal_iar_nok: toNumOrNull(insights?.salgsmal_iar_nok),
    omsetning_forste_ordre_nok: toNumOrNull(insights?.omsetning_forste_ordre_nok),
    omsetning_6mnd_nok: toNumOrNull(insights?.omsetning_6mnd_nok),
    omsetning_12mnd_nok: toNumOrNull(insights?.omsetning_12mnd_nok),
    andel_nye_kunder_pct: toNumOrNull(insights?.andel_nye_kunder_pct),
    varekost_pct: toNumOrNull(insights?.varekost_pct),
    frakt_pct: toNumOrNull(insights?.frakt_pct),
    transaksjonsgebyr_pct: toNumOrNull(insights?.transaksjonsgebyr_pct),
    mkt_spend_arlig_nok: toNumOrNull(insights?.mkt_spend_arlig_nok),
    mkt_produksjon_arlig_nok: toNumOrNull(insights?.mkt_produksjon_arlig_nok),
    nyhetsbrev_liste_antall: toNumOrNull(insights?.nyhetsbrev_liste_antall),
    sms_liste_antall: toNumOrNull(insights?.sms_liste_antall),
    nyhetsbrev_frekvens: insights?.nyhetsbrev_frekvens ?? null,
    automatiske_eposter_aktivert: insights?.automatiske_eposter_aktivert ?? null,
    automatiske_eposter_typer: insights?.automatiske_eposter_typer ?? [],
    marketingsaktiviteter_fungerte: insights?.marketingsaktiviteter_fungerte ?? null,
    marketingsaktiviteter_ikke_fungerte: insights?.marketingsaktiviteter_ikke_fungerte ?? null,
    submitted_at: insights?.submitted_at ?? null,
    updated_at: insights?.updated_at ?? "",
  }));
  const [submitting, setSubmitting] = useState(false);

  // Debounced auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function patch<K extends keyof OnboardingInsights>(key: K, value: OnboardingInsights[K]) {
    if (locked) return;
    setData((prev) => ({ ...prev, [key]: value }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveInsightsAction(token, { [key]: value } as Partial<OnboardingInsights>);
    }, 600);
  }

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Auto-derive vekstmål from fjoråret + salgsmål i år, only when vekstmål is empty
  useEffect(() => {
    if (locked) return;
    const fj = data.salgsmal_fjoraret_nok;
    const iar = data.salgsmal_iar_nok;
    if (fj && iar && (data.salgsmal_vekstmal_pct === null || data.salgsmal_vekstmal_pct === undefined)) {
      const pct = Math.round(((iar / fj) - 1) * 1000) / 10;
      if (Number.isFinite(pct)) patch("salgsmal_vekstmal_pct", pct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.salgsmal_fjoraret_nok, data.salgsmal_iar_nok]);

  async function handleSubmit() {
    if (locked) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSubmitting(true);
    // Final save with full data, then lock
    await saveInsightsAction(token, {
      prioritet: data.prioritet,
      utfordringer: data.utfordringer,
      malgruppe: data.malgruppe,
      konkurrenter: data.konkurrenter,
      referanser_anti: data.referanser_anti,
      ambassadorer_kreatorer: data.ambassadorer_kreatorer,
      prioriterte_produkter: data.prioriterte_produkter,
      sesongvariasjoner: data.sesongvariasjoner,
      rabatter_bundles: data.rabatter_bundles,
      suksess_definisjon: data.suksess_definisjon,
      noe_mer: data.noe_mer,
      salgsmal_fjoraret_nok: data.salgsmal_fjoraret_nok,
      salgsmal_vekstmal_pct: data.salgsmal_vekstmal_pct,
      salgsmal_iar_nok: data.salgsmal_iar_nok,
      omsetning_forste_ordre_nok: data.omsetning_forste_ordre_nok,
      omsetning_6mnd_nok: data.omsetning_6mnd_nok,
      omsetning_12mnd_nok: data.omsetning_12mnd_nok,
      andel_nye_kunder_pct: data.andel_nye_kunder_pct,
      varekost_pct: data.varekost_pct,
      frakt_pct: data.frakt_pct,
      transaksjonsgebyr_pct: data.transaksjonsgebyr_pct,
      mkt_spend_arlig_nok: data.mkt_spend_arlig_nok,
      mkt_produksjon_arlig_nok: data.mkt_produksjon_arlig_nok,
      nyhetsbrev_liste_antall: data.nyhetsbrev_liste_antall,
      sms_liste_antall: data.sms_liste_antall,
      nyhetsbrev_frekvens: data.nyhetsbrev_frekvens,
      automatiske_eposter_aktivert: data.automatiske_eposter_aktivert,
      automatiske_eposter_typer: data.automatiske_eposter_typer,
      marketingsaktiviteter_fungerte: data.marketingsaktiviteter_fungerte,
      marketingsaktiviteter_ikke_fungerte: data.marketingsaktiviteter_ikke_fungerte,
    });
    await submitInsightsAction(token);
    setSubmitting(false);
    onSubmit();
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Innsikt</h2>
        <p className="mt-2 text-[14px] text-neutral-500 leading-relaxed">
          Fyll inn det du kan og synes er relevant — resten finner vi ut av sammen på oppstartsmøtet.
        </p>
      </header>

      <Card title="Salgsmål og enhetsøkonomi" hint="alle tall ekskl. mva og etter returer">
        <SubSection title="Salgsmål">
          <Row2>
            <Field label="Fjoråret">
              <NumberInput suffix="kr" value={data.salgsmal_fjoraret_nok} onChange={(v) => patch("salgsmal_fjoraret_nok", v)} placeholder="19 800 000" disabled={locked} />
            </Field>
            <Field label="Vekstmål">
              <NumberInput suffix="%" decimals value={data.salgsmal_vekstmal_pct} onChange={(v) => patch("salgsmal_vekstmal_pct", v)} placeholder="40" disabled={locked} />
            </Field>
          </Row2>
          <Field label="Salgsmål i år">
            <div className="flex items-center gap-2 flex-wrap">
              <NumberInput suffix="kr" value={data.salgsmal_iar_nok} onChange={(v) => patch("salgsmal_iar_nok", v)} placeholder="27 720 000" disabled={locked} />
              {!locked && data.salgsmal_fjoraret_nok && data.salgsmal_vekstmal_pct != null && (
                <button
                  type="button"
                  onClick={() => patch("salgsmal_iar_nok", Math.round((data.salgsmal_fjoraret_nok ?? 0) * (1 + (data.salgsmal_vekstmal_pct ?? 0) / 100)))}
                  className="px-2.5 py-1.5 rounded-md border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-100 whitespace-nowrap"
                >
                  ← Beregn fra fjoråret × vekstmål
                </button>
              )}
            </div>
          </Field>
        </SubSection>

        <SubSection title="Omsetning per kunde" tooltip="Legg inn akkumulert snittomsetning per kunde ved første ordre, etter 6 og 12 måneder.">
          <Row3>
            <Field label="Første ordre">
              <NumberInput suffix="kr" value={data.omsetning_forste_ordre_nok} onChange={(v) => patch("omsetning_forste_ordre_nok", v)} placeholder="1 000" disabled={locked} />
            </Field>
            <Field label="6 mndr">
              <NumberInput suffix="kr" value={data.omsetning_6mnd_nok} onChange={(v) => patch("omsetning_6mnd_nok", v)} placeholder="1 300" disabled={locked} />
            </Field>
            <Field label="12 mndr">
              <NumberInput suffix="kr" value={data.omsetning_12mnd_nok} onChange={(v) => patch("omsetning_12mnd_nok", v)} placeholder="1 600" disabled={locked} />
            </Field>
          </Row3>
          <Field label="Andel nye kunder">
            <NumberInput suffix="%" decimals value={data.andel_nye_kunder_pct} onChange={(v) => patch("andel_nye_kunder_pct", v)} placeholder="50" disabled={locked} />
          </Field>
        </SubSection>

        <SubSection title="Variable salgskostnader per ordre">
          <Row3>
            <Field label="Varekost">
              <NumberInput suffix="%" decimals value={data.varekost_pct} onChange={(v) => patch("varekost_pct", v)} placeholder="40" disabled={locked} />
            </Field>
            <Field label="Frakt (plukk, pakk og frakt)">
              <NumberInput suffix="%" decimals value={data.frakt_pct} onChange={(v) => patch("frakt_pct", v)} placeholder="10,1" disabled={locked} />
            </Field>
            <Field label="Transaksjonsgebyr">
              <NumberInput suffix="%" decimals value={data.transaksjonsgebyr_pct} onChange={(v) => patch("transaksjonsgebyr_pct", v)} placeholder="3,0" disabled={locked} />
            </Field>
          </Row3>
        </SubSection>

        <SubSection title="Marketingbudsjett">
          <Row2>
            <Field label="Mkt-spend årlig">
              <NumberInput suffix="kr" value={data.mkt_spend_arlig_nok} onChange={(v) => patch("mkt_spend_arlig_nok", v)} placeholder="4 158 000" disabled={locked} />
            </Field>
            <Field label="Mkt-produksjon årlig">
              <NumberInput suffix="kr" value={data.mkt_produksjon_arlig_nok} onChange={(v) => patch("mkt_produksjon_arlig_nok", v)} placeholder="0" disabled={locked} />
            </Field>
          </Row2>
        </SubSection>

        <SubSection title="Prioritet">
          <Field label="Hva er viktigst de neste 12 månedene?">
            <ChipGroup>
              {(["topplinjevekst", "lonnsomhet", "begge"] as const).map((p) => (
                <Chip key={p} active={data.prioritet === p} onClick={() => patch("prioritet", p)} disabled={locked}>
                  {p === "topplinjevekst" ? "Topplinje" : p === "lonnsomhet" ? "Lønnsomhet" : "Begge deler"}
                </Chip>
              ))}
            </ChipGroup>
          </Field>
        </SubSection>

        <SubSection title="Budsjetter" tooltip="Salgsbudsjetter, mediekjøpsplaner eller lignende — last opp filer eller lim inn lenker.">
          <Upload token={token} documents={documents} category="budget" disabled={locked} uploadLabel="Klikk her for å laste opp salgsbudsjetter eller lignende" />
        </SubSection>
      </Card>

      <Card title="Marketing">
        <Row2>
          <Field label="Hvor mange har dere på nyhetsbrevliste?">
            <NumberInput suffix="personer" value={data.nyhetsbrev_liste_antall} onChange={(v) => patch("nyhetsbrev_liste_antall", v)} placeholder="12 000" disabled={locked} />
          </Field>
          <Field label="Hvor mange har dere på SMS-liste?">
            <NumberInput suffix="personer" value={data.sms_liste_antall} onChange={(v) => patch("sms_liste_antall", v)} placeholder="3 000" disabled={locked} />
          </Field>
        </Row2>
        <Field label="Hvor ofte sender dere ut nyhetsbrev?">
          <Input value={data.nyhetsbrev_frekvens ?? ""} onChange={(v) => patch("nyhetsbrev_frekvens", v)} placeholder="f.eks. én gang per uke" disabled={locked} />
        </Field>

        <Field label="Har dere satt opp automatiske e-poster?">
          <ChipGroup>
            <Chip active={data.automatiske_eposter_aktivert === true} onClick={() => patch("automatiske_eposter_aktivert", true)} disabled={locked}>Ja</Chip>
            <Chip active={data.automatiske_eposter_aktivert === false} onClick={() => { patch("automatiske_eposter_aktivert", false); patch("automatiske_eposter_typer", []); }} disabled={locked}>Nei</Chip>
          </ChipGroup>
        </Field>
        {data.automatiske_eposter_aktivert === true && (
          <Field label="Hvilke?">
            <ChipGroup>
              {["Velkomstserie", "Forlatt handlekurv", "E-poster knyttet til omsetning per kunde", "Annet"].map((opt) => {
                const arr = data.automatiske_eposter_typer ?? [];
                const active = arr.includes(opt);
                return (
                  <Chip
                    key={opt}
                    active={active}
                    onClick={() => patch("automatiske_eposter_typer", active ? arr.filter((x) => x !== opt) : [...arr, opt])}
                    disabled={locked}
                  >
                    {opt}
                  </Chip>
                );
              })}
            </ChipGroup>
          </Field>
        )}

        <Field label="Hvilke markedsaktiviteter har fungert bra siste 24 mndr?">
          <Textarea value={data.marketingsaktiviteter_fungerte ?? ""} onChange={(v) => patch("marketingsaktiviteter_fungerte", v)} placeholder="Kampanjer, kanaler, samarbeid, lanseringer — det som har gitt resultater." disabled={locked} />
        </Field>
        <Field label="Hvilke markedsaktiviteter har ikke fungert?">
          <Textarea value={data.marketingsaktiviteter_ikke_fungerte ?? ""} onChange={(v) => patch("marketingsaktiviteter_ikke_fungerte", v)} placeholder="Det dere har prøvd som ikke ga ønsket effekt." disabled={locked} />
        </Field>
        <Field label="Største utfordringer i vekst- og markedsarbeidet">
          <Textarea value={data.utfordringer ?? ""} onChange={(v) => patch("utfordringer", v)} placeholder="Det som står i veien i dag." disabled={locked} />
        </Field>
      </Card>

      <Card title="Merkevare og posisjonering">
        <Field label="Målgruppe(r) og kundeinnsikt">
          <Textarea value={data.malgruppe ?? ""} onChange={(v) => patch("malgruppe", v)} placeholder="Hvem er kundene? Segmenter, demografi, behov." disabled={locked} />
        </Field>
        <Field label="Konkurrenter">
          <Textarea value={data.konkurrenter ?? ""} onChange={(v) => patch("konkurrenter", v)} placeholder="Hvem måler dere dere mot?" disabled={locked} />
        </Field>
        <Field label="Referanser og anti-referanser" optional>
          <Textarea value={data.referanser_anti ?? ""} onChange={(v) => patch("referanser_anti", v)} placeholder="Merker dere ser opp til, og merker dere ikke vil ligne på." disabled={locked} />
        </Field>
        <Field label="Ambassadører og kreatører" optional>
          <Textarea value={data.ambassadorer_kreatorer ?? ""} onChange={(v) => patch("ambassadorer_kreatorer", v)} placeholder="Talspersoner og innholdsskapere dere bruker eller vurderer." disabled={locked} />
        </Field>
        <Field label="Strategi- og brand-materiell" optional>
          <Upload token={token} documents={documents} category="strategy" disabled={locked} />
        </Field>
      </Card>

      <Card title="Produkt og salg">
        <Field label="Fortell litt om produktsortimentet">
          <Textarea value={data.prioriterte_produkter ?? ""} onChange={(v) => patch("prioriterte_produkter", v)} placeholder="Hvor ofte har dere nyheter? Hva er bestselgere? Har dere nye kategorier eller produkter som er strategisk viktige?" disabled={locked} />
        </Field>
        <Field label="Sesongvariasjoner og største salgsperioder">
          <Textarea value={data.sesongvariasjoner ?? ""} onChange={(v) => patch("sesongvariasjoner", v)} placeholder="Hvordan spiller sesong inn for dere? I hvilke perioder har dere mest salg?" disabled={locked} />
        </Field>
        <Field label="Salgsutløsende budskap">
          <Textarea value={data.rabatter_bundles ?? ""} onChange={(v) => patch("rabatter_bundles", v)} placeholder="Hva dere bruker eller kan bruke — medlemspriser, pakketilbud, sesongkampanjer etc." disabled={locked} />
        </Field>
      </Card>

      <Card title="Avslutning">
        <Field label="Hvordan ser suksess ut for dere?" optional>
          <Textarea value={data.suksess_definisjon ?? ""} onChange={(v) => patch("suksess_definisjon", v)} placeholder="Hvis vi ser tilbake om 12 måneder — hva må ha skjedd for at dere er fornøyd?" disabled={locked} />
        </Field>
        <Field label="Noe mer vi bør vite?" optional>
          <Textarea value={data.noe_mer ?? ""} onChange={(v) => patch("noe_mer", v)} placeholder="Alt som ikke passet andre steder." disabled={locked} />
        </Field>
      </Card>

      <BottomNav
        backLabel="← Tilganger"
        nextLabel={locked ? "Allerede sendt inn" : submitting ? "Sender …" : "Send inn →"}
        onBack={onBack}
        onNext={handleSubmit}
        nextDisabled={locked || submitting}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3 — VEIEN VIDERE
// ════════════════════════════════════════════════════════════

function NextStepsScreen({
  token,
  simplenessKontakt,
  completed,
  locked,
  onBack,
}: {
  token: string;
  simplenessKontakt: string;
  completed: boolean;
  locked: boolean;
  onBack: () => void;
}) {
  const [unlocking, setUnlocking] = useState(false);

  async function handleUnlock() {
    setUnlocking(true);
    await unlockInsightsAction(token);
    setUnlocking(false);
    onBack();
  }

  return (
    <div className="max-w-[720px] mx-auto">
      {completed && (
        <div className="flex items-center gap-3 p-4 mb-8 rounded-xl bg-[#dff7cc] border border-[#41bd0e]/25 text-sm text-neutral-900">
          <span className="w-5 h-5 rounded-full bg-[#41bd0e] text-white inline-flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
          <span>Takk! Da har vi det vi trenger for å starte arbeidet.</span>
        </div>
      )}

      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Veien videre</h2>
      </header>

      <ol className="border-l border-neutral-200 ml-1.5 pl-7 mb-12 space-y-6">
        <TimelineItem when="I dag"        what="Onboarding fullført"  who="Tilganger og innsikt levert" status="done" />
        <TimelineItem when="Uke 1"        what="Tilstandsanalyse"     who="Vi setter oss inn i kontoer og tar en gjennomgang av sporing, signalstyrke og produktfeed." status="current" />
        <TimelineItem when="Uke 2"        what="Oppstartsmøte"        who="Vi blir enige om mål og plan for de neste 3 månedene." />
        <TimelineItem when="Uke 3–4"      what="Annonseproduksjon"    who="Vi produserer første runde med nye annonser." />
        <TimelineItem when="Innen uke 5"  what="Kampanjestart"        who="Første kampanjer i drift." />
      </ol>

      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Vanlige spørsmål</h3>
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-8">
        <FaqItem q="Hvem ser informasjonen jeg har sendt inn?" a="Lagres internt i Simpleness og brukes kun av teamet som jobber med kontoen din. Ingenting deles eksternt." defaultOpen />
        <FaqItem q="Hva om jeg ikke fikk gitt alle tilgangene?" a="Helt greit. Vi sender en bekreftelse etter at vi har gått gjennom det dere har levert, og ber om det som mangler. De obligatoriske tilgangene trenger vi før vi kan starte — de valgfrie kan ordnes underveis." />
        <FaqItem q="Hva om noe er feil i svarene jeg ga?" a="Send en melding til kontaktpersonen din i Slack, eller ta det opp i oppstartsmøtet." />
      </div>

      <div className="pt-6 border-t border-neutral-200">
        <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">Kontaktperson</div>
        <ContactCard kontaktNavn={simplenessKontakt} />
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          ← Innsikt
        </button>
        {locked && (
          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
            title="Åpner Innsikt for redigering på nytt — for testing"
          >
            {unlocking ? "Låser opp …" : "Lås opp og rediger"}
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  when,
  what,
  who,
  status,
}: {
  when: string;
  what: string;
  who: string;
  status?: "done" | "current";
}) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[34px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-neutral-50 ${
          status === "done" ? "bg-green-500" : status === "current" ? "bg-neutral-900" : "bg-neutral-300"
        }`}
      />
      <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">{when}</div>
      <div className="text-[15px] font-medium text-neutral-900">{what}</div>
      <div className="text-[13px] text-neutral-500 mt-0.5">{who}</div>
    </li>
  );
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="border-t border-neutral-200 first:border-t-0">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-neutral-900"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        <span className="font-mono text-neutral-400">{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div className="px-5 pb-4 -mt-1 text-sm text-neutral-600 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// FORM BUILDING BLOCKS
// ════════════════════════════════════════════════════════════

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-7 mb-4">
      <h3 className="text-base font-semibold text-neutral-900 pb-3.5 mb-6 border-b border-neutral-200">
        {title}
        {hint && <span className="ml-2 text-xs font-normal text-neutral-400">{hint}</span>}
      </h3>
      {children}
    </div>
  );
}

function SubSection({ title, tooltip, children }: { title: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div className="mb-7 last:mb-0">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-3">
        <span>{title}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {children}
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-neutral-300 text-neutral-500 text-[10px] leading-none font-mono normal-case tracking-normal hover:border-neutral-500 hover:text-neutral-700"
        aria-label="Forklaring"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-10 w-64 px-3 py-2 rounded-lg bg-neutral-900 text-white text-[12px] leading-snug normal-case tracking-normal font-normal shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">{children}</div>;
}

function Row3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-0">{children}</div>;
}

function toNumOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function NumberInput({
  value,
  onChange,
  suffix,
  placeholder,
  decimals,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  suffix: string;
  placeholder?: string;
  decimals?: boolean;
  disabled?: boolean;
}) {
  // Format display: grouped thousands for integer counts, % with decimals → as-is
  function display(n: number | null): string {
    if (n === null) return "";
    if (!decimals) return n.toLocaleString("nb-NO").replace(/,/g, " ");
    return String(n).replace(".", ",");
  }
  const [raw, setRaw] = useState<string>(display(value));

  // Sync from external changes (e.g. auto-calc button)
  useEffect(() => { setRaw(display(value)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [value]);

  function handleChange(v: string) {
    setRaw(v);
    if (v.trim() === "") {
      onChange(null);
      return;
    }
    const cleaned = v.replace(/\s/g, "").replace(",", ".");
    const allowed = decimals ? /^-?\d*(\.\d*)?$/ : /^-?\d*$/;
    if (!allowed.test(cleaned)) return;
    const n = parseFloat(cleaned);
    if (Number.isFinite(n)) onChange(decimals ? n : Math.round(n));
  }

  function handleBlur() {
    setRaw(display(value));
  }

  return (
    <div className={`inline-flex items-center bg-white border border-neutral-200 rounded-lg overflow-hidden w-full ${disabled ? "opacity-60" : ""}`}>
      <input
        type="text"
        inputMode={decimals ? "decimal" : "numeric"}
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 border-0 bg-transparent px-3 py-2 text-sm text-right font-mono focus:outline-none disabled:text-neutral-500"
      />
      <span className="px-3 py-2 bg-neutral-50 border-l border-neutral-200 font-mono text-[13px] text-neutral-500">{suffix}</span>
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <label className="block text-sm font-medium text-neutral-900 mb-2">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-neutral-400">valgfritt</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-500"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full min-h-[80px] resize-y rounded-lg border border-neutral-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-500"
    />
  );
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className={`px-3.5 py-1.5 rounded-full border text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

function Upload({
  token,
  documents,
  category = "strategy",
  uploadLabel,
  disabled,
}: {
  token: string;
  documents: OnboardingDocument[];
  category?: "strategy" | "budget";
  uploadLabel?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPending, startLinkTransition] = useTransition();
  const [linkError, setLinkError] = useState<string | null>(null);

  const own = documents.filter((d) => (d.category ?? "strategy") === category);
  const defaultUploadLabel = category === "budget"
    ? "Klikk her for å laste opp salgsbudsjetter eller lignende"
    : "Klikk for å laste opp filer";

  function pick() {
    if (disabled || pending) return;
    inputRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingNames(files.map((f) => f.name));
    startTransition(async () => {
      for (const f of files) {
        const fd = new FormData();
        fd.set("file", f);
        try {
          await uploadDocumentAction(token, fd, category);
        } catch {
          // swallow — visning oppdateres ved revalidate
        }
      }
      setUploadingNames([]);
    });
    e.target.value = "";
  }

  function submitLink() {
    if (disabled || linkPending) return;
    const url = linkUrl.trim();
    if (!url) return;
    setLinkError(null);
    try {
      new URL(url);
    } catch {
      setLinkError("Ugyldig URL");
      return;
    }
    startLinkTransition(async () => {
      try {
        await addLinkAction(token, url, category);
        setLinkUrl("");
      } catch (e) {
        setLinkError(e instanceof Error ? e.message : "Kunne ikke lagre lenken");
      }
    });
  }

  function removeDoc(id: number) {
    if (disabled) return;
    startTransition(async () => {
      try {
        await deleteDocumentAction(token, id);
      } catch {
        // swallow
      }
    });
  }

  return (
    <div>
      <div
        onClick={pick}
        className={`relative border border-dashed rounded-xl p-7 text-center bg-white ${
          disabled || pending ? "opacity-60 cursor-not-allowed" : "border-neutral-300 cursor-pointer hover:border-neutral-400 hover:bg-neutral-50"
        }`}
      >
        {pending ? (
          <div className="flex items-center justify-center gap-2.5 text-sm text-neutral-700">
            <Spinner /> Laster opp …
          </div>
        ) : (
          <>
            <div className="text-sm font-medium text-neutral-700 mb-1">{uploadLabel ?? defaultUploadLabel}</div>
            <div className="text-xs text-neutral-500">maks 25 MB per fil</div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={onChange} />

      <div className="mt-3">
        <label className="block text-xs text-neutral-500 mb-1.5">Eller lim inn en lenke (Google Doc, Sheet, Drive-mappe …)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitLink(); } }}
            placeholder="https://docs.google.com/..."
            disabled={disabled || linkPending}
            className="flex-1 min-w-0 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:border-neutral-400 disabled:bg-neutral-50"
          />
          <button
            onClick={submitLink}
            disabled={disabled || linkPending || !linkUrl.trim()}
            className="px-3 py-2 rounded-lg bg-neutral-900 text-white text-[13px] font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {linkPending ? "…" : "Legg til"}
          </button>
        </div>
        {linkError && <div className="mt-1.5 text-xs text-red-700">{linkError}</div>}
      </div>

      {(own.length > 0 || uploadingNames.length > 0) && (
        <ul className="mt-4 space-y-1.5">
          {own.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-[13px] text-neutral-700 group">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {d.link_url ? (
                <a href={d.link_url} target="_blank" rel="noreferrer" className="text-[#515b12] hover:underline truncate">{d.filename}</a>
              ) : (
                <span className="truncate">{d.filename}</span>
              )}
              {!disabled && (
                <button
                  onClick={() => removeDoc(d.id)}
                  className="ml-auto text-xs text-neutral-400 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Fjern"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
          {uploadingNames.map((name) => (
            <li key={`pending-${name}`} className="flex items-center gap-2 text-[13px] text-neutral-400">
              <Spinner small /> <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Spinner({ small }: { small?: boolean }) {
  const size = small ? "w-3 h-3" : "w-4 h-4";
  return (
    <svg className={`${size} animate-spin text-neutral-500`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
// BOTTOM NAV
// ════════════════════════════════════════════════════════════

function BottomNav({
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
}: {
  backLabel: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-neutral-200">
      <button onClick={onBack} className="px-4 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-100">
        {backLabel}
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {nextLabel}
      </button>
    </div>
  );
}
