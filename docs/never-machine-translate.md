---
type: editorial
audience: owner
last-verified: 2026-05-17
---

# Never-Machine-Translate-Flag

Single-Source-of-Truth: `src/lib/components/atlas/internal/editorial-config.ts`

## Welche Layer sind betroffen

Layer mit `neverMachineTranslate: true`:

- `stolpersteine` (FR51, FR55i): Personen-Hintergründe niemals algorithmisch generieren oder maschinell übersetzen
- `mauer-sektoren` (FR52): Historische Geometrie und Erinnerungs-Kontext editorial sensibel

## Pflichten für Translation-Pipeline (Story 3.3, 3.5)

1. Übersetzungs-Skript MUSS `getEditorialConfig(slug).neverMachineTranslate` prüfen
2. Bei `true`: Layer-Beschreibung, Inschrift, Personen-Name NICHT durch DeepL/MT-Provider schicken
3. Stattdessen: DE-Original mit Hinweis `Editorial-Sensible — nicht maschinell übersetzt` in Ziel-UI
4. Wikipedia-Link aus `wikipedia:{lang}`-OSM-Property nutzen, falls vorhanden

## Konsumierung im UI

`StolpersteinDetail` rendert OSM-Properties wortwörtlich. Kein generierter Text, kein Mock, kein LLM-Fill-in.

## Compliance-Bezug

NFR-IL9 (Editorial-Verantwortung), FR50 (Stolpersteine Würde), FR55 (Sensible Inhalte).
