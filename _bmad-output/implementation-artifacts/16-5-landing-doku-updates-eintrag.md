# Story 16.5: Landing-Doku + Feature-Launch-Eintrag (/updates)

Status: ready-for-dev

> **Anker:** Epic 16 (Kühle-Orte-Landing-Page), FR14, NFR8 (Angebot-Haltung), NFR9 (DE-only). Letzte Story des Features: dokumentiert die neue Route und macht den Launch nutzerseitig sichtbar.
> **Abhängigkeit:** Route `/kuehle-orte` aus Story 16.1 muss gelandet sein (Landing-Page existiert), Layer `kuehle-orte` aus Epic 15 publiziert (Methodik-/Layer-Ziel für Verlinkung).
> **Charakter:** Doku + Content, kein neuer Logik-Code. Test-First greift hier nicht (statische Content-Files, System-Doku). Hand-off-Gate ist die grüne Feed-/SEO-Suite plus Build ohne Schema-Verstoß.

## Story

As a Solo-Maintainer,
I want die Kühle-Orte-Landing-Page in der System-Doku verankert und einen nutzerseitigen Changelog-Eintrag unter `/updates`,
so that der Launch auffindbar, einordbar und über die Feeds verteilbar ist.

## Kontext: Warum dieser Change

Epic 15 liefert den Layer, Epic 16 die Landing-Page. Beide sind unsichtbar, solange niemand davon erfährt. Diese Story schließt das Feature ab mit zwei Artefakten:

- **System-Doku:** Die neue Route `/kuehle-orte` fehlt in der Frontend-Routes-Übersicht (`docs/architecture/system-map.md`) und im Doc-Single-Entry (`docs/INDEX.md`). Ohne Eintrag findet der nächste Maintainer oder LLM-Agent die Seite nicht im Mental-Model des Systems.
- **Nutzer-Changelog:** `/updates` ist der öffentliche, durchsuchbare und per RSS/Atom/JSON abonnierbare Kanal. Ein Eintrag der Kategorie `feature` erklärt das Angebot in Nutzersprache (kühle Orte, Live-Status, Ein-Tap-Navi, ehrliche Flags) und hält die Angebot-Haltung (NFR8): kein „besser als die Stadt", Quellen transparent.

Der Eintrag folgt dem bestehenden Workflow aus `docs/runbooks/add-update-entry.md`: eine Markdown-Datei pro Eintrag, Frontmatter gegen Valibot-Schema validiert, Build-Zeit-Validation. Feeds, Sitemap und Detail-Prerender aktualisieren automatisch über `import.meta.glob` auf `_content/updates/`.

## Acceptance Criteria

1. **AC-1 (System-Doku):**
   **Given** die neue Route `/kuehle-orte` (Story 16.1)
   **When** die System-Doku aktualisiert wird
   **Then** erscheint die Landing-Page als Knoten im Frontend-Routes-Mermaid von `docs/architecture/system-map.md` und als Verweis im passenden Abschnitt von `docs/INDEX.md`
   **And** `last-verified` der berührten Doc-Files wird auf das Bearbeitungsdatum gesetzt

2. **AC-2 (Update-Entry existiert + schema-valid):**
   **Given** die `/updates`-Route
   **When** der Feature-Changelog geschrieben wird
   **Then** existiert `_content/updates/2026-MM-DD-kuehle-orte.md` mit Frontmatter `category: feature`, `title_de` ≤ 80 Zeichen, `summary_de` ≤ 160 Zeichen, ISO-Datum, Tags lowercase-kebab-case (≤ 8)
   **And** `parseFrontmatter` (Valibot) akzeptiert die Datei ohne Verstoß

