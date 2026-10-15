---
title: 'S7: Übersichtsseiten für Kieze, Bezirke und Daten'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'f2d1b1a7a5558df568fa299fa8f677da8a2cb5ce'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/seo-audit-2026-10-15.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Es gibt keine Übersicht aller Kieze, aller Bezirke oder aller Datenebenen. Der Breadcrumb „Daten“ auf Layer-Seiten zeigt auf `/explore`, eine Karte ohne Liste. Suchmaschinen und Menschen erreichen die 143 Kiez-, 12 Bezirks- und 58 Layer-Seiten nur über Umwege (Ranking-Tabelle, Startseite).

**Approach:** Drei schlanke, prerenderte Übersichtsseiten mit Einleitung und Linklisten: `/kieze` (nach Bezirk gruppiert, mit Kiez-Score), `/bezirke` (mit Einwohnerzahl und Score), `/daten` (Layer nach Themengruppe mit Kurztext). Verlinkt im Footer, in Sitemap, `llms.txt` und als Breadcrumb-Ziel „Daten“.

**Entscheidungen (Empfehlung, Freigabe Matze 15.10. für den Epic):**
- Pfade `/kieze`, `/bezirke`, `/daten` (DE und `/en/…`).
- Scores DB-frei aus `static/kiez-scores/region-composites.json`, Namen aus GeoJSON (`readRegionDisplayNames`); ohne Score kein Wert, Eintrag bleibt.
- Footer-Gruppe „Erkunden“ bekommt die drei Links am Ende (Reihenfolge der bestehenden Links bleibt).
- Layer-Breadcrumb „Daten“ (sichtbar und JSON-LD) zeigt auf `/daten`.
- Keine Karte auf den Übersichtsseiten.

## Boundaries & Constraints

**Always:** `SeoHead` mit Title-Builder aus S6, Beschreibung 70-160 Zeichen, BreadcrumbList über `localizedPathname`. Barrierefrei: Überschriftenhierarchie, Listen als `<ul>`, Links mit sprechendem Text. DE/EN, Übersetzungsregister-Einträge für die neuen Pfade. Prerender. Tests zuerst.

**Never:** Keine Änderung an Kiez-/Bezirks-/Layer-Detailseiten außer dem Layer-Breadcrumb-Ziel. Bestehende Footer-Links und deren Reihenfolge bleiben. Ranking-Seite unverändert.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kieze | `/kieze` | 143 Links, gruppiert nach 12 Bezirken, mit Score | N/A |
| Bezirke | `/bezirke` | 12 Links mit Einwohnerzahl und Score | N/A |
| Daten | `/daten` | alle Layer mit Detailseite, nach Themengruppe, Kurztext | N/A |
| EN | `/en/kieze` | EN-Texte, Links mit `/en` | N/A |
| Ohne Scores | Composite-Datei fehlt | Listen ohne Score, keine Fehler | N/A |
| Sitemap/llms | Build | alle drei Seiten in Sitemap DE/EN und `llms.txt` | Konsistenztest grün |

</frozen-after-approval>

## Code Map

- Neu `src/routes/(with-header)/{kieze,bezirke,daten}/+page.server.ts` + `+page.svelte` (`prerender = true`).
- Daten: `src/lib/data/region-display-names.ts:78` (`readRegionDisplayNames`), `src/lib/seo/sources/kiez-slugs.ts:14`, `bezirk-slugs.ts:13`, `static/kiez-scores/region-composites.json` (Lesemuster `src/lib/server/profile/meta-sources.ts`), Bezirks-Einwohner aus Profilen; Layer: `loadManifest`, `hasLayerDetailPage` (`src/lib/data/layer-visibility.ts`), `BUNDLE_ORDER`/`bundleLabel` (`layer-palette-filter.ts`), `getLayerDisplayName`, `explainLayer`.
- Footer: `src/lib/components/atlas/internal/meta-links.ts` (`META_LINK_IDS` 23, `META_LINKS` 51, Gruppe `erkunden` 66-72, `metaLinkLabel` 94) + Test, Messages `shell_meta_link_*`.
- Sitemap: `STATIC_PAGES_SOURCE` in `src/lib/seo/sitemap-builder.ts:135-160`; `llms-builder.ts` (Muster 138, 186; `section` 77); `llms-sitemap-consistency.test.ts:63`.
- Register: `src/lib/seo/translation-register.ts:109-124`.
- Layer-Breadcrumb: `src/routes/(with-header)/layer/[slug]/+page.svelte:118-130`.

## Tasks & Acceptance

**Execution:**
- [x] Reine Lade-/Gruppierfunktionen + Tests (Kieze nach Bezirk, Layer nach Gruppe).
- [x] Drei Routen + Komponententests (DE/EN, ohne Scores).
- [x] Footer, Sitemap, llms, Register + Tests.
- [x] Layer-Breadcrumb auf `/daten`.
- [x] E2E: drei Seiten erreichbar, Linkanzahl, Footer-Links.

**Acceptance Criteria:**
- Given `/kieze`, when man die Seite liest, then verlinkt sie alle 143 Kiez-Seiten gruppiert nach Bezirk.

## Implementation Notes

