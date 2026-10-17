---
title: 'Kühle und Warme Orte nur im Hitze- bzw. Kälte-Modus (#77)'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '05cb6baf2b991c11e6cb60d27c3e1f8ecfd05abf'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Kühle Orte und Warme Orte stehen im normalen Explorer unter Umwelt. Sie gehören zu den reduzierten Angeboten Hitze und Kälte (Epic #57) und sollen nur dort erscheinen.

**Approach:** Eine zentrale Regel in `app-mode.ts` legt fest, welcher Layer in welchem Modus verfügbar ist: `kuehle-orte` nur im Hitze-Modus, `waerme-orte` nur im Kälte-Modus, alle anderen überall. Der Explorer filtert damit Layer-Liste, Suche, „Häufig“, „Zuletzt“ und `?layers=` aus der URL. Links in den Explorer zu diesen Layern tragen den passenden Modus.

**Entscheidung (Matze 17.10.2026):** Beide Layer raus aus dem normalen Explorer. Alte Links ohne `mode` ziehen den Modus nach (Option a): Der Explorer ergänzt per `replaceState` `mode=hitze` bzw. `mode=kaelte`, die übrigen Parameter bleiben.

## Boundaries & Constraints

**Always:**
- Eine Regel, eine Stelle (`app-mode.ts`), mit Unit-Test; keine verstreuten Slug-Abfragen.
- Layer-Seiten `/layer/kuehle-orte` und `/layer/waerme-orte` bleiben bestehen (Methodik, SEO); ihr Explorer-Link trägt `mode=hitze` bzw. `mode=kaelte`. Ebenso der CTA auf `/kuehle-orte`.
- Tests zuerst, keine em-dashes, DE/EN unverändert lauffähig.

**Never:**
- Keine Änderung am Hitze- oder Kälte-Modus, an Daten, Sitemap, llms.txt oder Plausible-Pfaden.
- Keine anderen Layer betroffen.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default-Palette | `/explore` | weder Kühle noch Warme Orte in Liste, Suche („kühl“, „warm“), Häufig, Zuletzt | N/A |
| Hitze | `/explore?mode=hitze` | Kühle Orte verfügbar, Warme Orte nicht | N/A |
| Kälte | `/explore?mode=kaelte` | Warme Orte verfügbar, Kühle Orte nicht | N/A |
| Alter Link | `/explore?layers=kuehle-orte,laerm-den` ohne `mode` | URL wird zu `…&mode=hitze`, Hitze-Modus mit Kühle Orte; `laerm-den` bleibt in der URL | N/A |
| Beide im Link | `layers=kuehle-orte,waerme-orte` ohne `mode` | erster passender Layer bestimmt den Modus, der andere fällt weg | N/A |
| Falscher Modus | `layers=waerme-orte&mode=hitze` | Warme Orte fällt weg, kein Moduswechsel (expliziter `mode` gewinnt) | N/A |
| Layer-Seite | `/layer/kuehle-orte` | Explorer-Link `…layers=kuehle-orte&mode=hitze` | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/app-mode.ts` -- neu `isLayerAvailableInMode(slug, mode)` und `modeForLayer(slug)` (Modus-Nachzug). Test `app-mode.test.ts`.
- `src/routes/(with-header)/explore/+page.svelte:330-333` -- `manifestLayers` nach Modus filtern, bevor Palette (:1674), Legende (:1521), A11y-Layer (:1503) und Inspector `layerMeta` es bekommen. Das deckt `filterLayers`, `groupLayersByBundle`, Häufig (`layer-palette.svelte:87`) und Zuletzt (:94) ab. Modus wie bei :970 über `resolveAppMode(page.url.host, mode)`.
- `src/routes/(with-header)/explore/+page.ts:9` bzw. `+page.svelte:291` -- Modus-Nachzug nur ohne explizites `mode` und nur im Default-Modus: `goto(…, { replaceState: true })` mit gesetztem `mode`; danach `activeLayers` nach Modus filtern.
- `src/routes/(with-header)/layer/[slug]/+page.svelte:81-83` -- `inspectorHref` mit Modus für die beiden Slugs; `buildExplorerDeepLink(layers, mode?)` aus `src/lib/utils/url-state.ts:222` nutzen. Test `page.svelte.test.ts:601-652`.
- `src/routes/(with-header)/kuehle-orte/+page.svelte:15` -- CTA mit `mode=hitze`; Test `kuehle-orte/page.svelte.test.ts:23,81`.
- Tests ohne `mode`, die anzupassen sind: `tests/e2e/i18n-c4c.e2e.ts:89`, `tests/e2e/kaelte.e2e.ts:111-118`, `inspector-panel.svelte.test.ts:483-493` (Default-Treffer `waerme-orte` bleibt im Harness gültig, da Harness Hits injiziert; nur prüfen). `url-state.test.ts:101-117` bleibt (Parser bleibt generisch).
- Nicht ändern: `layer-synonyms.ts` (wirkt nur über gefilterte Liste), WebMCP (nur lesend), Sitemap/llms-Builder.

## Tasks & Acceptance

**Execution:**
- [x] `app-mode.ts` + Test -- Regel je Modus.
- [x] `explore/+page.svelte` (+ `+page.ts`) -- Layer-Liste und URL-Layer nach Modus filtern.
- [x] `layer/[slug]/+page.svelte`, `kuehle-orte/+page.svelte` + Tests -- Explorer-Links mit Modus.
- [x] Bestehende E2E ohne `mode` anpassen; neues E2E: Default-Palette und Suche ohne beide Layer, Hitze/Kälte je mit dem eigenen.

**Acceptance Criteria:**
- Given der normale Explorer, when die Person „kühl“ oder „warm“ sucht oder Umwelt aufklappt, then erscheinen weder Kühle noch Warme Orte.
- Given `/hitze` oder `/kaelte`, when die Person „Auf der Karte ansehen“ nutzt, then verhält sich der Explorer wie vor dieser Änderung.

## Implementation Notes

- Einstieg über pure Funktion `resolveExplorerEntry` in `app-mode.ts`; `pendingMode` hält den Nachzug-Modus bis `goto` fertig ist; `$effect` auf `appMode` filtert aktive Layer bei Moduswechsel ohne Remount.
- E2E 60 grün, nur bekanntes „Escape löscht Selection“ rot.

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Wechsel auf `/explore` ohne Remount (Link „voller navigator“) lässt Orte-Layer aktiv, aber ohne Palette/Legende | high | patch | Filter nur in `onMount`; `appMode` folgt `page.url`. Kein Test klickt den Link. |
| 2 | Während des Modus-Nachzugs zeigt `appMode` noch `default`: Legende/Metadaten fehlen kurz, Kälte-Index lädt evtl. nicht | medium | patch | `goto` asynchron, `ui.activeLayerSlugs` synchron gesetzt. Gleiche Ursache wie 1, eigener Fix (Pending-Modus). |
| 3 | Ungültiges `?mode=foo` gilt als explizit, Nachzug fällt aus, Layer still verworfen | low | patch | `searchParams.has('mode')`. |
| 4 | Default-E2E prüft nur Abwesenheit, besteht auch bei leerer Palette | medium | patch | Kein positiver Anker vor `toHaveCount(0)`. |
| 5 | Nachzug-E2E prüft nur URL; kein Kälte-Nachzug-E2E | low | patch | UI-Folge ungetestet. |
| 6 | Einstiegslogik inline ohne Unit-Test | low | patch | ADR-012 URL-State-Sync; pure Funktion. |
| 7 | Testname „Default-Inspector unverändert“ misst jetzt Verwerfen | low | patch | `mode=default` filtert Layer vorher. |
| 8 | Prototyp-Keys in `modeForLayer` ohne Test | low | patch | `Object.hasOwn` schützt, Test hält es fest. |
| 9 | `goto`-Fehler lässt Layer aktiv | low | reject | Nicht beobachtet; Pending-Modus aus 2 deckt Anzeige ab. |
| 10 | Hitze-Seite und Teaser bauen Link per Verkettung | low | reject | Gleiche URL; Hitze bleibt unverändert. |
| 11 | Verworfener Layer ohne Hinweis (WCAG 4.1.3) | low | reject | Nur bei manuell falschem `mode`; neue UI nötig. |
| 12 | Typ `Record<string, AppMode>` zu weit | low | reject | Kosmetik. |
| 13 | WebMCP kennt Modus nicht | low | reject | Tools nur lesend; Nachzug fängt Links ab. |
| 14 | `encodeURIComponent` im Layer-Link entfernt | false | reject | Slugs sind kebab-case aus dem MANIFEST. |
| 15 | `+page.ts` nicht geändert | low | reject | Spec erlaubt Filter in `+page.svelte`. |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte-explorer kaelte kuehle-orte hitze i18n-c4c a11y` -- expected: grün außer bekanntem „Escape löscht Selection“
