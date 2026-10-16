---
title: 'Kälte-Navigator: Route, Subdomain und Notfall-Block (#58, #59)'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: '3c8142af2889c4721935977a2991ba9f97d13665'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Für den Winter fehlt ein Gegenstück zum Hitze-Navigator. Wer in Berlin jemanden in der Kälte sieht, findet Hilfenummern verstreut auf mehreren Seiten (Epic #57).

**Approach:** Neue Seite `/kaelte` (DE/EN) mit Subdomain `kaelte.navigator.berlin` nach dem Muster von `/hitze`. Kern ist ein Notfall-Block „Du siehst jemanden in der Kälte?“, der je nach Uhrzeit in Berliner Zeit die gerade erreichbaren Dienste hervorhebt. Platzhalter-Bereiche für Warnbanner (#60) und warme Orte (#61, #62) sind vorgesehen, aber noch leer.

**Entscheidungen (Matze 16.10.2026):**
- Sichtbarkeit bis zum Launch #63: `/kaelte` ist per Link erreichbar, aber `noindex`, ohne Footer-Link, nicht in Sitemap und `llms.txt`. Translation-Register-Eintrag für EN ja (Seite existiert DE/EN).
- Kältebus Stadtmission: anzeigen mit Stand-Datum; Betrieb 2026/27 vor dem 1.11. erneut prüfen (Recurring/Board-Termin).
- Nummern: Kern (112, Kältehilfetelefon, Kältebus, Wärmebus) plus KARUNA Sub und Hilfe-Hotline für obdachlose Menschen (werktags tagsüber). Jede Nummer zusätzlich gegen eine zweite unabhängige Quelle prüfen; nur zweitbelegte Nummern übernehmen.

## Boundaries & Constraints

**Always:**
- Nummern und Zeiten ausschließlich aus geprüften Quellen (Stand 16.10.2026): Kältehilfetelefon 030 34397140 (täglich 19 bis 23 Uhr, 1.10. bis 30.4., GEBEWO pro, Quelle berlin.de/kaeltehilfe), Kältebus Berliner Stadtmission 030 690333690 (täglich 20 bis 2 Uhr, 1.11. bis 31.3.), DRK-Wärmebus 030 6003001010 (täglich 18 bis 24 Uhr, 1.11. bis 31.3.), Notruf 112 bei hilfloser oder nicht ansprechbarer Person. Jede Angabe mit Quelle und sichtbarem Stand-Datum, zentral in einer typisierten Datei.
- Handlungsfolge laut berlin.de: Person höflich ansprechen und fragen, ob sie Hilfe möchte; nicht ansprechbar oder in Gefahr: 112.
- Haftungshinweis: Angaben ohne Gewähr, im Zweifel 112. Verweis auf Kältehilfe-App und Wegweiser (Links von berlin.de).
- Keine Bettenzahlen, keine Liste von Notübernachtungen.
- `tel:`-Links mit sichtbarer Nummer, barrierefrei (WCAG 2.2 AA), DE und EN von Hand, keine em-dashes, Tests zuerst.
- Canonical immer auf navigator.berlin, Subdomain-Root wird auf `/kaelte` umgeschrieben (wie `hitzeReroute`).

**Never:**
- Keine Änderung an `/hitze`, `mode=hitze`-Logik oder dem Explorer.
- Keine Daten von kaeltehilfe-berlin.de oder netzwerkderwaerme.de importieren.
- Keine DWD-Anbindung (#60) und keine warmen Orte (#61, #62) in dieser Story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Abends im November | 16.11., 21:30 Berliner Zeit | Kältehilfetelefon, Kältebus, Wärmebus als „jetzt erreichbar“ | N/A |
| Nachts | 1:30 im Dezember | nur Kältebus „jetzt erreichbar“, Rest mit nächster Zeit | N/A |
| Tagsüber | 14:00 | kein Dienst erreichbar, alle mit Zeiten, 112 immer sichtbar | N/A |
| Oktober / April | 15.10., 20:00 | Kältehilfetelefon erreichbar, Busse als „ab 1. November“ | N/A |
| Außerhalb Saison | Juni | Hinweis „Kältehilfe-Saison Oktober bis April“, 112 bleibt | N/A |
| Zeitzone | Client in anderer Zeitzone | Berechnung in Europe/Berlin | N/A |
| Subdomain | `kaelte.navigator.berlin/` | rendert `/kaelte`, Canonical `https://navigator.berlin/kaelte` | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/app-mode.ts` (Z. 6-40) + Test -- `AppMode` um `'kaelte'`, `KAELTE_HOST_PREFIX`, `kaelteReroute` analog `hitzeReroute`; Override `?mode=` bleibt nur `hitze`/`default`.
- `src/hooks.ts` (Z. 7) -- `kaelteReroute` vor `deLocalizeUrl` ergänzen.
- `src/lib/seo/canonical.ts:54` + Test -- `canonicalOrigin` strippt `(hitze|kaelte)\.`.
- `src/routes/+layout.svelte:50-56` -- Plausible-Pageview: Subdomain-Root auf `/kaelte` mappen.
- `src/routes/(with-header)/hitze/+page.svelte` + `page.svelte.test.ts` -- Vorlage: logischer `pathname`, Canonical über `canonicalOrigin` + `localizedPathname`, SeoHead, Breadcrumb-JSON-LD, Testmuster (Canonical, hreflang, em-dash, EN).
- `src/routes/(with-header)/ueber/+page.svelte:93-106`, `ueber-links.ts` -- Muster für externe Links mit sr-only-Hinweis „öffnet neuen Tab“.
- `src/lib/components/kuehle-orte/dwd-hitzewarn-banner.svelte` -- Optik-Muster für Hinweisbox.
- `src/lib/seo/translation-register.ts:121`, `sitemap-builder.ts:154`, `llms-builder.ts:130`, `scripts/generate-og-images.ts` (~Z. 140), `src/lib/components/atlas/internal/meta-links.ts` -- Registrierungen; jetzt nur Translation-Register und OG-Bild, Rest mit #63.
- Kein Berlin-Zeit-Helfer im Frontend vorhanden (`seasonality.ts` rechnet UTC, nur Saison).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/kaelte/hilfe-dienste.ts` + Test -- typisierte Dienste (Name, Nummer, Zeiten, Saison, Quelle, Stand) -- eine Quelle der Wahrheit.
- [x] `src/lib/utils/berlin-time.ts` + Test -- aktuelle Stunde/Datum in Europe/Berlin, „erreichbar jetzt“, „nächste Zeit“, Saison -- Logik testbar ohne UI.
- [x] `src/lib/components/kaelte/notfall-block.svelte` + Test -- Handlungsfolge, Dienste mit Status, `tel:`-Links, Stand, Haftung, Links App/Wegweiser.
- [x] `src/lib/app-mode.ts`, `src/hooks.ts`, `src/lib/seo/canonical.ts`, `src/routes/+layout.svelte` + Tests -- Subdomain-Modus.
- [x] `src/routes/(with-header)/kaelte/+page.svelte` (+ ggf. `+page.ts`) + Test -- Seite mit Header, Notfall-Block, leeren Platzhaltern für #60/#61.
- [x] Messages DE/EN, Translation-Register (EN), `noindex` per SeoHead, OG-Bild in `scripts/generate-og-images.ts`; keine Sitemap-, llms- oder Footer-Einträge bis #63.
- [x] `tests/e2e/kaelte.e2e.ts` -- DE/EN 200, Notfall-Block, `tel:`-Links, Canonical, axe.

**Acceptance Criteria:**
- Given eine Person auf `/kaelte` mit dem Smartphone, when sie den Notfall-Block liest, then sieht sie ohne Scrollen 112 und den gerade erreichbaren Dienst und kann ihn mit einem Tipp anrufen.
- Given ein Screenreader, when er den Notfall-Block vorliest, then sind Reihenfolge, Linkziele und Erreichbarkeit verständlich.

## Implementation Notes

**Geprüfte Dienste (Zweitbeleg-Prüfung 16.10.2026, maßgeblich für `hilfe-dienste.ts`):**
- Kältehilfetelefon (GEBEWO pro): 030 34397140, täglich 19 bis 23 Uhr, 1.10. bis 30.4. Quellen: https://www.berlin.de/kaeltehilfe/ , https://gebewo.berlin/
- Kältebus Berliner Stadtmission: 030 690333690, täglich 20 bis 2 Uhr (über Mitternacht), 1.11. bis 31.3. Quellen: berlin.de/kaeltehilfe, https://www.berliner-stadtmission.de/kaeltebus . Betrieb 2026/27 nicht bestätigt (Brandanschläge 2025/26): mit Stand-Datum zeigen, vor 1.11. neu prüfen.
- DRK-Wärmebus: 030 6003001010, täglich 18 bis 24 Uhr, 1.11. bis 31.3. Quellen: berlin.de/kaeltehilfe, https://www.drk-berlin.de/start/ehrenamt/waermebus
- KARUNA Hilfe-Hotline und Sub für obdachlose Menschen: 0157 80597870, Mo bis Fr 9 bis 16 Uhr (Quellen nennen 16 bzw. 17 Uhr; vorsichtig 16 Uhr), ganzjährig. Quellen: https://www.kaeltehilfe-berlin.de , Pressemitteilung Bezirksamt Charlottenburg-Wilmersdorf (berlin.de).
- Notruf 112 (bei hilfloser oder nicht ansprechbarer Person), immer sichtbar.
- NICHT übernehmen: KARUNA Sub 0157 86605080 (nur auf berlin.de, kein Zweitbeleg).
- Links: Kältehilfe-App https://www.kaeltehilfe-berlin.de/kaeltehilfe-app , Wegweiser https://www.kaeltehilfe-berlin.de/wegweiser

## Spec Change Log

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Unbestätigter Kältebus erscheint grün und oben als „Jetzt erreichbar“ | medium | patch | `notfall-block.svelte` sortiert und färbt nur nach `state`, `betriebUnbestaetigt` ändert nur einen `text-xs`-Hinweis. |
| 2 | Handlungsfolge ohne Schritt „Person möchte Hilfe“ | low | patch | `<ol>` hat 2 Punkte, Bezug zu den Nummern fehlt. Direkte Textergänzung. |
| 3 | Beschreibungen sagen nicht, wofür man anruft | low | patch | Messages `kaelte_beschreibung_*` nennen nur den Träger. |
| 4 | „Winter 2026/27“ fest im Hinweistext | medium | patch | `kaelte_unbestaetigt` DE/EN, veraltet zur nächsten Saison. |
| 5 | AC 1 „erreichbarer Dienst ohne Scrollen“ ungetestet, E2E ohne feste Uhrzeit, Axe sieht nie den Open-Zustand | medium | patch | `kaelte.e2e.ts` prüft nur `kaelte-112-link`, kein `page.clock`. |
| 6 | Plausible-Mapping der Subdomain-Wurzel ungetestet | low | patch | `+layout.svelte:56-58`, kein Test. |
| 7 | `reroute` in `hooks.ts` ungetestet | low | patch | Kein Test importiert `src/hooks.ts`. |
| 8 | Minütliche Aktualisierung ungetestet | low | patch | Alle Komponententests übergeben `now`. |
| 9 | Sitemap-Test prüft nur den Index | low | patch | `/sitemap.xml` ist Index, Einträge stehen in `sitemap-de.xml`/`sitemap-en.xml`. |
| 10 | Dienstnamen im EN-Locale deutsch | low | patch | `name` in `hilfe-dienste.ts` fließt in Anzeige und `aria-label`. |
| 11 | `isKaelteMode` ungenutzt | low | patch | Nur Definition und Test, kein Aufrufer. Löschen. |
| 12 | Überschrift „Hilfe der Kältehilfe anrufen“ doppelt | low | patch | Direkte Textkorrektur. |
| 13 | KARUNA an Feiertagen „Jetzt erreichbar“ | low | defer | Real an rund 10 Tagen im Jahr, Fix braucht Feiertagsberechnung. |
| 14 | CI führt client-Tests und E2E nicht aus | medium | defer | Bestehende Repo-Konvention (`ci.yml`), betrifft auch `/hitze`. |
| 15 | `kaelte.navigator.berlin/en` zeigt EN-Startseite | low | defer | `kaelteReroute` greift nur bei `/`, gleiches Muster wie Hitze. |
| 16 | Zweitquelle KARUNA ohne URL und Datum | low | defer | Quelle steht so in der Spec, URL nachrecherchieren mit planning#9. |
| 17 | Interval-Drift bis 60 s, kein `visibilitychange` | low | reject | Abweichung höchstens eine Minute, Fix fügt Logik hinzu. |
| 18 | Fallback „Ab 1. Januar“ bei `weekdays: []` | false | reject | Kein Datensatz hat leere `weekdays`, Zustand nicht erreichbar. |
| 19 | DNS/Traefik fehlt im Diff | false | reject | Infra liegt außerhalb des Repos, macht Matze nach dem Merge. |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check` und `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build` (Port 4173 vorher frei), Preview, E2E `kaelte seo-indexierung i18n-routing a11y` -- expected: grün außer bekanntem a11y „Escape löscht Selection“
