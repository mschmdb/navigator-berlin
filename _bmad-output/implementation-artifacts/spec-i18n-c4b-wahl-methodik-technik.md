---
title: 'i18n Block C4b: Wahl-Methodik, Architektur, WebMCP und Score-Rangliste auf Englisch'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: 'b649e9502426759ca902efc65991fb6a3721b517'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c4a-methodik-kern.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/methodik/wahldaten`, `/en/architektur`, `/en/webmcp` und `/en/umwelt-infrastruktur-score` zeigen deutschen Inhalt mit Fallback-Banner und `noindex`. Texte stehen hart im Markup, H1 teils mit `lang="de"`, interne Links führen aus `/en` heraus.

**Approach:** Wie C4a: Wir übernehmen die abgenommene Übersetzung aus `c4b-uebersetzung.json` als Paraglide-Messages. Die Seiten lesen die Messages in der Seiten-Locale, interne Seiten-Links laufen über `localizedHref`. Danach kommen die vier Routen als exakte Einträge ins `TRANSLATION_REGISTER`.

## Boundaries & Constraints

**Always:**
- Übersetzung: `_bmad-output/implementation-artifacts/c4b-uebersetzung.json` (DE wörtlich, EN abgenommen), Entscheidungen in `c4b-uebersetzung-review.md`.
- DE-Ausgabe Zeichen für Zeichen gleich, gepinnt per DE-Text-Snapshot je Seite (Muster C4a). Kein Test liest `_bmad-output/`.
- Links auf maschinenlesbare Dateien (`/llms.txt`, `/llms-full.txt`, `/webmcp-manifest.json`, `/.well-known/webmcp.json`) bleiben unlokalisiert.
- WebMCP-Tool-Namen, Tool-Beschreibungen und Manifest bleiben DE (Boundary C1/C2). Nur sichtbarer Seitentext wird übersetzt.
- Wahl-Begriffe wie im Wahlportal (`messages/en.json`). „vorläufig“ bleibt als Message, damit der Endergebnis-Re-Ingest DE und EN gemeinsam ändert.
- Rich-Text über `src/lib/i18n/rich-text.ts` (C4a), Zahlen über `$lib/i18n/format.ts`, JSON-LD in der Seiten-Locale.
- Register: vier exakte Einträge. Grep-Audit vorher, `lang="de"` nur an echten DE-Resten.
- TDD pro AC.

- Entscheidung Matze 30.09. 09:12: DE-Fehler mitkorrigieren, maßgeblich ist die DE-Spalte in `c4b-uebersetzung.json` (Tool-Anzahl elf inkl. Finder-Tools, 14 Wahlen, zwei Umbruchreste). Browser-Support-Aussagen auf `/webmcp` bleiben vorerst wörtlich, die Korrektur folgt separat nach Recherche.

**Never:**
- Keine weitere DE-Textänderung.
- Kein `sitemap-en.xml`-Eintrag. OG-Bilder bleiben DE.
- `/lizenzen`, `/hitze`, `/kuehle-orte` (C4c) und `/updates` (C4d) bleiben unberührt.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Wahldaten EN | `/en/methodik/wahldaten` | englisch, „provisional“ an denselben Stellen wie „vorläufig“, kein Banner | N/A |
| Architektur EN | `/en/architektur` | englisch, H1 ohne `lang="de"`, `/llms.txt`-Links unverändert | N/A |
| WebMCP EN | `/en/webmcp` | Seitentext englisch, Tool-Namen unverändert | N/A |
| Score EN | `/en/umwelt-infrastruktur-score` | Rahmen englisch, Rangliste mit Kiez-Namen, Link auf `/en/methodik/kiez-score` | N/A |
| DE unverändert | DE-Routen | Texte identisch | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/methodik/wahldaten/+page.svelte` (307 Z.) -- Breadcrumb-Links `:36`, `:38`, `lang="de"` `:42`, „vorläufig“ `:134-265`, Links `:293`, `:302`. Test `page.svelte.test.ts`.
- `src/routes/(with-header)/architektur/+page.svelte` (180 Z.) -- `lang="de"` H1 `:29`, Links `/methodik` `:121`, `/lizenzen` `:122`, `/webmcp` `:166`; Datei-Links `:150-155` bleiben.
- `src/routes/(with-header)/webmcp/+page.svelte` (322 Z.) -- `lang="de"` H1 `:30`, Datei-Links `:155`, `:270-283` bleiben. `src/lib/components/webmcp-diagnose.svelte` (+ Test) sichtbarer Text.
- `src/routes/(with-header)/umwelt-infrastruktur-score/+page.svelte` (121 Z., Link `:107`) und `+page.server.ts` (Rangliste aus DB).
- `src/lib/seo/translation-register.ts` + Test -- vier exakte Einträge.
- e2e: `tests/e2e/i18n-routing.e2e.ts` (~`:794-845`) und `seo-head.svelte.test.ts` (`:82`, `:162`) nutzen `/methodik/wahldaten` als nicht übersetzte Kontrollseite. Auf `/impressum` umstellen (bleibt dauerhaft DE, Entscheidung Matze 30.09.). `i18n-routing.e2e.ts:459`, `:550` prüfen nur Link-Ziele, bleiben.
- Muster aus C4a wiederverwenden: `rich-text.svelte`, `methodik-test-utils.ts` (`textLines`, `internalHrefs`), `tests/e2e/i18n-methodik.e2e.ts` (neue Seiten dort ergänzen oder `i18n-c4b.e2e.ts`).

