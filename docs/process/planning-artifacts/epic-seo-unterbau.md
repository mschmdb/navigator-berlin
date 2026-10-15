# Epic: SEO-Unterbau härten

Stand 15.10.2026. Quelle: `seo-audit-2026-10-15.md`. Matze 15.10. 08:13: „merk dir das als epic, schneid es in stories, arbeite es story für story ab, selbständig“.

## Ziel

Suchmaschinen indexieren nur die gewollten URLs, verstehen Orte und Datensätze als zusammenhängende Entitäten und bekommen verlässliche Sitemap-Daten. Live-Fehler (Hitze-Canonical) verschwinden.

## Arbeitsweise

- Jede Story über bmad-build als voller Lauf (Spec, drei Reviewer), eigener Branch, gestapelt ab `origin/main`.
- Spec-Checkpoint unter stehender Freigabe: offene Fragen nach Empfehlung entscheiden, im Spec als „Empfehlung, Freigabe Matze 15.10.“ markieren.
- Kein Push, kein PR, kein Deploy ohne Matze. Am Ende eine Release-Branch für seine QA.

## Stories

| # | Story | Befunde Audit | Prio |
|---|---|---|---|
| S1 | Indexierungs-Hygiene: Hitze-Canonical und Subdomain-Origin zentral normalisieren; `noindex, follow` für `/explore` mit Query; Fehlerseite mit Titel und `noindex`; `/demo` noindex; `robots.txt` `Disallow: /api/` in allen Gruppen | 1, 2, 10, 12, 13 | hoch |
| S2 | Head-Lücken: Feed-Links ohne `hreflang`; `/methodik/wahldaten` mit OG-Bild und Twitter-Card; Updates mit `og:type=article`, `article:published_time`, BlogPosting `image`/`dateModified`; Update ohne EN-Fassung auf noindex | 8, 9, 11 | mittel |
| S3 | JSON-LD-Entitäten: ein WebSite-Block nur auf der Startseite ohne SearchAction plus `Organization` mit Logo; Kiez/Bezirk als eine `AdministrativeArea` mit `@id`, `containedInPlace` auf die Bezirksseite, `sameAs` Wikidata wo vorhanden | 4, 5 | mittel |
| S4 | Dataset-JSON-LD vollständig für Google Dataset Search (url, spatialCoverage, temporalCoverage, creator.url, isAccessibleForFree, includedInDataCatalog, stabile Download-URL) | 6 | mittel |
| S5 | Sitemap-Qualität und Build-Härte: `lastmod` aus echten Inhaltsdaten oder weglassen; Wahl-Sitemap und Prerender-Fehler brechen den Prod-Build statt still zu verschwinden | 3, 7 | hoch |
| S6 | Titel und Beschreibungen: Wahl-Titel kürzen, Erst-/Zweitstimme unterscheiden, Layer-Beschreibungen mit Kontext auf 70-160 Zeichen | 14 | niedrig |
| S7 | Übersichtsseiten `/kieze` und `/bezirke` (und Layer-Übersicht), im Footer und Breadcrumb verlinkt | 15 | niedrig |

Font-Preloads (Befund 16) bleiben offen, eigene Performance-Messung nötig.

## Backlog

- **Weitere Sprachen aus SEO-Sicht** (Matze 15.10.2026: nur Backlog, keine Umsetzung jetzt). Voraussetzung: EN 6-8 Wochen nach Deploy des Epics in GSC messen. Schwelle: EN-Impressionen auf Kiez-/Bezirksseiten mindestens 20 % der DE-Impressionen. Sprache nach Suchvolumen wählen (Kandidaten ungeprüft: Türkisch, Arabisch mit RTL, Russisch/Ukrainisch, Polnisch, Spanisch). Risiken: Googles Richtlinie gegen massenhaft erzeugte Inhalte bei ungeprüften Übersetzungen, Crawl-Budget der jungen Domain. Stand der Zahlen 15.10.: GSC 3 Monate rund 87 % der Klicks aus Deutschland; Plausible 28 Tage 70 von 399 Sessions starten auf `/en`.
- **About-Seite** (Matze 15.10.2026: fehlt, Backlog). Wer steckt hinter navigator.berlin, warum, wie finanziert, Kontakt. SEO-Bezug: E-E-A-T-Signal für Google, Ziel für `Organization`-JSON-LD (S3) und Footer. Quellen für Inhalt (Matze): `<lokales Talk-Repo>` (Talk 02.09.2026: Entstehung, Motivation) und `<lokales Portfolio-Repo>` (Person, Profil).
