# Update-Entries (Story 2.13)

Jede Datei in diesem Verzeichnis ist ein Update-Entry.

## Naming

`YYYY-MM-DD-{slug}.md`, ein Eintrag pro Datei.

Beispiel: `2026-05-16-kiez-score-versorgungs-dimension.md`

## Frontmatter

```yaml
---
title_de: "Kiez-Score: Versorgungs-Dimension ergänzt"
summary_de: "Fünfte Dimension Kita, Schule, Krankenhaus, Spielplatz, Grünanlage live."
date: 2026-05-16
category: feature
tags: [kiez-score, dimensionen]
---
```

Schema-Validation: `src/lib/content/updates/frontmatter-schema.ts` (Valibot).
Schema-Verstoß ist Build-Fehler.

## Pflicht-Felder

- `title_de` ≤ 80 Zeichen
- `summary_de` ≤ 160 Zeichen (Meta-Description-Fitness)
- `date` ISO-8601 `YYYY-MM-DD`
- `category` einer der 5 Werte: `daten-update | feature | methodik | datenquelle | lizenz`

## Optionale Felder

- `tags` max 8, lowercase-kebab-case
- `lang` `de | en` (default `de`)
- `title_en` / `summary_en` für Phase 3 EN-Coverage

## Body

Regulärer GitHub-flavored Markdown. Bevorzugt 300 bis 1000 Wörter (Long-Tail-SEO-Sweet-Spot).
Über 1500 Wörter? Lieber eigene Methodik-Sub-Page oder ADR.

## Runbook

Vollständiger Update-Workflow: `docs/runbooks/add-update-entry.md`.
