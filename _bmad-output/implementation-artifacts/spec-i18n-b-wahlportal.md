---
title: 'i18n Block B: Wahlportal auf Englisch'
type: 'feature'
created: '2026-09-26'
status: 'in-progress'
baseline_commit: 'e9fbc096cce6d4f72f5b6a2147e53a386e67f06c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_user-input/plan-i18n-de-en-2026-08-22.md'
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-a-infra-routing.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/berlin-wahlen` und `/en/berlin-wahlen/[slug]` zeigen seit Block A deutschen Inhalt mit Disclaimer und sind `noindex`. Alle Portal-Texte (~250 bis 300 Strings in Templates, TS-Buildern und Server-Load) sind fest deutsch, Zahlen fest de-DE, interne Links fallen auf DE zurück.

**Approach:** Alle Portal-Texte in Paraglide-Messages extrahieren und ins Englische übersetzen, Test-Literale im selben Schritt auf Messages umstellen. Zahlen und Daten laufen über zentrale Locale-Formatter, interne Links über `localizedHref`. Danach stehen beide Portal-Routen im Übersetzungs-Register (indexierbar, hreflang, `sitemap-en.xml`). Branch `feat/i18n-en`, Merge erst nach verifiziertem Launch.

## Boundaries & Constraints

**Always:**
- Entscheidungen Matze 26.09.2026: „Kiez“ und „Bezirk“ bleiben im EN-Text deutsch, Planungsraum/Bezirksregion u.a. werden übersetzt; Parteinamen bleiben; Infra N-Locale-fähig.
- Keys snake_case mit Bereichs-Präfix (`wahl_portal_*`, `wahl_detail_*`, `wahl_label_*`); keine Texte als Modul-Konstanten, sondern Auswertung beim Aufruf (Locale über `getLocale()` bzw. explizites `{ locale }` in Buildern).
- Datenschlüssel bleiben unübersetzt: Partei-Kurznamen, Kapitel-IDs/Anker, URL-Query-Werte, Slugs, `data-testid`, `source_name` als API-Feld (Übersetzung nur bei Anzeige).
- `lint:wahl` scannt `messages/de.json` und `messages/en.json`; EN bekommt eigene Forbidden-Tokens (nur auf `en.json`).
- Zahlenformat EN: Punkt als Dezimaltrenner, „%“ ohne Leerzeichen, „pp“ für Prozentpunkte, echtes Minuszeichen bleibt.
- `lang="de"` fest auf Überschriften entfernen, wo EN-Text steht (WCAG 3.1.2); DE-Eigennamen brauchen kein `lang`.
- TDD pro AC; DE-Ausgabe bleibt Zeichen für Zeichen gleich (Tests belegen das).
- Glossar EN (Entscheidung Matze 26.09. 19:24, Variante A mit Behörden-Korrektur): Abgeordnetenhaus → *Berlin House of Representatives (Abgeordnetenhaus)*, kurz *House of Representatives*; Bundestag → *Bundestag*; BVV → *District Assembly (BVV)*; Zweitstimme/Erststimme → *party vote / constituency vote*; Wiederholungswahl → *repeat election*; vorläufig → *provisional*; Bundeswahlleiterin → *Federal Election Commissioner*; Landeswahlleiterin Berlin → *Berlin State Election Commissioner*; Amt für Statistik Berlin-Brandenburg → *Statistics Office Berlin-Brandenburg*. Behörden beim ersten Vorkommen mit deutschem Originalnamen in Klammern.
- Spec ungesplittet (~2000 Tokens), weil erst das Register-Flag am Ende einen konsistenten, indexierbaren Zustand ergibt.

**Never:**
- Keine anderen Seiten übersetzen (Atlas, Kiez, Methodik, Profile: spätere Stories).
- Keine EN-OG-Karten (Block C, ADR-005); `/en`-Portal nutzt die DE-Karte.
- Keine Änderung an API-Feldern, Slugs oder URL-Schema.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DE unverändert | `/berlin-wahlen` | alle Texte und Zahlen wie vor Block B | N/A |
| EN-Portal | `/en/berlin-wahlen` | englische Texte, `28.2%`, `+10.2 pp`, kein Disclaimer, indexierbar, hreflang de/en/x-default | N/A |
| EN-Detail | `/en/berlin-wahlen/2023-bvv` | englischer Titel/Tabellen, Links bleiben unter `/en` | N/A |
| Glossar | EN-Text mit Kiez/Bezirk | „Kiez“, „Bezirk“ unübersetzt | N/A |
| Fehlender EN-Key | Key nur in `de.json` | DE-Fallback, Test schlägt an | Key-Paritäts-Test |
| Datenschlüssel | `?reihe=agh`, `data-testid`, Partei `GRÜNE` | unverändert in beiden Sprachen | N/A |
| Lint | EN-Text „stronghold“ | `lint:wahl` meldet Verstoß | Build-Gate |

</frozen-after-approval>

## Code Map

- Routen: `src/routes/(with-header)/berlin-wahlen/+page.svelte` (~32 Strings, Nav :172-180, Subtexte :186-197, SEO :199-214), `[slug]/+page.svelte` (~25, `lang="de"` :121, Links :113-154/:295/:327), `[slug]/+page.server.ts` (`TYP_LABELS`/`STIMMTYP_LABELS` :43-53, Titel :149-151 → Keys liefern, Label im Client).
- `src/lib/components/wahl-portal/*.svelte` (Inventar ~150 Strings; größte: `trends-kapitel`, `ergebnis-panel` inkl. `DISCLOSURE_TEXT` :174, `small-multiples`, `sankey-wahljahre`, `wechsel-kapitel`, `winner-map`).
- TS-Builder mit Tests: `internal/winner-map-data.ts`, `trends-map-data.ts`, `winner-map-partei-text.ts`, `winner-map-labels.ts`, `ergebnis-panel-data.ts` (`formatDeltaLabel`), `small-multiples-data.ts`, `sankey-interaction.ts`, `winner-map-address.svelte.ts`, `src/lib/data/wahl-gruppe-label.ts`, `src/lib/utils/wahl-portal-url-state.ts` (`REIHE_LABELS`, `EBENE_LABELS`).
- Atlas-Bausteine: `editorial-disclaimer.svelte` (Varianten `wahl-portal-footnote`, `wahl-stimmenanteile`), `data-table-alternative.svelte`, `address-search.svelte`, `wahl-bezirk-choropleth.svelte`, `wahl-stimmbezirk-choropleth.svelte`.
- Formate: `.toFixed(1).replace('.', ',')` an 6 Stellen, `toLocaleString('de-DE')` 2×, `format-berlin-date.ts` → zentrales `src/lib/i18n/format.ts` (Zahl, Prozent, Pp., Datum je Locale); `localeCompare(…, 'de')` bleibt (Sortierung).
- Wahltyp-Labels 4× dupliziert (`[slug]/+page.server.ts`, `alle-wahlen-block.svelte`, `wahl-portal-url-state.ts`, `generate-og-images.ts`) → eine Message-Quelle; OG-Skript bleibt DE.
- `src/lib/server/wahl/source-label.ts` → Anzeige-Label über Message, API-Feld bleibt; „unbekannte Quelle“ 4× → Message.
- Links: alle `resolve('/…')` und rohen `href` im Portal über `localizedHref`.
- `src/lib/seo/translation-register.ts` -- Einträge `/berlin-wahlen` und `/berlin-wahlen/[slug]` (alle Slugs) für `en`.
- `scripts/lint-wahl-editorial.ts`, `scripts/wahlen/lib/wahl-forbidden-tokens.ts` -- `messages/*.json` scannen, EN-Mustergruppe.
- Tests mit DE-Literalen (~130 bis 150): u.a. `tests/e2e/berlin-wahlen.e2e.ts` (26), `ergebnis-panel.svelte.test.ts` (19), `winner-map-partei-text.test.ts`, `trends-map-data.test.ts`; `tests/e2e/i18n-routing.e2e.ts` erwartet für `/en/berlin-wahlen` heute noindex/Disclaimer → anpassen.
- Nicht ändern: Parteinamen, Kapitel-IDs, Query-Werte, Slugs, Test-IDs, API-Felder.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/i18n/format.ts` (+ Test) -- Zahl/Prozent/Pp./Datum je Locale; alle Portal-Formate darauf
- [ ] Glossar als Message-Keys + Wahltyp-/Stimmtyp-/Behörden-Labels an einer Stelle (+ Test)
- [ ] TS-Builder auf Messages (+ Tests auf Messages statt Literale)
- [ ] Portal-Komponenten und Atlas-Bausteine auf Messages (+ Komponententests)
- [ ] Routen `/berlin-wahlen`, `[slug]` inkl. SEO/JSON-LD/Breadcrumb auf Messages, Server-Load liefert Keys
- [ ] Interne Links über `localizedHref`
- [ ] Key-Paritäts-Test `de.json` ↔ `en.json`; `lint:wahl` für beide Dateien
- [ ] Register-Einträge für beide Portal-Routen; `i18n-routing.e2e.ts` und Portal-e2e anpassen, EN-e2e ergänzen
- [ ] Zeitmessung je Phase in Implementation Notes

**Acceptance Criteria:**
- Given `/en/berlin-wahlen` im Build, when die Seite lädt, then enthält der sichtbare Text keine deutschen UI-Wörter außer Glossar-Ausnahmen, Eigennamen und Parteinamen (e2e-Stichprobe je Kapitel), und die Seite ist indexierbar mit hreflang.
- Given `/berlin-wahlen`, when die bestehende Portal-e2e läuft, then ist sie unverändert grün.
- Given die Sitemap, when sie erzeugt wird, then enthält `sitemap-en.xml` die Portal-URLs mit `xhtml:link`-Alternates.

## Implementation Notes

- 26.09. 19:06 Start Planung, 19:06-19:10 Inventur (1 Subagent), 19:24 Glossar entschieden, 19:24 Checkpoint 1 freigegeben (Matze).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm test:unit -- --run` -- expected: grün
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm build`, Preview, `tests/e2e/berlin-wahlen*.e2e.ts`, `i18n-routing.e2e.ts`, `a11y.e2e.ts` -- expected: grün (bis auf bekannte a11y-Fails)

**Manual checks:**
- `/en/berlin-wahlen` und `/en/berlin-wahlen/2023-bvv` durchlesen: Sprache, Zahlen, Links.
