---
title: 'About-Seite /ueber'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'chore/repo-public-cleanup'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent, do not modify unless human renegotiates">

## Intent

**Problem:** navigator.berlin hat keine Seite, die sagt, wer dahinter steht, warum es die Seite gibt und wie sie gebaut ist. Für Besucher fehlt Vertrauen, für Google ein E-E-A-T-Signal, und das `Organization`-JSON-LD hat kein Ziel für Herkunft und Gründer.

**Approach:** Eine schlanke, prerenderte Seite `/ueber` (EN `/en/ueber`) mit kurzen Abschnitten, die für Technik, Methodik, Daten und Recht auf bestehende Seiten verlinkt statt sie zu wiederholen. JSON-LD `AboutPage` mit Verweis auf die Organization und Matze als `founder`.

**Entscheidungen (Matze 15.10.2026):**
- Inhalt fokussiert auf navigator.berlin, keep it simple. Zur Person nur Relevantes: Name, Rolle (Solutions Architect), Berlin, Methode, Motivation, Link auf schmidbauer.dev. Keine Hobbys, keine Biografie.
- Kein Herabsetzen von Berlin Open Data: Motivation positiv formulieren (offene Daten zugänglich machen, an einem Ort zusammenführen), nicht „Portale sind schlecht“.
- mtc.berlin: „navigator.berlin ist ein privates Projekt; mtc.berlin ist mein Arbeitgeber.“ (sinngemäß, DE/EN)
- Finanzierung: privat finanziert, kein kommerzielles Modell, keine Werbung.
- JSON-LD: `founder` als `Person` (Name, `url` https://schmidbauer.dev, `jobTitle`, `sameAs` Bluesky und LinkedIn aus den öffentlichen Profilen).
- Pfad `/ueber`, Footer-Gruppe „Transparenz“, Translation-Register-Eintrag für EN.
- Abschnitte: Kurz erklärt · Das Projekt · Wer dahinter steht · Wie es gebaut wird (Spec-first, KI-gestützt, Link Talk und /architektur) · Haltung und Grenzen (keine Werbung, keine Cookies, Score ohne Sozialstatus, Link /methodik) · Daten und Code (Quellen/Lizenzen, MIT, GitHub, Link /lizenzen, /daten) · Kontakt.
- Nebenbei: Impressum „§ 5 TMG“ auf „§ 5 DDG“ korrigieren (DE/EN).

## Boundaries & Constraints

**Always:** Nur belegte Fakten aus den Quellen (schmidbauer-dev, svelte-meetup-talk, Repo). Keine Zahlen, die veralten, außer aus Daten abgeleitet. DE und EN von Hand formuliert, kurz, aktive Sprache, keine em-dashes, keine Superlative ohne Beleg. Barrierefrei (eine H1, H2 je Abschnitt, sprechende Linktexte). `buildPageTitle`, `SeoHead`, Breadcrumb über `localizedPathname`. Tests zuerst.

**Never:** Keine Hobbys/privaten Details, keine Kritik an Behörden oder Portalen, keine erfundenen Meilensteine, keine Änderung an Startseite oder anderen Seiten außer Footer-Link und Impressum-Paragraf.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE | `/ueber` | Seite mit 7 Abschnitten, Titel ≤ 60, Beschreibung 70-160 | N/A |
| EN | `/en/ueber` | EN-Texte, indexierbar (Register), hreflang | N/A |
| JSON-LD | `/ueber` | `AboutPage` mit `mainEntity`/`about` = Organization-`@id`, Organization verweist auf `founder` Person | N/A |
| Footer | jede Seite | Link „Über“ / „About“ in Gruppe Transparenz | N/A |
| Sitemap/llms | Build | `/ueber` DE/EN enthalten | Konsistenztest |
| Impressum | `/impressum` | „§ 5 DDG“ | N/A |

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] Route `/ueber` + Komponententest DE/EN.
- [x] JSON-LD `AboutPage` + `Person` + Organization-`founder` + Tests.
- [x] Footer, Register, Sitemap, llms + Tests.
- [x] Impressum DDG.
- [x] E2E: Seite erreichbar DE/EN, axe, JSON-LD, Footer-Link.

**Acceptance Criteria:**
- Given `/ueber`, when ein Besucher die Seite liest, then erfährt er in unter einer Minute, wer navigator.berlin betreibt, warum, wie es finanziert ist und wo Methodik, Daten und Code liegen.

## Implementation Notes

