---
title: 'i18n Block C4c: Hitze, Kühle Orte und Lizenzen auf Englisch'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: '2920c7f897e5d0a6652d700bf1dca85c5e55068d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c4b-wahl-methodik-technik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/en/hitze`, `/en/kuehle-orte` und `/en/lizenzen` zeigen deutschen Inhalt mit Fallback-Banner und `noindex`. Die Hitze-FAQ ist fest deutsch (`contentLocale="de"` seit C3), die Kühle-Orte-Komponenten und die Lizenz-Tabellen sind hart kodiert.

**Approach:** Wie C4a/C4b: Wir übernehmen die abgenommene Übersetzung aus `c4c-uebersetzung.json` als Paraglide-Messages, interne Seiten-Links laufen über `localizedHref`, danach kommen die drei Routen als exakte Einträge ins `TRANSLATION_REGISTER`. Der sichtbare Linktext „/lizenzen“ auf den C4a-Seiten wird durch ein Label ersetzt (deferred aus C4a).

## Boundaries & Constraints

**Always:**
- Übersetzung: `_bmad-output/implementation-artifacts/c4c-uebersetzung.json` (DE wörtlich, EN abgenommen), Entscheidungen in `c4c-uebersetzung-review.md`.
- DE-Ausgabe Zeichen für Zeichen gleich, außer abgenommenen Korrekturen. DE-Parität per explizitem DE-Wortlaut-Test je Seite (inkl. `li` mit Links, `aside`, Buttons, Meta), nicht nur per `textLines`-Snapshot (Lehre C4b). Kein Test liest `_bmad-output/`.
- Hitze-FAQ in der Seiten-Locale, `lang` nur bei Abweichung (Mechanik aus C3). FAQPage-JSON-LD folgt dem Inhalt.
- Live-DWD-Warntexte aus der API bleiben, wie sie kommen. Feste UI-Texte werden übersetzt.
- Lizenz-Kennungen, Software-Namen und URLs unverändert.
- JSON-LD (Breadcrumb, Dataset auf `/hitze`) in der Seiten-Locale, Breadcrumb-Wurzel über `localizedHref('/')`.
- Register: drei exakte Einträge. Grep-Audit vorher.
- TDD pro AC.

- Entscheidung Matze 30.09. 10:15: DE-Korrekturen laut Abschnitt „Abnahme“ in `c4c-uebersetzung-review.md` (14 Wahlen, drei Datenanbieter, Lizenz-Anzahl aus den Daten, neuer Quellen-Eintrag Landeswahlleiterin 2026, Linktext-Label). Zählbare Texte mit Pluralform.

