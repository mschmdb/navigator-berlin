---
title: 'S2: Head-Lücken (Feed-hreflang, OG für Wahldaten-Methodik, Artikel-Metadaten für Updates)'
type: 'bugfix'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: '09a2a608917ccaef9e43888b9c1c25ae7489567d'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/seo-investigation-s2-s5.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mehrere Seiten senden widersprüchliche oder unvollständige Head-Daten. `/updates` und Einträge mischen Feed-Links mit `hreflang="de"` unter die Sprachalternativen. `/methodik/wahldaten` hat kein Vorschaubild und keine Twitter-Card. Update-Einträge tragen zweimal `og:type` (einmal `website` aus SeoHead, einmal `article`), das BlogPosting-JSON-LD hat kein Bild und kein echtes Änderungsdatum. Ein Update ohne EN-Fassung wäre unter `/en/updates/<slug>` als eigene, übersetzte Seite indexierbar (heute latent, alle 15 haben EN).

**Approach:** Feed-Links ohne `hreflang`. Eigenes OG-Bild für die Wahldaten-Methodik. SeoHead bekommt `ogType` und Artikel-Metadaten, der Doppelblock entfällt. BlogPosting mit `image` und `dateModified` aus optionalem Frontmatter-Feld `updated`. Updates ohne EN-Fassung landen automatisch in der `except`-Liste des Übersetzungsregisters.

**Entscheidungen (Empfehlung, Freigabe Matze 15.10. für den Epic):**
- Kein eigenes OG-Bild je Update; BlogPosting `image` nutzt das vorhandene `/og/page/updates.png` (eigene Bilder je Eintrag später).
- `updated` ist optional; fehlt es, gilt `date` für `dateModified` und `article:modified_time` entfällt.

## Boundaries & Constraints

**Always:** SeoHead-Änderung nur additiv (neue Props mit Default `website`), damit alle anderen Seiten unverändert bleiben. Sichtbare `<a hreflang>`-Links im Body bleiben. Frontmatter-Schema-Erweiterung mit Valibot, Build bricht bei ungültigem `updated` wie bei `date`. DE/EN.