- Route `src/routes/(with-header)/ueber/` (`+page.svelte`, `+page.server.ts` mit `prerender`, `ueber-links.ts`). Texte in `messages/{de,en}.json` (`ueber_*`), Inline-Links über `richSegments` und benannte Platzhalter.
- JSON-LD: `jsonld-person.ts` (`@id` `https://schmidbauer.dev/#person`), `jsonld-aboutpage.ts` (`@id` `<canonical>/ueber#about`, DE-canonical wie `dataCatalogId`). Organization trägt `founder` (volle Person), `sameAs` bleibt beim Repo. schmidbauer.dev setzt die `@id` auf seinem Person-Knoten noch nicht (`personJsonLd()` ohne `@id`): offener Punkt dort.
- Footer: `ueber` als erster Link der Gruppe Transparenz und in `META_LINKS`. Register, Sitemap (ohne lastmod), llms: `/ueber`.
- Impressum: `§ 5 TMG` auf `§ 5 DDG` (Seite hat keine EN-Fassung, nur DE). OG-Skript angepasst, `static/og/page/ueber.png` neu, `impressum.png` neu gerendert (Build-Ausgabe).
- Zahlen: keine veraltenden Zahlen auf der Seite. Layer-Zahl bewusst weggelassen.
- Texte: von Matze freigegeben (15.10.2026), danach nur Absolutheiten abgeschwächt ("Die Daten stammen aus offenen Quellen", Tests "in der Regel" vor der Umsetzung, "größere Entscheidungen").
- Review-Patches: AboutPage-`@id` je Sprachfassung (`…/ueber#about`, `…/en/ueber#about`), alles über `canonicalOrigin`. Volle Person nur im Graph von `/ueber` (AboutPage `mainEntity` Organization mit `founder`). Organization (Startseite) und DataCatalog-`publisher` tragen nur die Person-Referenz mit `FOUNDER_ID`. `REPO_URL` als Konstante. `UEBER_LINKS` ist `Record<UeberLinkName, UeberLink>`.
- Externe Links: Projektkonvention ist neuer Tab (`target="_blank"`). Deshalb sichtbares Lucide-Icon (`aria-hidden`) plus sr-only-Hinweis "(öffnet neuen Tab)". `lang` nur am englischen Talk-Titel, Zielsprache per `hreflang`.
- Compact-Footer auf `/explore`: Screenshots bei 768, 1024 und 1280 px (DE/EN, nach `/tmp/footer-*.png`). Die Leiste bricht bei 768 und 1024 px in zwei Zeilen um (37 px in 40 px), nichts wird abgeschnitten. `h-10` trotzdem zu `min-h-10`, damit Textzoom nicht abschneidet.

## Spec Change Log

## Review Triage Log

Reviewer: Blind (8 Funde), Edge (7), VerifGap (3). Die Zuordnung je Fund liegt nur als Patch-Liste vor, daher steht in der Spalte der Reviewer-Block statt Einzelzuordnung.

| Reviewer | Fund | Verdikt | Route |
|----------|------|---------|-------|
| Blind/Edge | AboutPage-`@id` nicht sprachspezifisch, url/about/Breadcrumb nicht durchgehend canonical | Patch | `aboutPageId(origin, urlPath)`, `canonicalOrigin` überall |
| Blind/Edge | Person doppelt voll (Startseite und `/ueber`) | Patch | Organization nur `founderRef()`, volle Person nur in `/ueber`-Graph |
| Blind | DataCatalog-`publisher` ohne `@id` | Patch | `founderRef()` mit `FOUNDER_ID`, `publisherName` entfernt |
| Blind | `ORGANIZATION_SAME_AS[0]` als Repo-URL | Patch | `REPO_URL` |
| Edge | `target="_blank"` ohne Hinweis | Patch | Icon aria-hidden plus sr-only-Hinweis (Konvention: neuer Tab) |
| Edge | `lang` am Link bei deutschem Zieltext | Patch | `lang` nur bei englischem Linktext, sonst `hreflang` |
| Edge | Compact-Footer mit `h-10` könnte umbrechen und abschneiden | Patch | Screenshots 768/1024/1280, `min-h-10` |
| Blind | "Alle Daten" absolut | Patch | "Die Daten stammen aus offenen Quellen" |
| Blind | Tests und Entscheidungen absolut | Patch | "in der Regel", "größere Entscheidungen" |
| VerifGap | Linkmenge nicht gegen `UEBER_LINKS` geprüft, Platzhalter ungeprüft | Patch | Linkmengen-Test je Locale, Messages-Platzhalter-Test |
| VerifGap | Titel und Beschreibung ungeprüft | Patch | Seitentest DE/EN |
| VerifGap | E2E prüft Konstanten gegen sich selbst, keine Graph-Kanten | Patch | E2E prüft Kanten und eindeutige `@id`s |
| Edge | OG-Bild-Existenztest für alle `PAGE_TARGETS` fehlt | Defer | Backlog |
| Edge | `og_image_alt` EN beschreibt das DE-Bild (alle Seiten) | Defer | Backlog |
| Blind | mtc-Logo im Footer heißt im Code "Partner-Logo", Rolle klären | Defer | Rückfrage Matze |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts`, `pnpm check`, `pnpm exec prettier --check .`, `pnpm build`, Preview, E2E (neue Suite + seo-indexierung, uebersichtsseiten, i18n-routing, a11y), `measure-meta` -- expected: grün
