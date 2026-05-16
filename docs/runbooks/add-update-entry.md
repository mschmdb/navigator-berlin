# Runbook · Update-Entry hinzufügen

Story 2.13 · Maintainer-Workflow für `/updates`-Einträge.

## Voraussetzung

Lokales Git-Checkout, `pnpm install` einmalig gelaufen. Keine Datenbank, kein Admin-UI.

## Schritte

1. **Datei anlegen** unter `_content/updates/YYYY-MM-DD-{slug}.md`.

   Slug: lowercase-kebab-case, beschreibt den Update kurz.

   Beispiel: `_content/updates/2026-06-12-mietspiegel-2025-refresh.md`

2. **Frontmatter befüllen.**

   ```yaml
   ---
   title_de: "Mietspiegel 2025 ist live"
   summary_de: "Mietspiegel-Layer von 2024 auf 2025 aktualisiert. 542 Planungsräume mit frischen Werten."
   date: 2026-06-12
   category: daten-update
   tags: [mietspiegel, wohnen, refresh]
   ---
   ```

   Pflicht: `title_de` (≤ 80 Z), `summary_de` (≤ 160 Z), `date` (ISO `YYYY-MM-DD`), `category` (`daten-update | feature | methodik | datenquelle | lizenz`).

   Optional: `tags` (max 8, lowercase-kebab), `title_en`, `summary_en`, `lang`.

   Schema-Verstoß: Build wirft mit klarer Fehlermeldung. Validation in `src/lib/content/updates/frontmatter-schema.ts`.

3. **Body schreiben** als GitHub-flavored Markdown.

   - Empfohlen: 300 bis 1000 Wörter (Long-Tail-SEO-Sweet-Spot).
   - Erlaubt: Headlines, Links, Code-Blocks, Listen, Tabellen, eingebettete `<a href="/layer/...">`-Verweise.
   - Stil-Disziplin: keine em-dashes, kein „lebenswert", aktive Verben.

4. **Lokal verifizieren.**

   ```bash
   pnpm dev
   ```

   Öffnen: `http://localhost:5173/updates` und `http://localhost:5173/updates/{slug}`.

   Build-Time-Validation läuft bei `pnpm build`. Schema-Verstoß scheitert den Build.

5. **Commit + Push.**

   ```bash
   git add _content/updates/YYYY-MM-DD-{slug}.md
   git commit -m "docs(updates): {slug}"
   git push
   ```

6. **Build aktualisiert automatisch:**
   - Sitemap (`/sitemap-de.xml`)
   - RSS-Feed (`/updates/rss.xml`)
   - Atom-Feed (`/updates/atom.xml`)
   - JSON-Feed (`/updates/feed.json`)
   - Detail-Page-Prerender mit JSON-LD-`BlogPosting`

   Keine manuelle Pipeline-Trigger nötig.

## Sanitization-Hinweis

Der Markdown-Renderer pipe `marked` → Custom-Regex-Sanitizer (`$lib/seo/markdown-sanitizer.ts`). Strippt `<script>`, `<iframe>`, `on*=`-Attribute, `javascript:`/`data:`-URLs.

Inline-HTML im Body ist erlaubt, aber Block-Liste greift. Kein externes JS, kein `<iframe>`.

## Kategorie-Wahl

- **daten-update**: bestehender Layer hat frische Werte (Refresh).
- **feature**: neue Funktion im Atlas, Inspector, Methodik-Page.
- **methodik**: Änderung an Berechnungen, Schwellenwerten, Aggregat-Regeln.
- **datenquelle**: neue oder gewechselte Primärquelle (z.B. WFS-Endpoint).
- **lizenz**: Änderung an Layer-Lizenzen oder Namensnennungs-Pflichten.

## Anti-Patterns

- Personen-Biografien gehören nicht in Update-Entries.
- Mietpreis-Werte (€/m²) niemals nennen, Verweis auf `mietspiegel.berlin.de`.
- Kein Bezirks-Ranking oder Composite-Score-Trend („Bezirk X verbessert sich von Y auf Z").

## Was Updates NICHT sind

- Marketing-Slots
- Release-Notes mit Versionsnummern
- Tweet-Stream-Klone