**Never:** Keine Änderung an Canonical-Logik (S1), WebSite/Organization-JSON-LD (S3), Dataset (S4), Sitemap-lastmod (S5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Feed-Links | `/updates`, `/en/updates`, Eintrag | `<link rel="alternate" type="application/rss+xml" …>` ohne `hreflang` | N/A |
| Wahldaten-Methodik | `/methodik/wahldaten`, `/en/…` | `og:image`, `og:image:alt`, `twitter:card=summary_large_image` | N/A |
| Update-Eintrag | `/updates/<slug>` | genau ein `og:type=article`, `article:published_time` | N/A |
| BlogPosting | Eintrag ohne `updated` | `image` gesetzt, `dateModified` = `date` | N/A |
| BlogPosting | Eintrag mit `updated` | `dateModified` = `updated`, `article:modified_time` | ungültiges Datum → Build-Fehler |
| EN fehlt | Eintrag ohne `.en.md` | `/en/updates/<slug>` noindex, Canonical auf DE, nicht in sitemap-en | N/A |

</frozen-after-approval>

## Code Map

Siehe `seo-investigation-s2-s5.md`, Abschnitt S2. Kernstellen: `src/lib/components/seo/feed-discovery-links.svelte:20-43`; `methodik/wahldaten/+page.svelte:125`, `scripts/generate-og-images.ts:60-146` (PAGE_TARGETS), Muster `methodik/kiez-score/+page.svelte:66-73`; `seo-head.svelte:137` (og:type), `updates/[slug]/+page.svelte:64-71`; `src/lib/seo/jsonld-blog-posting.ts:78-110,139`; `frontmatter-schema.ts:30-50`; `translation-register.ts:100-106`, `sitemap-builder.ts:250-273`; Tests `seo-head.svelte.test.ts:94-120`, `jsonld-blog-posting.test.ts`, `tests/e2e/i18n-c4d.e2e.ts:45`.

## Tasks & Acceptance

**Execution:**
- [x] `feed-discovery-links` + Tests -- `hreflang` entfernen; E2E `i18n-c4d.e2e.ts:45` anpassen.
- [x] OG-Bild Wahldaten -- `PAGE_TARGETS` ergänzen, PNG erzeugen und committen, `ogImage`/`ogImageAlt` setzen, Messages DE/EN.
- [x] `seo-head.svelte` + Test -- Props `ogType`, `article`; Update-Seite nutzt sie, Doppelblock weg.
- [x] `jsonld-blog-posting.ts` + Test, `frontmatter-schema.ts` + Test -- `image`, `updated`.
- [x] `translation-register.ts` + Test -- `except` dynamisch für Updates ohne `.en.md`; Test mit Fixture.
- [x] E2E: Update-Eintrag hat genau ein `og:type`.

**Acceptance Criteria:**
- Given ein Update-Eintrag, when man den Head liest, then gibt es genau ein `og:type` mit Wert `article` und kein `hreflang` an Feed-Links.

## Implementation Notes

- Feed-Links ohne `hreflang`; Titel auf EN mit Sprachzusatz („(RSS, German)“) über Paraglide.
- `/methodik/wahldaten`: OG-Bild `static/og/page/methodik-wahldaten.png` (über `PAGE_TARGETS`), Alt-Text DE/EN.
- SeoHead: Props `ogType` (Default `website`) und `article`; `article:*` nur bei `ogType === 'article'`. Update-Detail ohne Doppelblock, ohne `article:author`.
- Frontmatter `updated` (optional, ≥ `date`); `entryModifiedDate` speist BlogPosting `dateModified`, Sitemap-`lastmod`, Atom `<updated>`, JSON Feed `date_modified`. BlogPosting `image` = Seiten-OG-Bild.
- Übersetzungsregister: `except` für Updates aus Dateinamen (`update-filename.ts`, gemeinsam mit dem Loader); der Build bricht ab, wenn eine `.en.md` leer ist oder `title_en`/`summary_en` fehlen.
- Verifikation: Unit 4.940/4.941 (Ausfall `winner-map`, bekannt wackelig), `pnpm check` 0, Build ohne Fehler, E2E 173/173.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Edge, VerifGap, Blind | Leere `.en.md` oder fehlende `title_en` gelten als übersetzt, Loader zeigt DE | medium | patch (Build bricht ab) |
| Edge, Blind | Dateinamen-Regex doppelt, `.fr.md`, Slug mit Punkt ungetestet | low | patch |
| VerifGap | Glob ungeprüft | medium | patch |
| VerifGap | YAML-Date in `updated` ungetestet | medium | patch |
| Edge, Blind | `updated` vor `date` erlaubt | low | patch |
| Edge, Blind | `article:*` bei `ogType=website` | low | patch |
| Blind | `article:author` Klartext, Alt-Text hart codiert, BlogPosting ohne Seiten-Bild | low | patch |
| Blind | `updated` fehlt in Sitemap-lastmod und Feeds | medium | patch |
| Blind | Feed-Links ohne Sprachhinweis auf EN, veralteter Kommentar, wirkungsloser Locale-Test | low | patch |
| Blind | Message-Key falsch einsortiert | low | patch |
| Blind | Lazy-Glob erzeugt Client-Chunks | low | reject: Chunks werden nie geladen, Markdown-Dateien klein; kein Einfluss auf Seitengewicht |
| Blind | OG-Bild der Wahldaten-Methodik mit DE-Text auch auf EN | low | reject: gleiches Muster wie alle Seiten-OG-Bilder |
| Blind | Integrationstest DE-only-Update (noindex, Sitemap) | low | reject: heute kein solcher Inhalt; Build-Abbruch bei leerer EN-Datei plus Unit-Test der Regel sichern ab |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/seo src/lib/components src/lib/content src/routes` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview 4173, Playwright mit temporärer Config; danach `static/kiez-scores/region-composites.json` zurücksetzen -- expected: grün
