---
title: 'Kälte-Navigator: Explorer im Kälte-Modus (#73)'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '6d45d95d5126498fc9a18af1e7af7e2e3c0aa2e2'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** „Auf der Karte ansehen“ auf `/kaelte` öffnet den normalen Explorer. Der Inspector zeigt dann Kühle Orte, Trinkbrunnen und alle anderen Abschnitte, aber keine warmen Orte. Bei `/hitze` zeigt der Inspector ausschließlich die kühlen Orte (Epic #57).

**Approach:** Kälte-Modus analog zum Hitze-Modus: `?mode=kaelte` (und der Host `kaelte.navigator.berlin`) reduziert den Inspector auf eine neue Karte „warme Orte in der Nähe“ zur gewählten Adresse plus den Link „Alle Layer und Daten im vollen navigator.berlin“. Der Link auf `/kaelte` hängt `&mode=kaelte` an.

**Entscheidung (Matze 17.10.2026):** Ersetzt die #71-Entscheidung „keine Inspector-Karte“. Im Kälte-Modus erscheinen ausschließlich warme Orte: keine Kühle-Orte-Karte, kein Trinkbrunnen-Toggle, keine Kiez-, Wahl- oder Demografie-Abschnitte.

## Boundaries & Constraints

**Always:**
- Karte zeigt nur Angaben aus dem GeoJSON; `unknown` als „nicht geprüft“; Quelle und Prüfdatum je Ort; Status „laut OSM offen/geschlossen“ nur mit `oh`.
- Nächste 5 warme Orte zur gewählten Adresse mit Distanz, Kategorie, Winter-Öffnung, Aufenthalt ohne Konsum, Eintritt, Navi-Links; Kategorie-Filter wie auf `/kaelte`; Layer-Toggle, Erklärtext, Quelle/Details, Disclaimer und Melde-Link wie bei der Kühle-Orte-Karte.
- `resolveAppMode` akzeptiert `kaelte` als Override; Host-Erkennung bleibt.
- DE/EN von Hand, WCAG 2.2 AA, keine em-dashes, Tests zuerst.

**Never:**
- Keine Verhaltensänderung im Hitze-Modus, an der Kühle-Orte-Karte, am Trinkbrunnen-Toggle oder im Default-Inspector.
- Keine Änderung an Daten, Reroute (`/` → `/kaelte`) oder Plausible-Pfaden.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kälte-Modus per Link | `/explore?layers=waerme-orte&mode=kaelte`, Adresse gewählt | Inspector nur mit Warme-Orte-Karte + Voll-navigator-Link | N/A |
| Kälte-Host | `kaelte.navigator.berlin/explore?layers=waerme-orte` | wie oben | N/A |
| Hitze unverändert | `?mode=hitze` | nur Kühle-Orte-Karte + Trinkbrunnen-Toggle wie bisher | N/A |
| Default unverändert | ohne `mode` | voller Inspector wie bisher; warme Orte nur als Treffer/Layer | N/A |
| Layer aus | Kälte-Modus, `waerme-orte` nicht aktiv | Karte mit Hinweis/Toggle zum Einblenden statt Liste | N/A |
| Index lädt | Index noch nicht da | Ladehinweis | Fehler: Hinweis, kein Absturz |
| EN | `/en/explore?…&mode=kaelte` | UI englisch, Ortsnamen `lang="de"` | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/app-mode.ts:15-21` + `app-mode.test.ts:16-18` -- Override auf `hitze|kaelte|default` erweitern; bestehender Test, der `kaelte` als `default` festschreibt, wird bewusst angepasst.
- `src/lib/components/atlas/inspector-panel.svelte:484-502,622-711,741-788,818-827` -- `kaelteMode`, `reducedMode = hitzeMode || kaelteMode`, `hasWaermeOrte`; `shouldRenderSection` im Kälte-Modus nur `umwelt` mit Warme-Orte-Karte; `!hitzeMode`-Guards auf `reducedMode`; Per-Hit-Zeile für `waerme-orte` überspringen; Voll-navigator-Link auch im Kälte-Modus (eigene testid `kaelte-full-navigator`, gleicher Message-Key).
- Neu `src/lib/components/atlas/inspector-panel/waerme-orte-card.svelte` + Test -- Muster `kuehle-orte-card.svelte` (Shell, Toggle, Details, Disclaimer, Opt-out); Inhalt aus `nearestWaermeOrte`/`waermeKategorien` (`src/lib/kaelte/nearest-waerme-orte.ts`), Textbausteine wie `src/lib/components/kaelte/warme-orte-naehe.svelte`, `categoryLabel`.
- `src/lib/state/ui-context.svelte.ts:50,92` -- `waermeOrteIndex`.
- `src/routes/(with-header)/explore/+page.svelte:62,957-974` -- `getWaermeOrteIndex` lazy laden wie Kühle Orte.
- `src/routes/(with-header)/kaelte/+page.svelte:27` + `page.svelte.test.ts:51,59` -- `&mode=kaelte` anhängen.
- Inspector-Kälte-Zweig ist per Komponenten-Harness nicht treibbar (`$app/state`), daher E2E.

## Tasks & Acceptance

**Execution:**
- [x] `app-mode.ts` + Test.
- [x] `waerme-orte-card.svelte` + Test (Liste, Filter, unknown, Status, Details, EN).
- [x] `ui-context` + Explore-Loader.
- [x] `inspector-panel.svelte` Kälte-Zweig.
- [x] `/kaelte`-Link mit `mode=kaelte` + Test.
- [x] Messages DE/EN.
- [x] E2E: Link auf `/kaelte` → Explorer, Adresse wählen (Muster bestehender Inspector-E2E), Inspector zeigt nur Warme-Orte-Karte, keine Kühle-Orte-Karte/Trinkbrunnen; Hitze-Modus-Gegenprobe; axe.

**Acceptance Criteria:**
- Given `/kaelte`, when die Person „Auf der Karte ansehen“ nutzt und eine Adresse wählt, then zeigt der Inspector ausschließlich die nächsten warmen Orte und einen Link zum vollen navigator.
- Given der Hitze-Modus, when eine Adresse gewählt wird, then verhält sich der Inspector wie vor dieser Änderung.

## Implementation Notes

- E2E setzt die Adresse per URL (`address=lng,lat&q=…`), weil die Combobox-Auswahl in dieser Umgebung auch ohne Änderung scheitert.
- Sektionstitel im Kälte-Modus „Umwelt“ wie im Hitze-Modus.
- Review-Patch 6: Helfer in `src/lib/kaelte/waerme-ort-labels.ts` geteilt; `<li>`-Markup bleibt getrennt (h3 vs. span, eigene Typografie).

## Spec Change Log

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Default-Inspector verliert Treffer-Zeile für `waerme-orte` | high | patch | Leerer `{:else if}`-Zweig läuft nur bei `!reducedMode`, also nur im Default; verletzt „Default unverändert“. Alle drei Reviews. |
| 2 | Kälte-E2E prüft Fehlen von Kiez-Score, Wahl, Demografie, Sozial, Hit-Zeilen nicht; `section-memorial` existiert nicht | medium | patch | Revert von `!reducedMode` bliebe grün. |
| 3 | Ladefehler im Explore-Loader ungetestet | medium | patch | Kein E2E mit 404 auf `/explore`. |
| 4 | Opt-out-Mail nennt „Kühle-Orte-Karte“ | medium | patch | `buildOptOutMailto()` ohne Layer-Parameter. |
| 5 | Wärme-Index lädt in jedem Modus | medium | patch | Extra-Fetch im Default/Hitze, Spec „Default unverändert“. |
| 6 | Helfer und Listenmarkup aus `warme-orte-naehe.svelte` kopiert | medium | patch | Regel Wiederverwendung; Drift-Risiko bei „nicht geprüft“. |
| 7 | Deep-Link per String-Verkettung `&mode=kaelte` | low | patch | Bricht bei leerer Layer-Liste; `buildExplorerDeepLink` bekommt `mode`. `home-hitze-teaser` bleibt (Hitze unverändert). |
| 8 | `categoryLabel` ignoriert `lang`-Prop | low | patch | Liest Runtime-Locale. |
| 9 | Melde-Mail mit Roh-Kategorie statt Label | low | patch | Abweichung zu `/kaelte`. |
| 10 | Doc-Kommentare an neuen UiState-Feldern fehlen | low | patch | Nachbarfelder haben sie. |
| 11 | Voll-navigator-Link verlässt Modus auf Kälte-Host nicht, verliert Adresse | low | defer | Gleicher Fehler im Hitze-Modus; Host noch nicht live; Fix für beide gehört zusammen. |
| 12 | Kälte-Host ohne Inspector-Test | low | defer | `resolveAppMode` per Unit-Test abgedeckt; Host-E2E braucht Host-Override im Preview. |
| 13 | Kein Retry-Button, Zähler nur per Ansage | low | defer | Neue Adresse lädt neu; Kühle-Orte-Karte hat dasselbe Muster. |
| 14 | Sektions-Zähler zählt im reduzierten Modus versteckte Treffer | low | defer | Bestehendes Hitze-Verhalten. |
| 15 | Code-Map-Zeilennummern veraltet | low | reject | Planungsnotiz, kein Vertrag. |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün (Flake winter-map/root-axe dokumentieren)
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte kuehle-orte i18n-c4c a11y` -- expected: grün außer bekanntem „Escape löscht Selection“
