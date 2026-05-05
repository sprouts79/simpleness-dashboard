# Vekstdokumentet → Dashboard

Strategisk plan for hvordan vi løfter vekstdokumentet inn i Simple Dashboard. Skrevet 2026-04-26, før prototypegjennomgang.

---

## 1. Hva er vekstdokumentet egentlig

Det ser ut som ett dokument med faner. Det er egentlig **tre lag** stappet inn i samme regneark:

- **Plan** — enhetsøkonomi → budsjett → kampanjeplan → årshjul. Top-down. Hva vi forventer.
- **Virkelighet** — daglig forecast/rapport. Bottom-up. Hva som faktisk skjer.
- **Refleksjon** — endringslogg-kolonnen, kommentarer, ad hoc-observasjoner. Hvorfor avviket oppstod.

I regnearket holdes lagene synkronisert manuelt. Det fungerer for én kunde i et erfarent hode. Det skalerer ikke til ti kunder med to personer.

## 2. Det som mangler er ikke et nytt lag — det er bindeleddet

Mellom Plan og Virkelighet ligger det vi ikke skriver ned i dag: **reglene**. Når skal vi skru opp spend? Når skal vi pause? Hva betyr et avvik på 10% mot budsjett i januar versus november?

I dag bor disse reglene i hodene våre. Det er derfor vi må titte på rapporten hver dag — ingen andre kan tolke den.

Hypotesen: hvis vi flytter reglene ut av hodene og inn i systemet, får vi tre ting gratis:

1. **Operasjon i stedet for observasjon.** Dashbordet sier ikke "her er tallene" — det sier "her er tre ting du må gjøre i dag".
2. **Konsistens på tvers av kunder.** Samme regelsett, ulike terskelverdier per enhetsøkonomi.
3. **Skala uten ansettelser.** AI håndterer rutinen. Vi tar avgjørelsene som krever skjønn.

Dette er turtle traders-tanken Jonas nevnte: faste regler, klare triggere, mindre tolkning i øyeblikket.

## 3. Hva vi tar bort

Like viktig som hva vi bygger er hva vi *fjerner* fra synsfeltet. Vekstdokumentet i dag har ~200 celler synlig per fane. 95% er ikke handlingsverdig på noen gitt dag.

Prinsippet: **standardvisning er status, ikke detaljer**. Detaljer er ett klikk unna for de få cellene som krever oppmerksomhet i dag.

Konkret kuttliste fra dagens dokument:
- Daglige tall side-ved-side med budsjett — vises kun når avvik passerer terskel
- Sluttsummer per måned — vises ikke; månedssyn er aggregert KPI-tracking
- Endringslogg-kolonnen — flyttes til en tidslinje per kampanje, ikke per dag
- Forecast-rad og budsjett-rad — kun synlig som linjer i pacing-graf

## 4. Fire visnings-konsepter (det vi prototyper)

Jeg har bygget fire varianter under `/myyk/vekst`. De er ikke alternativer — de er fire **soner** i et samlet system. Vi velger sammen hvilke vi går videre med.

### A. Brief — morgenvisningen

Standardvisning. Alt du trenger å vite før du logger inn på Meta i dag.

- Én overskrift: "Du er X% foran/bak måned-til-dato"
- 0–5 handlinger, hver med begrunnelse + hvilken regel som trigget
- Kompakt pacing-strip: spend / omsetning / nye kunder vs forventet kurve
- Ingen tabeller. Ingen sub-faner. Hvis ingenting er gult eller rødt, er skjermen nesten tom — det er poenget.

### B. Plan — enhetsøkonomi koblet til budsjett til kampanjer

Erstatter fanene Enhetsøkonomi + Budsjettmodell + Kampanjeplan.

Tanken: alt henger sammen, så vis det sammen. Endring i AOV → endring i target CAC → endring i hva en kampanje må levere for å lønne seg.

- Top: enhetsøkonomi som ett interaktivt panel (input-felt → live beregnede mål)
- Mid: budsjett-fordeling per måned som horisontal stacked bar (mkt spend vs forventet omsetning)
- Bunn: kampanjer som "kort" plassert på en tidslinje, hver med spend, mål og forventet avkastning. Drag for å flytte. Klikk for å redigere.

Dette er den eneste skjermen hvor du *bygger* planen. Resten viser den.

### C. Året — kalender + alt som skjer

Erstatter Årshjul Marked. Layered tidslinje, ikke regneark.

- Horisontal: uke 1–52
- Vertikale lag som kan toggles: Merkedager · Vareflyt · Sortimentendringer · Kampanjer · Spend-kurve · Forecast vs Faktisk
- Hover en uke → side-panel med plan vs faktisk for den uken

Bruksmønster: "Hva er aktivt nå" og "hva er det neste vi planlegger". Ikke en daglig rapport.

### D. Regler — turtle-traders-konseptet eksplisitt

Vises sjelden, men er motoren bak Brief.

- Liste over regler. Hver regel: trigger (når) + handling (hva) + status (på/av per kunde)
- Eksempler:
  - **MER under target i 7 dager** → "Vurder å pause kampanjer med ROAS < target × 0.6"
  - **CAC over target i 5 dager + nye kunder andel < 40%** → "Øk prospecting-andel"
  - **Kampanje treffer 80% av spend-budsjett før halvgått periode** → "Re-evaluer creative eller pause"
- Per kunde: terskler avledes fra enhetsøkonomi-fanen automatisk
- Hver gang en regel trigger → entry på Brief

Dette er der vi gjør implisitt kunnskap eksplisitt. Det er også der vi skiller oss fra alle andre dashboards.

## 5. Stegvis utrulling

Forslag til rekkefølge etter dagens prat:

1. **Validér konsept** (i dag) — gå gjennom prototypen, plukk hvilke deler som funker
2. **Brief + Regler** først — disse gir umiddelbar verdi selv uten Shopify/GA4 (kan kjøre på Meta-data alene)
3. **Plan** etter mål 1 (datakilder) — trenger Shopify for å være ærlig om CAC
4. **Året** sist — det er den minst tidssensitive

Tidshorisonter er ikke kalendarisk planlagte — de avhenger av at mål 1 (tilkoblinger) er på plass.

## 6. Det dette gjør med byrå-modellen

Det viktigste er ikke teknologien. Det er hva systemet tillater operasjonelt:

- Med 10 kunder × 1 daglig sjekk × 30 minutter = 5 timer per dag fjernet fra menneskedrift
- Disse 5 timene flyttes til strategi, kreativ retning, kundekommunikasjon — det maskinen ikke gjør godt
- Reglene blir byråets immunsystem: nye juniorer leser reglene og ser hvordan vi tenker

Et byrå med to personer som drifter ti merkevarer er ikke en effektiviseringsambisjon. Det er det operasjonelle løftet som gjør at vi kan tjene penger på små og mellomstore norske e-handlere — kunder som ikke har råd til klassisk byrådrift, men som fortjener profesjonell håndtering.

---

## Hva prototypen viser

Bygget under `/myyk/vekst` med fire under-sider. Bruker realistiske MYYK-tall fra dagens rapport (AOV 1290 kr, mkt spend 4.158M, vekstmål 40%, andel nye 50%, snitt-CAC target 387 kr, MER 6.7).

Alle data er hardkodet i prototypene — formålet er å diskutere visningsformer, ikke pipeline.
