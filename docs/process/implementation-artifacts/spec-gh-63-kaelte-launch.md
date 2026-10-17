---
title: 'Kälte-Navigator: Launch (#63)'
type: 'feature'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: 'febac9ec851be3cae866fc018a9104bcf55b2726'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/kaelte` ist fertig, aber unsichtbar: `noindex`, nicht in Sitemap und llms.txt, kein Link von Startseite, Footer oder Über-Seite. Überall dort steht der Hitze-Navigator (Epic #57).

**Approach:** Überall, wo die Seite auf den Hitze-Navigator verweist, verweist sie auch auf den Kälte-Navigator: Startseiten-Teaser, Footer/Mobil-Menü (`meta-links`), Über-Seite, Sitemap, llms.txt. `noindex` auf `/kaelte` fällt weg. Dazu ein Updates-Eintrag DE/EN.

**Entscheidung (Matze 17.10.2026):** „Wo Hitze verlinkt war, muss auch Kälte verlinkt werden“, Startseite anpassen. Launch noch am 17.10.2026, nicht erst Ende Oktober.
- Startseite: beide Teaser, Reihenfolge saisonal. In der Kälte-Saison (`isKaelteSaison`, 1.10. bis 30.4.) steht der Kälte-Teaser zuerst und groß, der Hitze-Teaser kompakt darunter; sonst umgekehrt.
- Updates-Eintrag fest datiert auf 2026-10-17 in `_content/updates/`.
- Über-Seite `ueber_projekt_p2`: „Online ist die Seite seit Mai 2026. Im August 2026 hat die taz über den Hitze-Navigator berichtet. Seit Herbst 2026 zeigt der Kälte-Navigator warme Orte für den Winter. Den Verlauf zeigen die Updates.“ (EN analog, Links auf taz, Hitze-, Kälte-Navigator, Updates).

## Boundaries & Constraints

**Always:**
- Kälte-Teaser nach dem Muster `home-hitze-teaser.svelte` (Landing-Link `/kaelte`, Karten-Link `buildExplorerDeepLink(['waerme-orte'], 'kaelte')`), eigene Messages DE/EN, Flammen-Icon.
- Texte nennen nur belegte Zahlen aus den Daten (227 warme Orte); keine Notübernachtung versprechen.
- Footer-Eintrag „Kälte-Navigator“ / „Cold Navigator“ direkt nach „Hitze-Navigator“ in Gruppe `erkunden`.
- Sitemap und llms.txt bekommen `/kaelte` analog zu `/hitze`; Konsistenztest bleibt grün.
- WCAG 2.2 AA, keine em-dashes, Tests zuerst.

**Never:**
- Keine Änderung an bestehenden Updates-Einträgen, am Hitze-Teaser-Inhalt, an `/hitze`, an Daten.
- Keine Presse-Ansprache (macht Matze), kein Deploy.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Startseite | `/`, `/en` am 17.10. | Kälte-Teaser zuerst und groß, Hitze-Teaser kompakt darunter | N/A |
| Startseite Sommer | Datum 15.07. | Hitze-Teaser zuerst und groß, Kälte-Teaser kompakt darunter | N/A |
| Footer | jede Seite | Link „Kälte-Navigator“ nach „Hitze-Navigator“, EN `/en/kaelte` | N/A |
| Über-Seite | `/ueber` | Satz nennt Kälte-Navigator mit Link | N/A |
| Indexierung | `/kaelte` | kein `noindex`; in `sitemap.xml` und `llms.txt` | N/A |
| Kälte-Host | `kaelte.navigator.berlin/` | unverändert (Reroute) | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/+page.svelte:77` -- `<HomeHitzeTeaser />`; hier Kälte-Teaser einhängen.
- `src/lib/components/home/home-hitze-teaser.svelte` (+ Test) -- Vorlage für neu `home-kaelte-teaser.svelte` (+ Test); Messages `home_hitze_*` (de.json:378-382) als Muster für `home_kaelte_*`.
- `src/lib/utils/berlin-time.ts:123-128` -- `isKaelteSaison` ; Datum für Tests injizierbar (Prop oder Parameter), Startseite ist SSR.
- `src/lib/components/atlas/internal/meta-links.ts:27,58,76,113` -- ID `kaelte`, Eintrag, Gruppe `erkunden`, Label `shell_meta_link_kaelte`. Tests `meta-links.test.ts:50-59`, `meta-footer.svelte.test.ts:146`.
- `src/routes/(with-header)/ueber/ueber-links.ts:32,66` + `ueber/+page.svelte:33` + `ueber_projekt_p2` (de.json:2300) -- Marker `kaelte`; Test `ueber/page.svelte.test.ts:148`.
- `src/routes/(with-header)/kaelte/+page.svelte:43-50` -- `noindex` entfernen; Test `kaelte/page.svelte.test.ts:97-101` umdrehen.
- `src/lib/seo/sitemap-builder.ts:154` + Test `:184,377-379`; `src/lib/seo/llms-builder.ts:130-136` + Test `:207-210`; `llms-sitemap-consistency.test.ts`.
- `tests/e2e/seo-indexierung.e2e.ts:4-70` -- Hitze-Fälle als Muster für Kälte (indexierbar, in Sitemap).
- `_content/updates/README.md`, `2026-07-01-kuehle-orte(.en).md` -- Format Updates-Eintrag (Frontmatter im DE-File, EN-Body in `.en.md`, Links `/en/...`); Schema `src/lib/content/updates/frontmatter-schema.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `home-kaelte-teaser.svelte` + Test, Einbau auf `+page.svelte` mit saisonaler Reihenfolge und kompakter Variante beider Teaser, Messages DE/EN.
- [x] `meta-links.ts` + Tests, Message `shell_meta_link_kaelte`.
- [x] Über-Seite: Marker + Message laut Entscheidung + Test.
- [x] `/kaelte` ohne `noindex`; Sitemap, llms.txt + Tests.
- [x] `_content/updates/2026-10-17-kaelte-navigator.md` + `.en.md`.
- [x] E2E: Startseite zeigt Kälte-Link, Footer-Link führt zu `/kaelte`, `/kaelte` indexierbar und in Sitemap; axe auf `/`.

**Acceptance Criteria:**
- Given die Startseite, when die Person sie öffnet, then findet sie in der Kälte-Saison den Kälte-Navigator zuerst und den Hitze-Navigator darunter.
- Given eine Suchmaschine, when sie `sitemap.xml` liest, then findet sie `/kaelte` und `/en/kaelte` indexierbar.

## Implementation Notes

- `home-saison-teasers.svelte` ordnet per `isKaelteSaison(now)`; `compact` blendet Eyebrow und Lead aus.
- E2E 77 grün; rot: bekanntes „Escape löscht Selection“ und flaky „Root (Karte) axe“ (Kontrast im Inspector während Einblend-Animation, Pariser Platz; nicht Startseite, mal grün, mal rot ohne Änderung).
- Unit: winner-map einmal flaky, einzeln 13/13 grün.

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Updates-Überschrift „Was der Kälte-Navigator zeigt“ / „What … shows“ | medium | patch | Feste Regel: keine Headlines mit „Was“. Zwei Reviews + eigene Prüfung. |
| 2 | Summary „227 warme Orte mit Winter-Öffnung“ falsch; „212 belegt“ verschweigt 36 eingeschränkte | medium | patch | GeoJSON: winter_open yes 176, limited 36, unknown 15. |
| 3 | Zwei gleichnamige Links „Direkt zur Karte“ mit verschiedenen Zielen | medium | patch | WCAG 2.4.4/2.4.9; Kälte-Label eindeutig machen. |
| 4 | Zwei „Neu“-Eyebrows im Winter | low | patch | Kompakte Variante blendet Eyebrow aus (Hitze-Text bleibt). |
| 5 | Saisongrenze 30.09./01.10. und Zeitzonen-Fall ungetestet | low | patch | Nur 30.04./01.05. 10:00Z geprüft. |
| 6 | `/en/kaelte` Indexierbarkeit ungetestet | low | patch | E2E nur DE. |
| 7 | EN „Operators exercise their house rules“ holprig | low | patch | Wörtliche Übersetzung. |
| 8 | Hydration-Wechsel an Saisongrenze um Mitternacht | low | reject | Sekundenfenster zweimal im Jahr; Server-Load wäre neue Fläche. |
| 9 | Kein Mail-Kontakt im Updates-Text | low | reject | Gleiches Muster wie Hitze-Eintrag; Opt-out-Link auf Seite und Karte. |
| 10 | Hitze-Teaser baut Link per Verkettung | low | reject | Hitze-Teaser-Inhalt bleibt laut Spec. |
| 11 | axe nur für aktuelles Saison-Layout | low | reject | Beide Teaser erscheinen in beiden Layouts. |
| 12 | Subdomain-Reroute und Dubletten ungeprüft | low | reject | DNS/Traefik bei Matze; canonical mappt auf Hauptdomain. |
| 13 | Spec nicht im Diff | false | reject | Bewusst getrennt (claims_file). |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check`, `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte seo-indexierung i18n-c4c a11y` -- expected: grün außer bekanntem „Escape löscht Selection“
