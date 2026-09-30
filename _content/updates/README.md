# Update-Entries (Story 2.13)

Jede Datei in diesem Verzeichnis ist ein Update-Entry.

## Naming

`YYYY-MM-DD-{slug}.md`, ein Eintrag pro Datei.

Beispiel: `2026-05-16-kiez-score-versorgungs-dimension.md`

## Frontmatter

```yaml
---
title_de: 'Kiez-Score: Versorgungs-Dimension ergänzt'
summary_de: 'Fünfte Dimension Kita, Schule, Krankenhaus, Spielplatz, Grünanlage live.'
date: 2026-05-16
category: feature
tags: [kiez-score, dimensionen]
---
```

Englische Fassung: Schwesterdatei `YYYY-MM-DD-{slug}.en.md` mit dem englischen Body,
ohne Frontmatter. Beispiel: `2026-05-16-launch.en.md`. Titel und Summary stehen als
`title_en` und `summary_en` im Frontmatter der DE-Datei.

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
- `title_en` ≤ 80 Zeichen / `summary_en` ≤ 160 Zeichen: Titel und Summary der EN-Fassung.
  Fehlt eines der beiden, zeigt `/en/updates` an dieser Stelle den DE-Text mit `lang="de"`.

## Body

Der DE-Body steht in `{slug}.md`, der EN-Body in `{slug}.en.md`. Fehlt die `.en.md`,
zeigt `/en/updates/{slug}` den DE-Body mit `lang="de"`. Eine `.en.md` ohne DE-Datei
bricht den Build ab. Interne Links im EN-Body tragen den Präfix `/en`. Die Feeds
(`rss.xml`, `atom.xml`, `feed.json`) enthalten nur die DE-Fassung.

Regulärer GitHub-flavored Markdown. Bevorzugt 300 bis 1000 Wörter (Long-Tail-SEO-Sweet-Spot).
Über 1500 Wörter? Lieber eigene Methodik-Sub-Page oder ADR.

## Runbook

Vollständiger Update-Workflow: `docs/runbooks/add-update-entry.md`.
