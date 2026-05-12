# Simpleness OS

Byråets monolitt-applikasjon. Dekker både intern-view (dashboard for Simpleness sine ansatte) og kunde-view (kundens grensesnitt mot egne leveranser og resultater).

**Type:** Modul-monolitt (alle kundedata-flater i samme app)
**Status:** Live på Vercel — intern-view live med mock-data, kunde-view live med statisk leveranseliste
**Repo:** https://github.com/sprouts79/simpleness-os
**Live:** https://simpleness-os.vercel.app
**Lokalt:** `Simple Brain/Simpleness/Verktøy/Produksjon/Simpleness OS/`

---

## Stack

Next.js 15 · TypeScript · Tailwind · Recharts · Supabase (fase 2) · Vercel

For utviklerinstruksjoner, faseplan og teknisk dokumentasjon: se [CLAUDE.md](./CLAUDE.md).

---

## Plassering i Simpleness OS-rammeverket

Denne applikasjonen er den digitale instansieringen av Simpleness OS-rammeverket. Mens malverk, kunnskap og struktur lever i Drive (`Simple Brain/`), lever de kjørbare flatene her.

**Routes:**
- `/` — intern puls (alle kunder)
- `/[client]/*` — intern per-kunde-view (performance, reach, creative)
- `/admin/*` — administrasjon
- `/kunde/[slug]` — kunde-view (offentlig URL, ingen auth i dag)
- `/api/*` — felles API

**Auth-modell:** ingen i dag (URL-obscurity for kunde-view). Supabase Auth + RLS legges på når flere kunder er aktive.