## Tasks & Acceptance

**Execution:**
- [x] Messages aus `c4b-uebersetzung.json`, DE-Snapshots vor der Umstellung
- [x] `/methodik/wahldaten` (+ Tests)
- [x] `/architektur`, `/webmcp`, `webmcp-diagnose` (+ Tests)
- [x] `/umwelt-infrastruktur-score` (+ Tests)
- [x] Grep-Audit, Register, Kontrollseite auf `/impressum` (+ Tests)
- [x] e2e: vier Seiten EN ohne Banner, indexierbar, Seiten-Links unter `/en`, Datei-Links unverändert, axe
- [x] `docs/wahldaten-methodik.md` Re-Ingest-Checkliste: EN-Message für „vorläufig“ ergänzen
- [x] Zeitmessung

**Acceptance Criteria:**
- Given die vier `/en`-Routen im Build, when sie laden, then fehlen Banner und `noindex`, Seiten-Links beginnen mit `/en`, und der Grep-Audit findet keinen DE-Text außerhalb von Eigennamen, Glossar und Tool-Namen.
- Given die DE-Routen, when sie laden, then ist der sichtbare Text identisch zum Stand vor C4b.

## Implementation Notes

- 30.09. Übersetzung 08:55-08:59, Spec 08:56, Abnahme Matze 09:12 (DE-Fehler mitkorrigieren), Umsetzung 09:12-09:24 (12 min, mit Sub-Subagenten), Review 09:24-09:28, Patches 09:28-09:31, Verifikation 09:31-09:45.
- 146 Messages (`methodik_wahldaten_*`, `architektur_*`, `webmcp_*`, `webmcp_diagnose_*`, `uis_*`, `uis_ranking_*`). Neue Utility `score-ranking-i18n.ts` mit Test.
- DE-Korrekturen: Tool-Anzahl elf inkl. Finder-Tools, 14 Wahlen, Umbruchreste („Original-Wahl“, „Editorial-Richtlinien“, „Flag-Mechanik“, „Wahlbezirks-Polygone“, „WebMCP-Tools“, „Bürger-Daten-Plattform“), „auch ein schreibendes“ Tool, englische Krücke in der Diagnose-Box entfernt.
- Browser-Support `/webmcp` nach Recherche 30.09. ersetzt (Chrome Origin Trial 149, Edge 150, Mozilla „neutral“, WebKit „oppose“, je mit Quelle, „Stand September 2026“). Noch nicht von Matze gesehen.
- JSON-LD: Breadcrumb-Wurzel und UIS-ItemList lokalisiert, auch auf den C4a-Seiten. DE-Breadcrumb-Name der Rangliste jetzt „Umwelt- & Infrastruktur-Score“ statt „Ranking“ (unsichtbar).
- A11y: TOC-Links auf `/methodik/wahldaten` mit `inline-block py-1` (axe target-size), wirkt auch in DE.
- Kontrollseite „nicht übersetzt“: `/impressum`.
- Qualität: 28 Review-Funde in 17 Einträgen, 11 gepatcht, 6 rejected.

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 09:28), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 10, Verification Gap (VG) 2 + 2. P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | VG/BH/EC | DE-Parität lückenhaft (`li` mit Links, `aside`, `button`, Meta), Snapshots pinnen Endstand | medium | `textLines` überspringt diese Knoten | P: explizite DE-Assertions mit Baseline-Wortlaut |
| 2 | BH/EC | weitere Umbruchreste, „Editorial-Richtlinien“ undeklariert korrigiert | low | gleiche Kategorie wie die abgenommenen Korrekturen, Matze-Linie „DE-Fehler mitkorrigieren“ | P: alle Umbruchreste |
| 3 | BH | Browser-Support veraltet, mit C4b indexierbar | medium | Recherche 30.09. (Chrome/Edge Origin Trial 149/150, Mozilla neutral, WebKit oppose) | P: DE+EN mit Quellen |
| 4 | BH | „auch schreibende“ / „some of them also write“, es gibt ein schreibendes Tool | low | Manifest: nur `set_finder_weights` schreibt | P |
| 5 | BH | `webmcp_diagnose_intro_p1`: „English: …“ ohne `lang`, EN doppelt | low | WCAG 3.1.2 | P |
| 6 | BH/EC | JSON-LD uneinheitlich: Breadcrumb-Wurzel, UIS-ItemList, Name „Ranking“ | medium | EN-Structured-Data zeigt auf DE-URLs | P: einheitlich lokalisiert (inkl. C4a-Seiten) |
| 7 | BH/EC | tautologischer Datei-Link-Check im e2e | low | Unit-Tests decken es ab | P |
| 8 | BH | `score-ranking-i18n.ts` ohne Unit-Test | low | globale Regel | P |
| 9 | EC | Rich-Text-Link-Map `?? ''`, `quellen_p1` verlinkt jeden Tag auf `/lizenzen` | low | Fix trivial | P |
| 10 | BH | `architektur_ki_p3` EN holprig | low | | P |
| 11 | BH | Re-Ingest-Checkliste nennt die betroffenen Tests nicht | low | BVV-Endergebnis ab heute | P |
| 12 | BH | Daten hart in `methodik_wahldaten_cadence_p2` | low | redaktioneller Text, keine Messwerte | R |
| 13 | BH | Tests verbieten `lang="de"` für zitierte Stimmbezirk-Namen | low | Eigennamen-Zitat | R |
| 14 | BH | `/en/architektur` verlinkt auf nicht registrierte `/en/lizenzen` | low | Linie C4a: Links unter `/en`, Banner erklärt | R |
| 15 | BH | gemischte Anführungszeichen „…" im DE | low | durchgängige Repo-Konvention | R |
| 16 | EC | Tool-Beschreibungen auf `/en/webmcp` EN, im Agent-Manifest DE | low | Boundary betrifft registrierte Tools, Seite ist Doku | R |
| 17 | BH | Spec ohne Notes/Zeitmessung | low | folgt in Step 5 | R |

## Design Notes

- Kontrollseite: `/impressum` und `/datenschutz` bleiben laut Entscheidung Matze (30.09. 07:36) dauerhaft deutsch und eignen sich deshalb als stabile „nicht übersetzt“-Kontrolle.
- e2e-Links erst nach `await expect(links.nth(n)).toBeAttached()` lesen (C4a-Flake unter Parallel-Last).

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 5137/5138, `winner-map`-Flake isoliert grün
- `pnpm check` -- expected: 0 Fehler -- **grün**
- `pnpm lint:wahl`, `pnpm lint:cleartext` -- expected: 0 Verstöße -- **grün**
- `pnpm build` + e2e `i18n-*`, `methodik-flow` -- expected: grün (Port 4173 belegt: temporäre Config auf freiem Port, danach löschen; `static/kiez-scores/region-composites.json` nach dem Build zurücksetzen) -- **grün**: Build 0 Fehler, e2e 146/146 (2 Läufe)