- Neue reine Funktionen: `buildRegionOverview` (`src/lib/data/region-overview.ts`, Kieze nach Bezirk, alphabetisch, Score gerundet) und `groupLayersForOverview` (`src/lib/data/layer-overview.ts`, Themengruppen aus `BUNDLE_ORDER`, Labels über `themeLabel` aus S6). Lader `loadRegionOverview` und `readRegionComposites` liegen unter `src/lib/server/profile/`. Fehlt die Composite-Datei, bleiben die Listen vollständig ohne Score.
- Anti-Stigma (ADR-015): Sortierung alphabetisch, kein Rang, kein Score-Ranking. Score steht als Zahl, Screenreader lesen "Kiez-Score 51 von 100" bzw. "ohne Score" (vorhandene Messages der Bezirksliste).
- `/bezirke` zeigt Einwohnerzahl (Demografie-Payload, mit Stichtag) und Bezirks-Score als `dl` mit sichtbaren Labels. Fehlt ein Wert, entfällt nur dieser Eintrag.
- Register: drei exakte Einträge ohne `prefix`, damit `/daten/<datei>` (Download-Redirect aus S4) unübersetzt bleibt. `/daten` und `/en/daten/<datei>` verhalten sich wie vorher (302).
- Footer: Gruppe "Erkunden" endet mit `kieze`, `bezirke`, `daten`. Die flache Kompaktliste (`META_LINKS`, /explore) bleibt unverändert.
- Layer-Breadcrumb: nur das JSON-LD zeigt auf `/daten`. Die Layer-Seite hat keine sichtbare Brotkrumen-Navigation, die Detailseite blieb sonst unberührt.
- Open Graph: alle drei Seiten nutzen `/og/page/home.png`, eigene Bilder gehören nicht zum Umfang.
- Review-Patches: `buildRegionOverview` liefert `{ bezirke, problems }` (Kiez ohne Bezirk, leerer oder doppelter Slug, fehlende Scores bei vorhandener Composite-Datei, fehlende Einwohner auf `/bezirke`). `reportOverviewProblems` warnt lokal und wirft im Strict-Build (`isStrictBuild`). Layer mit Detailseite außerhalb von `BUNDLE_ORDER` melden `/daten` ebenso (Entscheidung: melden statt Restgruppe, weil `validateManifest` unbekannte Gruppen ohnehin ablehnt). Einwohner lädt nur `/bezirke`. Ohne Composite-Datei bleibt es bei der Warnung ohne Abbruch.
- Breadcrumb "Daten-Layer" heißt wie H1 und Footer (Key `overview_daten_breadcrumb`, ersetzt `layer_page_breadcrumb_daten`).
- Bekannt flaky ohne Bezug zu S7: `winner-map.svelte.test.ts` (einzeln grün), `a11y.e2e.ts` "Escape löscht Selection" und "SkipLink springt zu main" (Karte auf `/explore`, wechselnd rot/grün).

## Spec Change Log

- 2026-10-15 (Review S7): Die Layer-Seite hat keinen sichtbaren Breadcrumb. Geändert ist nur das Ziel und der Name im JSON-LD (`/daten`, "Daten-Layer"). Das hält die Grenze "keine Änderung an Detailseiten außer dem Breadcrumb-Ziel" ein. Ein sichtbarer Breadcrumb auf der Layer-Seite bleibt außerhalb von S7.

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge | Zahlen 143/12 in `llms.txt` hart codiert | medium | patch |
| Blind | Heading-IDs auf `/daten` aus Anfangsbuchstaben, Duplikate möglich | medium | patch |
| Blind, Edge | Kieze ohne zuordenbaren Bezirk, doppelte/leere Slugs fallen still weg | medium | patch (Befunde, Strict-Build bricht ab) |
| Edge | Composites/Einwohner unvollständig, Build bleibt grün | medium | patch |
| VerifGap | `/daten` nur „≥ 50“ statt exakter Layer-Menge | medium | patch |
| VerifGap | Zuordnung Kiez → Bezirk nur mit Fixture | medium | patch |
| VerifGap | E2E nur manuell | medium | reject: kein CI im Repo, E2E läuft je Story manuell gegen Preview |
| Blind | Zwei Wege zum Manifest, Typ doppelt | low | patch |
| Blind | Breadcrumb „Daten“ vs. H1 „Daten-Layer“ | low | patch |
| Blind | Sichtbarer Layer-Breadcrumb | low | reject: Layer-Seite hat keinen sichtbaren Breadcrumb (Spec Change Log) |
| Blind, Edge | Plural „1 Kieze“, leere Gruppen | low | patch |
| Blind | en-dash als Platzhalter, Trenner im Lesefluss | low | patch |
| Edge | Einwohner-Fetch auch auf `/kieze` | low | patch |
| Edge | Layer ohne EN-Message | low | patch (Test) |
| VerifGap | `/en/daten/<datei>`, Sprunglinks, EN-Längen, Footer EN, Drawer ungetestet | low | patch |
| Edge | Kiez-Hero (DB) und `/kieze` (Composite-JSON) können abweichen | low | reject: gleiche Quelle im Prod-Build, nur bei lokalem Build ohne DB |

## Verification

**Commands:**
- `pnpm exec vitest run src` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat (Log ohne Fehler), Preview 4173, Playwright mit temporärer Config; `static/kiez-scores/region-composites.json` zurücksetzen -- expected: grün