**Never:**
- DataCatalog-JSON-LD auf `/lizenzen` bleibt DE, auch auf `/en/lizenzen`: die Datasets zeigen auf `/layer/…`, das erst im Abschluss-Block registriert wird. Kommentar in `lizenzen/+page.ts` entsprechend anpassen.
- Kein `sitemap-en.xml`-Eintrag, OG-Bilder bleiben DE.
- `/impressum`, `/datenschutz` bleiben deutsch (Entscheidung Matze 30.09.), `/updates` folgt in C4d.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hitze EN | `/en/hitze` | Seite und FAQ englisch, kein `lang="de"` an der FAQ, kein Banner | N/A |
| DWD-Warnung aktiv | Live-Warnung vorhanden | fester Rahmen englisch, Warntext unverändert | DWD nicht erreichbar: EN-Fallback-Hinweis |
| Kühle Orte EN | `/en/kuehle-orte` | Rahmen englisch, Karte eingebettet | N/A |
| Lizenzen EN | `/en/lizenzen` | Tabellen englisch, Kennungen unverändert, DataCatalog-JSON-LD DE | N/A |
| Linktext C4a | `/en/methodik` Lizenz-Verweis | Label statt Pfad „/lizenzen“ | N/A |
| DE unverändert | DE-Routen | Texte identisch (außer abgenommenen Korrekturen) | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/hitze/+page.svelte` (244 Z., `prerender = false`) -- Dataset-/Breadcrumb-JSON-LD `:56-80`, Link `/layer/kuehle-orte` `:156`, `FaqSection … contentLocale="de"` `:241`. Test `page.svelte.test.ts`.
- `src/lib/content/hitze-faq.ts` -- `HITZE_FAQ` → locale-fähig (Funktion oder Messages), Konsument nur `/hitze`.
- `src/lib/components/kuehle-orte/{dwd-hitzewarn-banner,in-deiner-naehe,kuehle-orte-transparenz}.svelte`, `transparenz-content.ts` -- Konsument `/hitze` (Tests mitziehen). Datums-/Zahlformat über `$lib/i18n/format.ts`.
- `src/routes/(with-header)/kuehle-orte/+page.svelte` (65 Z.).
- `src/routes/(with-header)/lizenzen/+page.svelte` (526 Z.: Arrays in eine `lizenzen-content.ts` auslagern, Datei unter 500 Z.), Links `:286`, `:355`, Breadcrumb `:136`. `+page.ts` DataCatalog bleibt DE (Kommentar anpassen). Tests `page.svelte.test.ts`, `page.load.test.ts`.
- `messages/{de,en}.json` `methodik_licences_full_list`, `methodik_kiez_score_sources_p1` -- Linktext-Label (C4a-deferred), C4a-Snapshots nachziehen.
- `src/lib/seo/translation-register.ts` + Test, `sitemap-builder.test.ts` (nutzt `/lizenzen` als Seite ohne Alternates, auf `/impressum` umstellen).
- Muster: `src/lib/i18n/rich-text.ts`, `rich-text.svelte`, `methodik-test-utils.ts`, `tests/e2e/i18n-c4b.e2e.ts`.

## Tasks & Acceptance

**Execution:**
- [x] Messages aus `c4c-uebersetzung.json`, DE-Baseline-Wortlaut für Tests sichern
- [x] `/hitze` + Hitze-FAQ + Kühle-Orte-Komponenten (+ Tests)
- [x] `/kuehle-orte` (+ Tests)
- [x] `/lizenzen` inkl. Auslagerung, DataCatalog DE (+ Tests)
- [x] Linktext „/lizenzen“ auf C4a-Seiten ersetzen (+ Tests)
- [x] Grep-Audit, Register, Sitemap-Test auf `/impressum` (+ Tests)
- [x] e2e: drei Seiten EN ohne Banner, indexierbar, Links unter `/en`, axe; Hitze-FAQ ohne `lang="de"`
- [x] `deferred-work.md`: C4a-Linktext-Eintrag und B4b-`/lizenzen`-Einträge als erledigt bzw. offen markieren
- [x] Zeitmessung

**Acceptance Criteria:**
- Given die drei `/en`-Routen im Build, when sie laden, then fehlen Banner und `noindex`, Seiten-Links beginnen mit `/en`, und der Grep-Audit findet keinen DE-Text außerhalb von Eigennamen, Glossar, Live-DWD-Text und DataCatalog-JSON-LD.
- Given die DE-Routen, when sie laden, then ist der sichtbare Text identisch zum Stand vor C4c, außer abgenommenen Korrekturen.

## Implementation Notes

- 30.09. Umsetzung 10:15-10:35 (ca. 20 min inkl. Build und e2e), ein Agent ohne Sub-Subagenten.
- 149 Messages aus `c4c-uebersetzung.json` (Präfixe `hitze_`, `hitze_faq_`, `dwd_banner_`, `naehe_`, `transparenz_`, `kuehle_orte_page_`, `lizenzen_`), dazu `naehe_announce_found_singular`/`_plural` (DE-Singular „{count} offener kühler Ort …“) und vier `map_embed_*`-Messages. Die `map_embed_*`-Texte stehen nicht im abgenommenen JSON: `MapEmbed` hatte hart deutsche Aria-/Alt-/Caption-Texte („Karten-Embed: …“). DE-Wortlaut unverändert, EN eigene Übersetzung, bitte prüfen.
- Umbauten: `HITZE_FAQ` wird `getHitzeFaq()`, `KUEHLE_ORTE_QUELLEN`/`HALTUNG` werden `getKuehleOrteQuellen()`/`getKuehleOrteHaltung()`, `/lizenzen` lagert Abschnitte, Lizenz-Infos, Gruppierung und Software-Tabelle nach `lizenzen-content.ts` aus (Seite 526 auf 479 Zeilen, mit Unit-Test).
- DE-Korrekturen laut Abnahme: 14 Wahlen, drei Datenanbieter, Lizenz-Anzahl aus den Daten, Eintrag Landeswahlleiterin Berlin (Link wahlen-berlin.de, Reihenfolge Bundeswahlleiterin, Amt für Statistik, Landeswahlleiterin), Linktext-Label, Singular „1 offener kühler Ort“.
- DWD-Banner: Stufe und Quelle sind Messages, die Live-`headline` bleibt und trägt auf EN-Seiten `lang="de"`. Trägt die Headline nur das vom Server gesetzte DE-Label (Fallback), zeigt das Banner das übersetzte Label.
- `formatDistance` mit `getLocale()` statt fester DE-Variante, `getLayerDisplayName`/Sortierung auf `/lizenzen` mit Seiten-Locale.
- JSON-LD: Dataset und Breadcrumb auf `/hitze` und Breadcrumb auf `/lizenzen` in der Seiten-Locale, Canonical und `contentUrl` auf `/en/hitze`. DataCatalog auf `/lizenzen` bleibt DE.
- A11y-Fix (nebenbei, wirkt auch in DE): `MapEmbed`-Canvas bekommt `tabindex="-1"`, weil der Container `aria-hidden` ist (axe `aria-hidden-focus`).
- Sitemap-Test: `/impressum` steht nicht in der Sitemap. Die Kontrolle „Seite ohne Alternates“ nutzt deshalb eine Layer-Detailseite (bis zum Abschluss-Block). Die Kontrolle „bleibt unübersetzt“ im Register-Test nutzt `/updates`, `/impressum`, `/datenschutz`.
- Hitze-Reroute-Test (B2) angepasst: `/hitze` ist registriert, der en-Alternate zeigt auf `/en/hitze`, nie auf die Startseite.
- Nicht übersetzt (außerhalb des Auftrags): Betreff und Body der Opt-out-Mail (`buildOptOutMailto`, DE).

- Zeitmessung (Koordinator): Übersetzung 10:06-10:09, Spec 10:08, Abnahme Matze 10:15, Umsetzung 10:15-10:35 (20 min), Review 10:35-10:39, Patches 10:39-10:42, Verifikation 10:42-10:58. Qualität: 28 Review-Funde in 21 Einträgen, 13 gepatcht, 3 deferred, 5 rejected.
- Nicht abgenommene EN-Texte: `map_embed_*` (4), `naehe_cat_*` (11 Kategorien), `contact_optout_*`. „in hot weather“ nur in `hitze_*`/`hitze_faq_*`/`kuehle_orte_page_*`; Shell-Link `shell_meta_link_hitze` und `home_hitze_*` sagen weiter „during heat“.
- hreflang auf `/hitze` jetzt mit Hauptdomain-Origin wie Canonical (vorher Subdomain-Host).

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 10:39), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 9, Verification Gap (VG) 3 + 2. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | EC | Nähe-Liste zeigt Roh-Kategorien (Bibliothek, Schwimmzentrum …) auf `/en/hitze` | medium | `{ort.cat}` ungemappt, 11 Werte in den Daten | P: Label-Messages |
| 2 | BH | MapEmbed-Caption „des Bezirks Kühle Orte in Berlin“, EN uneinheitlich | low | einziger Aufrufer `/kuehle-orte` | P: neutral |
| 3 | BH/EC/VG | `lizenzen_daten_p1` ohne Pluralform, DE-Folgesatz ohne Bezugswort | low | Spec verlangt Pluralform | P |
| 4 | EC | hreflang auf `hitze.navigator.berlin` vs. Canonical Hauptdomain | maybe-false | Implementierer prüft Auslieferung | P (prüfen, ggf. fixen) |
| 5 | EC | leere DWD-Headline rendert leeres Span | low | | P |
| 6 | BH/EC | Keywords `split(', ')` | low | | P |
| 7 | BH | Opt-out-Mail auf `/en/hitze` deutsch | low | AC „kein DE-Text“ | P |
| 8 | BH | CC-BY-Link `deed.de` auf EN | low | | P |
| 9 | BH | Tabellenkopf „Library“ ohne Message | low | | P |
| 10 | BH | EN-Idiome („during heat“, „domiciliary rights“ …) | low | | P |
| 11 | BH | Linktext „Vollständige Auflistung: Lizenzen-Seite“ hölzern | low | | P |
| 12 | VG | EN-Layer-Namen auf `/lizenzen` ungetestet | medium | Weglassen von `{ locale }` bliebe grün | P |
| 13 | VG | Distanz-Format ≥ 1 km ungetestet | low | | P |
| 14 | VG | `explorerHref` auf Seitenebene ungetestet | low | Harness-Aufwand | D |
| 15 | BH | „vier Berliner Wetterstationen (… Brandenburg)“ | low, unverifiziert | Quelle prüfen | D |
| 16 | BH/EC | Breadcrumb-Wurzel „Berlin“ vs. „Start/Home“ | low | vorbestehende Benennung | R |
| 17 | BH | „14 Wahlen“, „drei Datenanbieter“ fest | low | redaktionell, wie C4b | R |
| 18 | BH | DWD-Fallback per String-Vergleich, `warning.source` ungenutzt | low | Server-Fallback getestet, beide Werte gleich | R |
| 19 | BH | Resttext-Tests nur mit Stichwörtern | low | Kategorie-Fund jetzt mit eigenem Test | R |
| 20 | EC | Sitemap-Kontrolle `/layer/mietspiegel-2024` bricht bei `/layer`-Registrierung | low | Abschluss-Block zieht nach | D |
| 21 | BH | `map_embed_*` EN nicht abgenommen | low | in Zusammenfassung an Matze | R |

## Design Notes

- Links auf noch nicht registrierte Seiten zeigen nach `/en/…` (Linie C4a/C4b), der Banner dort erklärt den Stand.
- e2e-Links erst nach `await expect(links.nth(n)).toBeAttached()` lesen.

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün (bekannter Flake `winner-map.svelte.test.ts`)
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint:wahl`, `pnpm lint:cleartext` -- expected: 0 Verstöße
- `pnpm build` + e2e `i18n-*`, `methodik-flow`, `hitze*`/`kuehle*` falls vorhanden -- expected: grün (Port 4173 belegt: temporäre Config auf freiem Port, danach löschen; `static/kiez-scores/region-composites.json` nach dem Build zurücksetzen) -- **grün**: voller Build 0 Fehler, e2e 164/164 (2 Läufe); vitest 5211/5211, check 0, Lints 0