3. **AC-3 (Nutzersprache + Angebot-Haltung):**
   **Given** der Eintrag
   **When** der Body gelesen wird
   **Then** erklärt er das Angebot in Nutzersprache: kühle Orte, Live-Öffnungsstatus, Ein-Tap-Navigation, ehrliche Flags (Kühle-Score, „im Sommer geschlossen", kostenlos/Ticket, klimatisiert, barrierefrei)
   **And** hält die Angebot-Haltung (NFR8: kein „besser als die Stadt", kein Behörden-Ersatz), nennt Quellen transparent, verlinkt Methodik/Layer und die Landing-Page `/kuehle-orte`

4. **AC-4 (Forbidden-Token):**
   **Given** die Output-Konvention (`CLAUDE.md`)
   **When** Doc und Eintrag geprüft werden
   **Then** enthalten weder die geänderten Doc-Files noch der neue Eintrag em-dashes (U+2014); Ersatz durch Komma, Doppelpunkt, neuer Satz oder Mittelpunkt (`·`)

5. **AC-5 (Feeds + Build grün):**
   **Given** der Eintrag liegt in `_content/updates/`
   **When** `/updates` und die Feeds prerendern
   **Then** erscheint der Eintrag chronologisch korrekt (neuestes Datum zuerst) auf `/updates`, in RSS/Atom/JSON-Feed, Sitemap und als Detail-Page mit JSON-LD-`BlogPosting`
   **And** `pnpm test:unit` (Feed-, SEO-, Updates-Suite) ist 100 % grün, `pnpm build` wirft keinen Schema-Fehler

## Tasks / Subtasks

- [ ] **Task 1: System-Doku-Update** (AC: #1, #4)
  - [ ] 1.1 In `docs/architecture/system-map.md`, Abschnitt „Frontend-Routes" (Mermaid-Graph ~Zeile 131-144): Knoten `Root --> KuehleOrte[/kuehle-orte<br/>Landing + eingebettete Karte]` ergänzen, analog zum bestehenden `Updates`-Knoten
  - [ ] 1.2 `last-verified` im Frontmatter von `system-map.md` (Zeile 4) auf Bearbeitungsdatum setzen
  - [ ] 1.3 In `docs/INDEX.md` einen Verweis auf die Landing-Page setzen (passender Abschnitt, z.B. unter „Architektur" oder neuem Routen-Hinweis); `last-verified` (Zeile 4) aktualisieren
  - [ ] 1.4 Beide Files auf U+2014 prüfen (`grep -n $'\u2014' docs/architecture/system-map.md docs/INDEX.md` muss leer sein)

- [ ] **Task 2: Update-Entry schreiben** (AC: #2, #3, #4)
  - [ ] 2.1 Datei `_content/updates/2026-MM-DD-kuehle-orte.md` anlegen, Datum = Launch-Tag (Platzhalter `2026-06-30`, beim Merge auf echtes Landing-Datum anpassen), Slug `kuehle-orte`
  - [ ] 2.2 Frontmatter: `title_de` (≤ 80), `summary_de` (≤ 160, Meta-Description-fit), `date` ISO, `category: feature`, `tags` (z.B. `[kuehle-orte, hitze, karte, navigation, feature]`, lowercase-kebab, ≤ 8)
  - [ ] 2.3 Body als GitHub-flavored Markdown: Intro (Angebot-Haltung), Was die Karte zeigt (Live-Status, Navi, Flags, Kühle-Score), Quellen-Transparenz, Methodik-/Layer-Verweis, CTA-Link auf `/kuehle-orte`. Vorbild-Tonfall: `_content/updates/2026-06-10-kriminalitaet-kontext.md`
  - [ ] 2.4 Forbidden-Token: keine em-dashes, kein „lebenswert", keine Absolutismen ohne Beleg (`add-update-entry.md` Stil-Disziplin). `grep -n $'\u2014'` auf die neue Datei muss leer sein
  - [ ] 2.5 Ziel-Links verifizieren: existieren `/kuehle-orte` (Story 16.1) und die Methodik-/Layer-Seite (Epic 15, z.B. `/layer/kuehle-orte` bzw. `/methodik`-Anker) wirklich? Nur auf real prerenderte Routen verlinken, sonst Verweis weglassen

- [ ] **Task 3: Verifikation (Hand-off-Gate)** (AC: #5)
  - [ ] 3.1 `pnpm test:unit` laufen lassen, gezielt Feed-/SEO-/Updates-Suite grün: `src/lib/content/updates/load-updates.test.ts`, `src/lib/seo/sources/updates.test.ts`, `src/lib/feeds/build-rss.test.ts`, `build-atom.test.ts`, `build-json-feed.test.ts`, `src/lib/seo/sitemap-builder.test.ts`, `src/lib/seo/jsonld-blog-posting.test.ts`, `src/lib/components/updates/*.test.ts`
  - [ ] 3.2 `pnpm build` ausführen: kein Frontmatter-Schema-Fehler (`parseFrontmatter` wirft Build-Fehler bei Verstoß), Eintrag prerendert auf `/updates` und `/updates/kuehle-orte`
  - [ ] 3.3 Lokal sichten (`pnpm dev`): `/updates` zeigt den Eintrag chronologisch zuoberst (neuestes Datum), `/updates/rss.xml` / `atom.xml` / `feed.json` enthalten ihn
  - [ ] 3.4 `pnpm check` 0 Errors (keine Regression durch Doc-Änderung)

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Update-Pipeline existiert vollständig** (Story 2.13). Loader `src/lib/content/updates/load-updates.ts` zieht via `import.meta.glob` alle `_content/updates/*.md`, überspringt Files ohne `YYYY-MM-DD`-Prefix (README, .gitkeep). Slug = Filename ohne Date-Prefix und `.md`.
- **Frontmatter-Schema** `src/lib/content/updates/frontmatter-schema.ts` (Valibot): Pflicht `title_de` (≤ 80), `summary_de` (≤ 160), `date` (`/^\d{4}-\d{2}-\d{2}$/`), `category` (Picklist `daten-update | feature | methodik | datenquelle | lizenz`). Optional `tags` (≤ 8, `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`), `lang`, `title_en`, `summary_en`. `parseFrontmatter` wirft bei Verstoß → Build-Fehler.
- **Feeds + SEO konsumieren denselben Loader:** Routen `src/routes/updates/{rss.xml,atom.xml,feed.json}/+server.ts`, Sitemap-Source `src/lib/seo/sources/updates.ts`, Detail-Prerender `src/routes/(with-header)/updates/[slug]/+page.server.ts` (JSON-LD `BlogPosting`).
- **Feed-/SEO-Tests laufen gegen Fixtures, nicht gegen echte Content-Files** (`load-updates.test.ts`, `updates.test.ts` bauen `UpdateEntry` inline). Ein neuer Content-File bricht diese Tests nicht. Der echte Gate ist die Build-Zeit-`parseFrontmatter`-Validation plus chronologische Anzeige.
- **Bestehende Einträge** in `_content/updates/`: 8 Stück (`2026-05-15` bis `2026-06-10`). Vorbild für Tonfall und Methodik-Verlinkung: `2026-06-10-kriminalitaet-kontext.md` (`category: feature`, Quelle benannt, Grenzen ehrlich, Methodik verlinkt, keine em-dashes).
- **System-Doku:** `docs/architecture/system-map.md` führt Frontend-Routes als Mermaid-Graph (Zeile 131-144), aktuell ohne `/kuehle-orte`. `docs/INDEX.md` ist der Doc-Single-Entry, beide tragen `last-verified`-Frontmatter (Zeile 4), aktuell `2026-05-17`.
- **Route-Stand:** `/kuehle-orte` existiert im Repo noch NICHT (Stand 2026-06-30, kein Treffer unter `src/routes/**kuehle**`). Story 16.1 legt sie an. Diese Story setzt voraus, dass 16.1 vor dem Merge gelandet ist, sonst zeigt der Doku-Verweis ins Leere.
- **Workflow-Doku:** `docs/runbooks/add-update-entry.md` beschreibt den manuellen Entry-Workflow (Naming, Frontmatter, Stil-Disziplin „keine em-dashes", Kategorie-Wahl, Anti-Patterns).

### Design-Entscheidung

- **Datum = echter Launch-Tag, nicht Story-Tag.** Die `/updates`-Chronologie ist nutzersichtbar. Der Eintrag bekommt das Datum, an dem die Landing-Page live geht. Platzhalter `2026-06-30` im Branch, beim Merge auf das reale Datum korrigieren. Falsches (zu frühes) Datum würde den Eintrag in der Liste falsch einsortieren.
- **Kategorie `feature`, nicht `daten-update`.** Es ist eine neue Funktion (Layer + Landing-Page), kein Refresh bestehender Werte. Deckt sich mit der Kategorie-Definition in `add-update-entry.md`.
- **Kein neuer Test-Code (Test-First greift nicht).** Per `CLAUDE.md`-Scope sind statische Content-Files und System-Doku vom TDD-Mandat ausgenommen. Schutz kommt aus der bestehenden Build-Zeit-Schema-Validation und der grünen Feed-Suite. Kein neuer Inhalts-Lint nötig, solange `pnpm build` den Frontmatter-Verstoß fängt.
- **Verlinkung defensiv.** Nur auf real prerenderte Routen verlinken. Existiert kein dedizierter Methodik-Anker für kühle Orte (abhängig von Epic 15), dann auf Layer-Page oder allgemeine `/methodik` verweisen statt einen toten Link zu erfinden.
- **Angebot-Haltung wörtlich umsetzen (NFR8).** Formulierungen wie „besser als die Stadt", „lebenswert" oder Absolutismen ohne Beleg sind verboten. Der Ton bleibt Hilfsangebot mit transparenten Quellen.

### Was nicht brechen darf

- **Bestehende Update-Einträge und Feeds.** Reines Hinzufügen einer Datei plus zwei Doc-Edits. Kein Eingriff in Loader, Schema, Feed-Builder oder Routen-Code.
- **Chronologie der `/updates`-Liste.** `sortByDateDesc` ordnet nach Datum absteigend. Das gewählte Datum darf nicht vor einem inhaltlich jüngeren Eintrag liegen.
- **Build-Determinismus.** Schema-Verstoß (z.B. `summary_de` > 160) scheitert `pnpm build`. Vor Commit lokal gegen `parseFrontmatter` prüfen.
- **Forbidden-Token-Lock.** Kein U+2014 in den drei berührten Dateien. Auch en-dash (U+2013) außerhalb von Zahlen-Ranges vermeiden.
- **Doku-Frontmatter-Konvention** (`docs/INDEX.md` Story 7.2): `type`, `audience`, `last-verified`, `related` bleiben gültig; nur `last-verified` aktualisieren, Struktur nicht zerschießen.

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L363-L381] (Story 16.5 User-Story + AC)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L32-L49] (FR14, NFR8, NFR9)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L283-L305] (Story 16.1, Route `/kuehle-orte` + CTA-Deep-Link)
- [Source: _content/updates/2026-06-10-kriminalitaet-kontext.md] (Tonfall-/Methodik-Vorbild, `category: feature`)
- [Source: _content/updates/README.md] (Naming, Frontmatter, Pflicht-/Optional-Felder)
- [Source: docs/runbooks/add-update-entry.md] (Workflow, Stil-Disziplin, Kategorie-Wahl, Anti-Patterns)
- [Source: src/lib/content/updates/frontmatter-schema.ts#L19-L70] (Valibot-Schema, `parseFrontmatter`)
- [Source: src/lib/content/updates/load-updates.ts] (`import.meta.glob`-Loader, Slug-Extraktion, `sortByDateDesc`)
- [Source: src/lib/content/updates/load-updates.test.ts] (Fixture-basierte Tests, kein Real-File-Coupling)
- [Source: src/lib/seo/sources/updates.test.ts] (Sitemap-Source-Tests)
- [Source: src/routes/updates/rss.xml/+server.ts, atom.xml/+server.ts, feed.json/+server.ts] (Feed-Prerender)
- [Source: docs/architecture/system-map.md#L129-L144] (Frontend-Routes-Mermaid, Ziel für `/kuehle-orte`-Knoten)
- [Source: docs/INDEX.md#L1-L9] (Doc-Single-Entry-Frontmatter, `last-verified`)
- [Source: CLAUDE.md] (TDD-Scope-Ausnahme Content-Files, Forbidden-Token-Konvention)

## Dev Agent Record

### Agent Model Used

_(vom Dev-Agent auszufüllen)_

### Completion Notes List

_(vom Dev-Agent auszufüllen)_

### File List

**Neu:**
- `_content/updates/2026-MM-DD-kuehle-orte.md` (Launch-Datum beim Merge konkretisieren)

**Geändert:**
- `docs/architecture/system-map.md` (Frontend-Routes-Knoten + `last-verified`)
- `docs/INDEX.md` (Landing-Verweis + `last-verified`)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (16-5 → review)

### Debug Log References

_(vom Dev-Agent auszufüllen)_

## Change Log

- 2026-06-30: Story 16.5 erstellt (ready-for-dev). System-Doku-Verweis auf `/kuehle-orte` + nutzerseitiger Feature-Changelog-Eintrag (`category: feature`, Nutzersprache, Angebot-Haltung, keine em-dashes), Hand-off-Gate = grüne Feed-/SEO-Suite + Build ohne Schema-Verstoß.
