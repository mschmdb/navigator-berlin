---
title: 'i18n Block C4d: Updates auf Englisch'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: '86ec886ab0a08311c7df529370fe45b5b029e132'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c4c-hitze-quellen.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/updates` und `/en/updates/<slug>` zeigen deutschen Inhalt mit Fallback-Banner und `noindex`. Für den englischen Text eines Eintrags gibt es nur die Frontmatter-Felder `title_en`/`summary_en` (ungenutzt), keinen Body.

**Approach:** Je Eintrag eine Schwesterdatei `YYYY-MM-DD-<slug>.en.md` mit dem englischen Body (Entscheidung Matze 30.09.). Titel und Summary EN als `title_en`/`summary_en` im DE-Frontmatter. Liste und Detailseite zeigen in `/en` die EN-Fassung. Die 13 Einträge bekommen die abgenommene Übersetzung, `/updates` kommt mit `prefix` ins `TRANSLATION_REGISTER`. `publish-update` erzeugt künftig die EN-Fassung als Draft mit.

## Boundaries & Constraints

**Always:**
- Übersetzung: `_bmad-output/implementation-artifacts/c4d-uebersetzung.json` (Titel, Summary, UI) und `c4d-updates-en/*.en.md` (Bodies), Entscheidungen in `c4d-uebersetzung-review.md`.
- Der Loader behandelt `*.en.md` nie als eigenen Eintrag (heute ergäbe `extractSlugFromPath` den Slug `<slug>.en`). Gilt für Liste, Detail, Home-Teaser und alle drei Feeds.
- Fallback: Eintrag ohne `.en.md` bzw. ohne `title_en`/`summary_en` zeigt auf `/en` die DE-Fassung mit `lang="de"` am betroffenen Element. Kein stiller DE-Text ohne `lang`.
- Feeds (`rss.xml`, `atom.xml`, `feed.json`) bleiben DE, kein EN-Feed (Entscheidung Matze 30.09.).
- DE-Ausgabe von Liste, Detail und Feeds Zeichen für Zeichen gleich, per DE-Wortlaut-Test.
- `publish-update`: Klassifier liefert zusätzlich `title_en`, `summary_en`, `body_en`. `write-draft` schreibt `title_en`/`summary_en` ins Frontmatter und `body_en` als `_drafts/<datei>.en.md`. Forbidden-Token-Lint läuft auch über den EN-Body. SKILL.md und `_content/updates/README.md` beschreiben die Schwesterdatei.
- Interne Links im EN-Body mit `/en`-Präfix, Datei-Links unverändert. JSON-LD (BlogPosting) in der Seiten-Locale.
- TDD pro AC.

- Entscheidung Matze 30.09. 11:03: Abschnitt „Abnahme“ in `c4d-uebersetzung-review.md` (eine DE-Korrektur in `2026-05-19-wahldaten`, Glossar „Tenant protection“/„Kiez finder“, taz-Titel EN).

**Never:**
- Keine weitere DE-Textänderung an bestehenden Einträgen, veraltete Tagesstände bleiben (Changelog-Historie).
- Kein EN-Feed, kein `sitemap-en.xml`-Eintrag, OG-Bilder bleiben DE.
- Kein Auto-Commit im Skill.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Liste EN | `/en/updates` | Titel, Summary, Kategorien, Filter englisch | N/A |
| Detail EN | `/en/updates/<slug>` mit `.en.md` | Body englisch, kein Banner, indexierbar | N/A |
| Eintrag ohne EN | neuer Eintrag nur DE | Liste und Detail DE mit `lang="de"` | N/A |
| `.en.md` ohne DE-Datei | verwaiste Schwester | Build-Fehler mit Pfad | wirft |
| Feeds | `/updates/rss.xml` u. a. | nur DE-Einträge, keine `.en`-Duplikate | N/A |
| Draft | `publish-update` | `_drafts/<datei>.md` + `.en.md`, EN-Lint | Lint-Verstoß: `_FAIL_`-Präfix wie DE |

</frozen-after-approval>

## Code Map

- `src/lib/content/updates/load-updates.ts` -- `FILENAME_REGEX` matcht `*.en.md` als Slug `<slug>.en`. EN-Schwester erkennen, dem DE-Eintrag als `bodyEn` zuordnen, verwaiste Schwester wirft. `types.ts` (`UpdateEntry` + `bodyEn?`). Tests `load-updates.test.ts`.
- `src/lib/content/updates/frontmatter-schema.ts` -- `title_en`/`summary_en` existieren. Kommentar „Phase 1 DE-only“ aktualisieren.
- `src/routes/(with-header)/updates/+page.server.ts`, `+page.svelte`, `[slug]/+page.server.ts`, `[slug]/+page.svelte` -- Locale-Auswahl, `renderMarkdownBody` für EN, `lang` bei Fallback, JSON-LD (`jsonld-blog-posting.ts` kennt `inLanguage`).
- `src/lib/components/updates/{updates-entry-card,updates-filter}.svelte`, `category-label.ts` -- UI-Texte als Messages.
- `src/lib/content/updates/map-home-update-entry.ts` -- nutzt `title_en`/`summary_en` schon (B2), bleibt kompatibel.
- `src/routes/updates/{rss.xml,atom.xml,feed.json}/+server.ts` -- gleicher Glob, dürfen keine `.en`-Einträge erzeugen (Test).
- `scripts/publish-update/{draft-result-schema,invoke-classifier,write-draft,main}.ts`, `system-prompt.txt`, `.claude/skills/publish-update/SKILL.md`, `_content/updates/README.md`.
- `src/lib/seo/translation-register.ts` -- `/updates` mit `prefix: true`. `translation-register.test.ts` nutzt `/updates` als nicht übersetzte Kontrolle, auf `/impressum`/`/datenschutz` umstellen.

## Tasks & Acceptance

**Execution:**
- [x] Loader + Typen: `.en.md`-Schwester, verwaiste Schwester wirft (+ Tests inkl. Feeds ohne Duplikate)
- [x] 13 `.en.md` aus `c4d-updates-en/`, `title_en`/`summary_en` ins Frontmatter
- [x] Liste, Detail, Karten, Filter, Kategorien in der Seiten-Locale, Fallback mit `lang="de"`, JSON-LD (+ Tests)
- [x] `publish-update`: Schema, Prompt, Draft-Schreiben, EN-Lint, Doku (+ Tests)
- [x] Register `/updates` mit `prefix`, Kontroll-Tests umstellen
- [x] e2e: `/en/updates` und ein Detail ohne Banner, indexierbar, Links unter `/en`; Feed ohne `.en`-Duplikat
- [x] Zeitmessung

**Acceptance Criteria:**
- Given die 13 Einträge mit `.en.md`, when `/en/updates/<slug>` lädt, then ist der Body englisch, kein Banner, kein `noindex`.
- Given `/updates/rss.xml`, when der Build läuft, then enthält der Feed genau die 13 DE-Einträge.

## Implementation Notes

- 30.09. Übersetzung 10:56-10:59, Spec 10:58, Abnahme Matze 11:03, Umsetzung 11:05-11:22 (17 min), Review 11:22-11:24, Patches 11:24-11:29, Verifikation 11:29-11:45.
- Loader: `.en.md` als `bodyEn`, verwaiste Schwester, Frontmatter in Schwester und fremde Locale-Suffixe werfen. Register `/updates` mit `prefix` und `except` für die drei Feeds.
- `formatLongDate` in `$lib/i18n/format.ts` (neu, Intl/UTC), DE unverändert.
- publish-update: EN-Draft (Titel, Summary, `.en.md`), EN-Lint inkl. Titel/Summary, atomares Paar-Schreiben, Kollisions-Suffixe, YAML-sicheres Quoting. Runbook `docs/runbooks/publish-update-skill.md` auf `mv` + `git add` (Koordinator).
- DE-Korrekturen: `2026-05-19-wahldaten` (Satz vervollständigt), „Methodik-Änderungen“ im Blog-JSON-LD.
- Nicht abgenommen: `updates_jsonld_blog_description` EN „Data updates, features and methodology changes.“
- e2e `a11y.e2e.ts` (erstmals im Lauf): 2-3 rot ohne C4d-Bezug (`/_dev/wortmarke` ohne `<title>`, Karten-Escape-Timeout, Root-Karte flaky), vorbestehend.
- Qualität: 31 Review-Funde in 23 Einträgen, 17 gepatcht, 1 deferred (+ Filter-Toggle-Bug vorbestehend), 5 rejected.

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 11:24), 3 Layer: Blind Hunter (BH) 15, Edge Case (EC) 11, Verification Gap (VG) 3 + 2. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | EC | `write-draft`: Überschreiben bei Kollision, DE ohne EN bei Teilfehler, YAML-Escaping `title_en` | medium | | P |
| 2 | EC/BH | EN-Lint ohne Titel/Summary, `_FAIL_`-Report ohne EN-Pfad, em-dash im Header | medium | | P |
| 3 | BH | Tests zählen den Content fest (`SLUGS`, `ENTRY_COUNT = 13`) | medium | bricht beim nächsten Eintrag | P: Parität |
| 4 | EC | `.en.md` mit Frontmatter, unbekannte Locale-Suffixe | low | | P: wirft |
| 5 | EC | `inLanguage` en-US bei DE-Fallback von Summary/Body | low | | P |
| 6 | EC | „1 entries“ ungefiltert | low | | P |
| 7 | BH/EC | `formatUpdateDate` baut `format.ts` nach, fragil | low | | P |
| 8 | EC | Register-Präfix matcht DE-Feeds | low | `/en/updates/rss.xml` 404 | P |
| 9 | BH | Promote per `git mv` scheitert an ignorierten Drafts | low | `_drafts/.gitignore` = `*` | P |
| 10 | BH | Feed-Links ohne `hreflang="de"` | low | Linie Matze: kein sichtbarer Zusatz | P |
| 11 | BH | „Tags“ hart, deutsche Tag-Slugs ohne `lang` | low | | P |
| 12 | BH | „Methodik-Aenderungen“ | low | DE-Korrektur | P |
| 13 | BH | Prompt-Regel widerspricht taz-Titel | low | | P |
| 14 | BH | Detail-`load` liefert beide Markdown-Bodies | low | | P |
| 15 | VG | Home-Teaser-`lang="de"` ungetestet | medium | e2e-Check entfernt | P |
| 16 | VG | Filter-Feedback gefiltert ungetestet | low | | P (über `?cat=`) |
| 17 | VG | Stale Kommentare | low | | P |
| 18 | VG | `main.ts` ohne Test | low | Git-Seams nötig | D |
| 19 | BH | Bodies nicht im Diff | false | vom Koordinator ausgeschlossen, Übersetzung abgenommen | R |
| 20 | BH | Linktext `/wahl` zeigt auf `/berlin-wahlen` | low | Changelog-Historie | R |
| 21 | BH | en-US vs. en-GB | low | Projekt-Konvention `localeToBcp47` | R |
| 22 | BH | Breadcrumb-JSON-LD „Berlin“/„Updates“ hart | low | Muster anderer Seiten | R |
| 23 | BH | Spec unvollständig | low | Step 5 | R |

## Design Notes

- Titel/Summary EN im DE-Frontmatter statt in der `.en.md`: eine Quelle für Datum, Kategorie, Tags. Die `.en.md` trägt nur den Body, kein Frontmatter.
- DE-Parität per explizitem Wortlaut-Test (Lehre C4b), kein Test liest `_bmad-output/`.

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 5298/5298
- `pnpm check` -- expected: 0 Fehler -- **grün**
- `pnpm lint:wahl`, `pnpm lint:cleartext` -- expected: 0 Verstöße -- **grün**
- `pnpm build` (voll) + e2e `i18n-*`, `updates*` falls vorhanden -- expected: grün (Port 4173 belegt: temporäre Config, danach löschen; `static/kiez-scores/region-composites.json` zurücksetzen) -- **grün**: Build 0 Fehler, e2e 180/183 und 181/183, rot nur vorbestehende `a11y.e2e.ts`-Fälle ohne C4d-Bezug
