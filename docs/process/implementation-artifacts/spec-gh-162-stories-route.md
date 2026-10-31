---
title: 'gh-162: Data Stories, Route und erster Beitrag'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '1c17851db0dddfa84768a802b78def16b726be18'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/CLAUDE.md', '{project-root}/docs/DESIGN.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Berlin Data Stories (Epic #159) haben noch keinen Ort auf navigator.berlin.

**Approach:** Neue Route `/stories` (EN `/en/stories`) mit Übersicht und Beitragsseite. Beiträge liegen als Markdown in `_content/stories/`, nach dem Muster von `/updates` und getrennt vom Changelog. Dazu kommt der Subdomain-Modus `stories.navigator.berlin` wie bei hitze und kaelte: Die Wurzel rendert `/stories`, die Canonical-URL bleibt die Hauptdomain. Der erste Beitrag stellt kurz vor, was hier entsteht, auf DE und EN. „Data Stories“ steht im Menü und im Footer.

Name „Berlin Data Stories“ und Pfad (beides, Route und Subdomain) hat Matze am 31.10. entschieden. Die Spec-Freigabe gab er pauschal („mach das alles in einem Rutsch“).

## Boundaries & Constraints

**Always:**
- Die Seiten folgen dem navigator-Design (IBM Plex, App-Tokens). Die Handschrift aus `docs/DESIGN.md` gilt nur für Visualisierungen, die es hier noch nicht gibt.
- DE und EN sind vollständig: Texte über Paraglide, Beitrag als `.md` plus `.en.md`.
- Die Seiten stehen im Translation-Register und in der Sitemap. Feeds gibt es keine.
- Prerender wie bei `/updates`.
- Die Seiten haben SEO-Head und JSON-LD (`BlogPosting` oder `Article`, Vorbild `jsonld-blog-posting.ts`).
- Kein „Kunst“-Etikett.
- Text nach den Regeln der Skill `no-ai-slop`: keine erfundenen Termine, keine Versprechen, die noch nicht gebaut sind. Bekannt ist nur, dass die erste Serie „Punkt, Linie, Kiez“ heißen wird.
- Accessibility: eine `h1` pro Seite, die Liste ist eine echte Liste, alle Links haben mindestens 24 px.
- Lokal laufen nur gezielte Tests.

**Never:**
- Keine Visualisierung und kein Startseiten-Teaser. Der Teaser kommt mit #163, weil er Bilder braucht.
- Kein Umbau von `/updates`. Teile darf der neue Code nur nutzen, wenn sie dort unverändert bleiben (z. B. `classifyUpdateFilename`, `renderMarkdownBody`).
- Keine DNS- oder Coolify-Änderung. Die Subdomain schaltet Matze selbst frei.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Übersicht DE | `/stories` | h1, Einleitungssatz, Liste der Beiträge (neueste zuerst) mit Datum und Kurztext | N/A |
| Übersicht EN | `/en/stories` | dasselbe auf EN, Links mit `/en` | N/A |
| Beitrag | `/stories/<slug>` | Titel, Datum, Markdown-Text, Link zurück zur Übersicht | unbekannter Slug: 404 |
| Beitrag ohne EN-Datei | `/en/stories/<slug>` | DE-Text mit `lang="de"`, noindex, Canonical auf DE (wie bei `/updates`) | N/A |
| Subdomain | Host `stories.navigator.berlin`, Pfad `/` | rendert `/stories`, URL bleibt `/`, Canonical zeigt auf `https://navigator.berlin/stories` | N/A |
| Andere Hosts | `navigator.berlin/` | unverändert Startseite | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/updates/+page.server.ts`, `[slug]/+page.server.ts`, `+page.svelte`: Vorbild für Glob, `entries`, `prerender`, Markdown-Rendering. Neue Route `src/routes/(with-header)/stories/` analog.
- `src/lib/content/updates/`: `load-updates.ts` (Parsen, Sortieren), `update-filename.ts` (DE/EN-Paarung, `classifyUpdateFilename`), `frontmatter-schema.ts` (valibot), `localize-update-entry.ts`, `render-markdown.ts` (`renderMarkdownBody`). Neues Modul `src/lib/content/stories/` mit eigenem Frontmatter-Schema: `title`, `title_en`, `summary`, `summary_en`, `date`, optional `series`. Nur Wiederverwendung, keine Änderung an `updates`.
- `_content/stories/2026-10-31-berlin-data-stories.md` und `.en.md`: erster Beitrag, 120 bis 200 Wörter. Inhalt: Die Stories zeigen dieselben offenen Daten wie der Atlas als Bilder mit einer Aussage, je Kiez und Bezirk. Die erste Serie heißt „Punkt, Linie, Kiez“. Alles steht unter MIT-Lizenz, die Quellen nennt jedes Bild.
- `src/lib/seo/translation-register.ts` (~134): Eintrag `/stories` mit `prefix: true` und `except` für Beiträge ohne `.en.md`, nach dem `/updates`-Muster.
- `src/lib/seo/sources/updates.ts` + `sitemap-builder.ts` (`ALL_SOURCES`): eigene Quelle `stories.ts`.
- `src/lib/app-mode.ts`:
  - `AppMode` um `'stories'` erweitern, Präfix `stories.`, `STORIES_ROUTE`, `storiesReroute`.
  - `pageviewPathFor` ergänzen.
  - `resolveExplorerEntry` und `isAppModeValue` prüfen. Der Stories-Modus schaltet keine Layer frei.
- `src/hooks.ts`: `storiesReroute` vor `deLocalizeUrl`.
- `src/lib/seo/canonical.ts:54`: Regex um `stories` erweitern.
- `src/lib/components/atlas/internal/site-menu.ts`: Item `stories` in Gruppe `projekt` vor `updates`, `SiteMenuItemId` erweitern, Label/Beschreibung über die vorhandenen Paraglide-Muster.
- `src/lib/components/atlas/internal/meta-links.ts`: Footer-Link `stories` neben `updates`.
- `messages/de.json`, `messages/en.json`: Texte. DE-Überschrift „Berlin Data Stories“, gleich auf EN.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/content/stories/*` + Tests: Laden, DE/EN-Paarung, Sortierung, Schema-Fehler.
- [x] Route `stories/` (Übersicht, Beitrag) + Komponententests.
- [x] `_content/stories/` erster Beitrag DE/EN.
- [x] SEO: Translation-Register, Sitemap-Quelle, JSON-LD + Tests.
- [x] `app-mode.ts`, `hooks.ts`, `canonical.ts` + Tests (Matrix-Zeilen Subdomain, Andere Hosts).
- [x] Menü und Footer + Tests.
- [x] Messages DE/EN.

**Acceptance Criteria:**
- Given `/stories` und `/en/stories`, when axe-core läuft, then keine Verstöße.
- Given die Design-Prüfung gegen den Dev-Server (DE/EN, 1440 und 390), then keine Befunde zu Regeln 7, 14, 17, 23, 29, 30.
- Given `pnpm check`, then 0 Fehler.

## Implementation Notes

- Loader in `src/lib/content/stories/` nutzt `classifyUpdateFilename` und `renderMarkdownBody`, `updates` unverändert.
- `?mode=stories` ist bewusst kein Override; nur der Host schaltet den Modus. Subdomain-Wurzel `/`, `/en`, `/en/` rendert die Übersicht.
- Abweichung: `llms-builder.ts` und `llms-sitemap-consistency.test.ts` um `/stories` ergänzt, sonst schlug der Konsistenztest fehl.
- OG-Bild vorerst `/og/page/home.png`; eigenes Bild kommt mit #165.

## Spec Change Log

## Review Triage Log

| # | Quelle | Befund | Verdikt | Begründung |
|---|---|---|---|---|
| 1 | alle | `/en/stories`: JSON-LD markiert alle Beiträge als de-DE | medium | Geprüft, Server entfernt `bodyEn`. Patch: `hasEnglishBody` je Eintrag, EN-Tests. |
| 2 | VG | EN-Detail-JSON-LD ungetestet | low | Patch: Assertion. |
| 3 | alle | DE-only-Ausnahme im Translation-Register ungeprüft, Testtitel falsch | low | Patch. |
| 4 | ECH, BH | Subdomain `/en` zeigt EN-Startseite | medium | Patch: `/en`, `/en/` rerouten, Tests. |
| 5 | VG | Stories-Host überspringt Layer-Nachzug im Explorer | low | Direktkorrektur, Patch. |
| 6 | BH | Zwei Links pro Listeneintrag | low | Patch: zweiter Link entfernt. |
| 7 | BH | JSON-LD-Breadcrumb „Berlin“ statt „Start“ | low | Patch. |
| 8 | BH | Menü-Test nach Position | low | Neuer Test per id; alter Test unverändert. |
| 9 | BH | Beitrag: EN-Link ohne `/en`, „auf dieser Seite“ falsch, Versprechen, Lizenz zu breit | medium | Patch: Texte angepasst, Quelllizenzen genannt, `/lizenzen` verlinkt. |
| 10 | ECH | Doppelter Slug mit anderem Datum | low | Gleiches Muster wie `/updates`, unwahrscheinlich, Fix wäre neuer Guard. Abgelehnt. |
| 11 | ECH | Ungültiges Kalenderdatum, Datum ≠ Dateiname | low | Gleiches Muster wie `/updates`. Abgelehnt. |
| 12 | ECH, BH | Sitemap-Quelle schluckt Loader-Fehler | low | Prerender der Übersicht bricht den Build bei Schemafehlern. Abgelehnt. |
| 13 | BH | Abschnittsname doppelt hart codiert | low | Abgelehnt. |
| 14 | BH | OG-Alt passt nicht zum Startseitenbild | low | Eigenes OG-Bild ist #165. Defer. |
| 15 | BH | Spec unvollständig | false | Beim Abschluss gefüllt. |

## Verification

Ergebnis 31.10.: 1284 Tests grün, `pnpm check` 0 Fehler. Design-Prüfung `/stories`, `/en/stories`, Beitrag DE/EN bei 1440 und 390: axe 0 Verstöße, keine AI-Look-Indizien, keine Zeile über 90 Zeichen, nur der versteckte Skip-Link unter 24 px.

**Commands:**
- `pnpm vitest run src/lib/content/stories src/lib/app-mode src/hooks src/lib/seo src/lib/components/atlas/internal "src/routes/(with-header)/stories"` -- expected: grün
- `pnpm check` -- expected: 0 Fehler

**Manual checks (if no CLI):**
- Dev-Server `/stories`, `/en/stories`, Beitragsseite; Skill `design-pruefung`.
