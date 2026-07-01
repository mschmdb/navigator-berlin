# Story 4.5: Lizenzen-Page Auto-Gen-Coverage-Test (Phase 1 DE-only, EN-Variante deferred Phase 3)

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Solo-Maintainer und Datenjournalist:in,
I want für die bestehende DE-Lizenzen-Page (`routes/(with-header)/lizenzen/+page.svelte`, commit `1e71180`) einen Auto-Gen-Coverage-Test der verhindert dass neue License-Types ohne `LICENSE_INFO`-Mapping in den Build durchrutschen, sowie eine Verifikation dass alle Layer-Attribution-Strings ausschließlich aus `MANIFEST.json` stammen,
so that die License-Hierarchie konsistent bleibt sobald neue Datenquellen oder License-Typen hinzukommen, hardcoded-Drift aus dem Komponenten-Code verhindert wird (FR54, NFR-I5), und EN-Variante in Phase 3 ohne Refactor-Bedarf reaktiviert werden kann.

## Phase-1-Scope-Korrektur (User-Lock 2026-05-16)

**EN-Variante DEFERRED Phase 3:** Memory `project_i18n_phase_1_de_only` + Story 3.1 + ADR-014 fixieren Phase 1 auf DE-only. Epic-Text (epics.md Zeile 2058–2060) sieht `/en/lizenzen` + `messages/en.json` + `src/lib/data/license-content/{type}.en.json` vor. **Diese Sub-Scopes sind Phase 1 NICHT umzusetzen.** Phase-3-Reaktivierung über Future-Epic „i18n-Phase-3-EN-Coverage" (siehe `docs/i18n-reactivation.md` aus Story 3.1).

**Phase-1-Scope-Reduce:**

- ❌ EN-Variante (`/en/lizenzen`-Route, EN-Translation-Files, hreflang-Cluster Story 3.3)
- ❌ Translation-Workflow-Integration (Story 3.5 archiv)
- ✅ Auto-Gen-Coverage-Test für DE-Page (Hauptfokus dieser Story)
- ✅ Hardcoded-Drift-Audit für DE-Komponenten-Code
- ✅ `license-footer`-Pattern verifizieren (Lizenz-Link in MetaFooter — bereits in `meta-footer.svelte` Zeile 15 vorhanden, nur Smoke-Check)

**Sequence-Hand-offs:**

- **Story 4.4 ADR-014:** dokumentiert i18n-Phase-1-Lock (Begründung für EN-Defer)
- **Story 3.1:** liefert `docs/i18n-reactivation.md` mit 8-Schritte-Plan für Phase-3-EN-Reaktivierung (Lizenzen-Page-EN-Variante wird dort als Sub-Step ergänzt)
- **Story 1.3 / 1.4:** liefert `MANIFEST.json` + `LayerMetadata`-Type als Source-of-Truth

**Memory-Marker:** `project_i18n_phase_1_de_only`, `feedback_no_em_dashes`, `feedback_no_lebenswert`.

## Acceptance Criteria

**AC-1 (License-Type-Coverage-Test — alle MANIFEST-License-Types haben LICENSE_INFO-Mapping):**

**Given** `routes/(with-header)/lizenzen/+page.svelte` enthält `LICENSE_INFO`-Constant (Zeilen 26–59) mit Mappings für `'dl-de/zero-2-0'`, `'dl-de/by-2-0'`, `'ODbL 1.0'`, `'CC BY 4.0'`, `'Geodatenzugangsgesetz'`
**When** ich `routes/(with-header)/lizenzen/page.server.test.ts` (NEU, Server-Project Vitest) implementiere
**Then** Test lädt echtes `MANIFEST.json` via `loadManifest`-Pfad ODER Mock-Manifest mit allen Production-License-Types
**And** Iteriert über alle Layer in MANIFEST, extrahiert distinct `layer.license`-Werte
**And** Asserted dass jeder distinct License-Wert in `LICENSE_INFO` als Key vorhanden ist (NICHT nur als Fallback `infoFor`-Default)
**And** Test failt mit klarem Message: `License-Type "X" in MANIFEST aber nicht in LICENSE_INFO. Add mapping in routes/(with-header)/lizenzen/+page.svelte Zeile 26-59.`
**And** Test deckt Drift-Risk: neue Source mit neuem License-Type (z.B. „CC BY-SA 3.0 DE") würde rausfallen ohne Build-Fail

**AC-2 (LICENSE_INFO-Konstante als Single-Source-of-Truth extrahieren):**

**Given** `LICENSE_INFO` aktuell inline in `+page.svelte` (Zeilen 26–59) hardcoded
**When** ich `src/lib/data/license-info.ts` (NEU) extrahiere und `LICENSE_INFO` + `infoFor()`-Helper + `LicenseInfo`-Type exportiere
**Then** `+page.svelte` importiert via `import { LICENSE_INFO, infoFor } from '$lib/data/license-info.js'`
**And** Coverage-Test (AC-1) liest `LICENSE_INFO` direkt aus dem Lib-File (kein Component-Render-Mock nötig)
**And** Re-use-Pfad: andere Komponenten (z.B. Layer-Detail-Page Story 2.5a, Bezirks-Page Story 2.3) können `infoFor(layer.license)` konsumieren ohne Duplikat-Hardcoding
**And** Files <500 Zeilen (MUST-Rule #2)

**AC-3 (Layer-Attribution-Strings ausschließlich aus MANIFEST):**

**Given** das `MANIFEST.json` enthält pro Layer: `slug`, `sourceUrl`, `license`, `sourceUpdatedAt`, `fetchedAt`, `bundleGroup`
**When** ich `+page.svelte` und `license-info.ts` auditiere
**Then** **KEINE** hardcoded Layer-Slug-spezifischen Attribution-Strings im Komponenten-Code (z.B. NICHT `if (layer.slug === 'stolpersteine') return '© OpenStreetMap-Mitwirkende'`)
**And** Layer-Display-Name kommt via `getLayerDisplayName(slug)` aus `$lib/components/atlas/internal/layer-palette-filter.js` (existierender Helper, MUST-Rule #3)
**And** Layer-Source-URL kommt aus `layer.sourceUrl` (MANIFEST)
**And** Layer-License kommt aus `layer.license` (MANIFEST) → `LICENSE_INFO.label` für menschlich-lesbares Label
**And** Hardcoded-Drift-Audit-Script `scripts/check-lizenzen-hardcoded.ts` (NEU): scannt `+page.svelte` für regex-Matches `/(['"`]).+stolperstein|laerm|kitas-2024.+\1/i` und failt falls Layer-Slugs in Komponenten-Body auftauchen
**And** Audit-Script läuft optional via `package.json` `"check:lizenzen": "tsx scripts/check-lizenzen-hardcoded.ts"`. Phase-1-Optional: kein CI-Gate-Eintrag (Story 4.3 hat keinen lizenzen-spezifischen Gate)

**AC-4 (Lizenz-Hierarchie korrekt für 5 License-Typen):**

**Given** die Lizenz-Hierarchie aus Epic (Zeilen 2065–2069)
**When** ich `LICENSE_INFO`-Mappings verifiziere
**Then** Mappings korrekt für 5 License-Typen:
  - `dl-de/zero-2-0` (CC0-äquivalent) — keine Attribution-Pflicht, Höflichkeits-Hinweis möglich
  - `dl-de/by-2-0` — „Geoportal Berlin / [Layer-Titel]" verpflichtend
  - `CC BY 3.0 DE` + `CC BY 4.0` — Attribution + Lizenz-Link
  - `ODbL 1.0` — „© OpenStreetMap-Mitwirkende" + Link
  - `CC-BY-SA 3.0` + `CC-BY-SA 4.0` (Wikipedia) — Quellen-Link
**And** `CC BY 3.0 DE` + `CC-BY-SA 3.0` + `CC-BY-SA 4.0` werden ergänzt in `LICENSE_INFO` falls Layer in MANIFEST diese Typen haben (AC-1-Coverage erzwingt Konsistenz)
**And** `Geodatenzugangsgesetz` bleibt erhalten als Berlin-spezifischer Rechtskontext (bereits in `LICENSE_INFO` Zeile 52)

**AC-5 (Phase-3-Reaktivierungs-Path-Doc in `docs/i18n-reactivation.md` ergänzen):**

**Given** `docs/i18n-reactivation.md` aus Story 3.1
**When** ich Lizenzen-Page-EN-Reaktivierung als zusätzlichen Sub-Step ergänze
**Then** Doc enthält neuen Bullet:
  - „**Lizenzen-Page EN-Variante:** Lizenzen-Strings (UI-Headings, Section-Labels, License-Summaries) zu Paraglide-Messages migrieren via `messages/en.json` + `$lib/data/license-info.ts` um `Record<Locale, LicenseInfo>`-Pattern erweitern. `/en/lizenzen`-Route ist automatisch über Paraglide-URL-Pattern erreichbar nach Phase-3-Reaktivierung."
**And** Verweist auf `src/lib/data/license-info.ts` (aus Story 4.5 AC-2) als Migration-Anker

**AC-6 (license-footer-Pattern verifiziert):**

**Given** `meta-footer.svelte` Zeile 15: `<a href="/lizenzen" class="hover:text-accent">Lizenzen</a>` (existiert)
**When** ich Verifikation durchführe
**Then** Lizenz-Link erreichbar auf jeder Page (FR54, NFR-I5)
**And** Smoke-Test `meta-footer.test.ts` (Existierend oder NEU): asserted dass Lizenzen-Link gerendert wird
**And** Phase-3-Translation-Hand-off: aktuelle Anchor-Text-Variante „Lizenzen" wird in Phase 3 via Paraglide-Message ersetzt (`m.meta_footer_licenses()`)
**And** Keine separate `license-footer.svelte`-Komponente nötig (Epic-Text-Wortlaut „license-footer.svelte oder äquivalent" deutet auf Verifikation-Lücke — diese Story bestätigt dass MetaFooter bereits Anchor-Pattern bietet)

**AC-7 (Smoke-Test gegen prerendered Build):**

**Given** Story 2.1 SEO-Foundation hat `/lizenzen` als prerendered geflagged (`+page.ts` Zeile 4: `export const prerender = true`)
**When** ich `pnpm build` ausführe
**Then** `build/lizenzen/index.html` existiert als statisches File
**And** Page-HTML enthält alle 4 Section-Headers (Daten-Lizenzen / Software / Schriften / OpenStreetMap-Namensnennung)
**And** Page-HTML enthält mind. 1 Layer-Eintrag pro Section (Smoke-Test-Verifikation gegen aktuellen MANIFEST-Stand)
**And** Keine 404er bei MANIFEST-References (Test: alle `sourceUrl`-Links zeigen auf erreichbare Endpoints — Phase-1-Soft-Check via `curl -I`-Stichprobe für 3 zufällige Layer)

## Tasks / Subtasks

- [ ] **Task 1: `LICENSE_INFO`-Extraktion nach `$lib/data/license-info.ts` (AC: #2)**
  - [ ] Neue Datei `src/lib/data/license-info.ts` mit `LICENSE_INFO`-Constant + `LicenseInfo`-Type + `infoFor()`-Helper
  - [ ] Re-Export via `src/lib/data/index.ts` (falls Barrel-File Pattern aktiv)
  - [ ] `+page.svelte` Import auf neuen Lib-Pfad umstellen
  - [ ] Lokal-Test: `pnpm dev` → `/lizenzen` rendert weiterhin korrekt
  - [ ] `pnpm check` grün

- [ ] **Task 2: Coverage-Test schreiben (AC: #1)**
  - [ ] Neue Datei `routes/(with-header)/lizenzen/page.server.test.ts` (Vitest Server-Project, Node-Env)
  - [ ] Test 1: lade echtes MANIFEST.json oder Mock mit allen Production-License-Types
  - [ ] Test 2: alle distinct `layer.license`-Werte sind in `LICENSE_INFO` als Key (kein Fallback)
  - [ ] Test 3: failure-message dokumentiert wo Mapping ergänzt werden muss
  - [ ] Negative-Test: künstlich License-Type ins Test-Manifest, der nicht in LICENSE_INFO ist → Test failt
  - [ ] `pnpm test:unit -- routes/(with-header)/lizenzen` grün

- [ ] **Task 3: 3 weitere LICENSE_INFO-Einträge ergänzen falls in MANIFEST genutzt (AC: #4)**
  - [ ] Build-Output-Check: `pnpm data:fetch && pnpm build && grep -oE '"license":\s*"[^"]+"' build/_app/.../manifest.json | sort -u`
  - [ ] Distinct License-Typen aus aktuellem MANIFEST ermitteln
  - [ ] Falls `CC BY 3.0 DE` oder `CC-BY-SA 3.0` oder `CC-BY-SA 4.0` genutzt: in `LICENSE_INFO` ergänzen mit korrekter URL + Summary
  - [ ] Falls weitere unerwartete Typen: in Open-Q1 dokumentieren

- [ ] **Task 4: Hardcoded-Drift-Audit-Script optional (AC: #3)**
  - [ ] `scripts/check-lizenzen-hardcoded.ts` schreiben (Phase-1-Optional, kein CI-Gate)
  - [ ] Regex-Scan auf `+page.svelte` für Layer-Slug-Pattern-Matches
  - [ ] Exit 1 mit klarem Report bei Findings, Exit 0 bei Clean
  - [ ] `package.json` Script `"check:lizenzen": "tsx scripts/check-lizenzen-hardcoded.ts"`
  - [ ] Manueller Run als Sanity-Check

- [ ] **Task 5: Phase-3-Reaktivierungs-Path ergänzen (AC: #5)**
  - [ ] `docs/i18n-reactivation.md` öffnen (existiert aus Story 3.1)
  - [ ] Sub-Bullet für Lizenzen-Page-EN-Variante ergänzen mit Verweis auf `license-info.ts` als Migration-Anker

- [ ] **Task 6: MetaFooter-Smoke-Test (AC: #6)**
  - [ ] Existenz von `meta-footer.test.ts` prüfen — falls vorhanden, Lizenzen-Link-Assertion ergänzen
  - [ ] Falls nicht vorhanden: keine Story-4.5-Aktion (out-of-scope für separate Test-Story)

- [ ] **Task 7: Build-Smoke-Test (AC: #7)**
  - [ ] `pnpm build` lokal
  - [ ] Verify `build/lizenzen/index.html` existiert + enthält 4 Section-Headers
  - [ ] Optional: 3 sourceUrl-Spot-Checks via curl (Phase-1-Soft)

- [ ] **Task 8: Commit-Strategie**
  - [ ] Commits getrennt:
    1. `refactor(lizenzen): extract LICENSE_INFO to $lib/data/license-info.ts (story 4.5 a)`
    2. `test(lizenzen): coverage-test ensures MANIFEST-licenses have LICENSE_INFO mapping (story 4.5 b)`
    3. `docs(i18n): phase-3 reactivation path for lizenzen-en-variante (story 4.5 c)`
  - [ ] Alle Commits ohne em-dashes

## Dev Notes

### Aktueller Lizenzen-Stand (vor Story 4.5)

- **`+page.svelte` (305 Zeilen):** vollständige DE-Page, ToC-Nav mit 4 Sections, Layer-Listing grouped by License, License-Summaries via `LICENSE_INFO`-Constant
- **`+page.ts`:** `export const prerender = true`, lädt MANIFEST.json
- **`page.svelte.test.ts`:** Vitest-Browser-Test mit Mock-Manifest, prüft Render von h1/ToC/Sections (40+ Test-Cases vermutlich)
- **MANIFEST-License-Types in Production:** mind. `dl-de/zero-2-0`, `dl-de/by-2-0`, `ODbL 1.0`, `CC BY 4.0`, plus ggf. `Geodatenzugangsgesetz`. Stichprobe MANIFEST Zeile 11: `bezirke` hat `dl-de/zero-2-0`
- **MetaFooter:** Zeile 15 hat `/lizenzen`-Link, also Always-Reachable (FR54)

### Phase-1-Pivot vs Epic-Wortlaut

Epic-Text (Zeile 2046–2077) plant:

- EN-Page + EN-Translation-Files (Story 3.5)
- hreflang-Cluster (Story 3.3)
- 2 lokalisierte Versionen prerendered

**Phase-1-Realität (User-Lock 2026-05-16):**

- Stories 3.3 + 3.5 = phase-3-deferred (sprint-status.yaml Zeilen 195 + 197)
- ADR-014 (Story 4.4) lockt DE-only für Phase 1
- Story 3.1 hat Paraglide auf `locales: ["de"]` reduziert

**Story 4.5 reduziert sich** auf den **Auto-Gen-Coverage-Test** + die **LICENSE_INFO-Extraktion** für Phase-3-Reaktivierungs-Bereitschaft. EN-Variante bleibt Future-Epic.

### Architektur-Constraints

**MUST-Rule-Mapping:**

- **Rule #2 (Files <500 Zeilen):** `license-info.ts` schlank, `+page.svelte` bleibt unter 500
- **Rule #3 (Bestehende Funktionen checken):** `getLayerDisplayName` existiert, wird genutzt
- **Rule #7 (TypeScript strict):** keine `any`-Types in `LicenseInfo`
- **Rule #14 (i18n-First):** DEFERRED Phase 1, hardcoded-DE-Strings akzeptiert
- **Rule #12 (Per Layer-Wert Source-URL + UpdatedAt + License):** MANIFEST-Provenance respektiert

**FR/NFR-Mapping:**

- **FR54 (Lizenz-Erreichbarkeit auf jeder Page):** AC-6 verifiziert MetaFooter-Anchor
- **NFR-I5 (License-Hierarchy konsistent):** AC-1 Coverage-Test enforced

### Memory-Bezug

- **`project_i18n_phase_1_de_only`:** EN-Variante deferred. Story scoped auf DE-Coverage-Test.
- **`feedback_no_em_dashes`:** UI-Strings in `LICENSE_INFO` ohne em-dashes
- **`feedback_no_lebenswert`:** keine NS-belasteten Begriffe in Lizenz-Texten

### Test-Strategie (ADR-012)

Story 4.5 ist **Refactor + Test-Add**. ADR-012 sagt Test-First für Daten-Transform + API-Boundaries. `license-info.ts` ist Daten-Transform-Modul, Test-First-Pflicht.

**Red-Green-Refactor:**

1. **Red:** Coverage-Test schreiben gegen vermuteten `LICENSE_INFO`-Stand. Test failt da `LICENSE_INFO` noch in `+page.svelte` (kein Lib-Import möglich).
2. **Green:** `license-info.ts` extrahieren, `+page.svelte` umstellen. Test passt.
3. **Refactor:** falls neue License-Types in MANIFEST → ergänzen.

**Coverage-Ziel:** 100% für `license-info.ts` (kleines Lib-File, einfach zu testen). Pragmatic-TDD pro ADR-012 §2 Daten-Transform-Pfad.

### Previous Story Intelligence

**Story 1.27 (Adress-Vergleich, done):** Pattern für `getLayerDisplayName` als Cross-Component-Helper.

**Story 3.1 (Paraglide-Reduce, ready-for-dev):** `docs/i18n-reactivation.md` Foundation. AC-5 erweitert dieses Doc.

**Story 4.4 (ADR-Nachzieher, ready-for-dev):** ADR-014 dokumentiert i18n-DE-only-Lock. Story 4.5 referenziert ADR-014.

**Lizenzen-Page-Vorzug (commit `1e71180`, 2026-05-15):** DE-Page bereits implementiert in Story 4.5-Vorzug (siehe `git log -- src/routes/\(with-header\)/lizenzen/`). Diese Story ergänzt nur Coverage-Test + Refactor.

### File-List nach Story-Completion (erwartet)

**Modified:**

- `src/routes/(with-header)/lizenzen/+page.svelte` (LICENSE_INFO-Import statt Inline)
- `docs/i18n-reactivation.md` (neuer Sub-Bullet für Lizenzen-EN-Variante)
- `package.json` (optional `check:lizenzen`-Script)

**New:**

- `src/lib/data/license-info.ts` (LICENSE_INFO + LicenseInfo-Type + infoFor)
- `src/lib/data/license-info.test.ts` (Coverage-Test gegen License-Type-Konsistenz, optional getrennt von Page-Test)
- `src/routes/(with-header)/lizenzen/page.server.test.ts` (MANIFEST-Coverage-Test, Server-Project)
- (optional) `scripts/check-lizenzen-hardcoded.ts`

**Untouched:**

- `src/routes/(with-header)/lizenzen/+page.ts` (Load-Funktion bleibt)
- `src/routes/(with-header)/lizenzen/page.svelte.test.ts` (Browser-Render-Test bleibt grün)
- `static/layers/MANIFEST.json` (Source-of-Truth, kein Edit)
- `src/lib/components/atlas/meta-footer.svelte` (Zeile 15 Lizenzen-Anchor bleibt)

### Project Structure Notes

`license-info.ts` co-located mit anderen `$lib/data/`-Helpers (manifest, types, get-bezirk-profile etc.). Konsistent mit MUST-Rule #3 (Re-use-Pfad für andere Pages).

Page-Server-Test `page.server.test.ts` ist Vitest-Server-Project-Convention (siehe `vite.config.ts` Zeilen 56–68 — alle `*.test.ts` außer `*.svelte.test.ts` laufen in Server-Project).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.5` Zeilen 2046–2077] — Original-Story-Definition (Phase-1-reduziert in diesem Story-Body)
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeilen 1050–1073] — MUST-Rules
- [Source: `_bmad-output/planning-artifacts/prd.md` FR54, NFR-I5] — License-Erreichbarkeit
- [Source: `src/routes/(with-header)/lizenzen/+page.svelte` Zeilen 26–59] — LICENSE_INFO inline (Refactor-Target)
- [Source: `src/routes/(with-header)/lizenzen/+page.ts`] — Manifest-Load + prerender
- [Source: `src/routes/(with-header)/lizenzen/page.svelte.test.ts`] — bestehender Browser-Test
- [Source: `src/lib/components/atlas/meta-footer.svelte` Zeile 15] — Lizenzen-Anchor
- [Source: `src/lib/components/atlas/internal/layer-palette-filter.ts`] — `getLayerDisplayName`
- [Source: `static/layers/MANIFEST.json`] — License-Type-Inventory
- [Source: `docs/i18n-reactivation.md` (aus Story 3.1)] — Phase-3-Path
- [Source: `docs/adr/ADR-014` (aus Story 4.4)] — i18n-DE-only-Lock
- [Source: `docs/adr/ADR-012-tdd-mandate.md`] — Pragmatic-TDD
- [Source: Memory `project_i18n_phase_1_de_only`]
- [Source: Memory `feedback_no_em_dashes`]

## Open Questions / Pre-Dev-Clarifications

1. **Aktuelle License-Type-Inventur in Production-MANIFEST:** wieviele distinct `layer.license`-Werte? Stichprobe sieht `dl-de/zero-2-0`. Empfehlung: Dev-Agent startet Task 3 mit `grep`-Inventur und ergänzt fehlende `LICENSE_INFO`-Einträge in einem Pass.

2. **Coverage-Test im Server- oder Browser-Project?** AC-1 sagt `page.server.test.ts` (Server-Project). Alternative: extend bestehenden `page.svelte.test.ts` mit Coverage-Block. Empfehlung: **Server-Project**, weil Test reine Daten-Konsistenz prüft (kein Component-Render nötig). Schneller + isoliert.

3. **Hardcoded-Drift-Audit-Script als CI-Gate oder nur Optional-Tool?** Story 4.3-CI-Gates haben keinen lizenzen-spezifischen Gate. Empfehlung: **Optional-Tool**, manueller Run bei Refactor-Verdacht. Falls Layer-Slug-Drift in Production beobachtet: in 4.3-Phase-2 als Gate aufnehmen.

4. **`license-info.ts` als `Record<Locale, ...>`-Pattern Phase 1 vorbereiten?** Story 2.5a (Layer-Detail-Page) hat ähnliches Pattern für `LAYER_EXPLAIN_DE/EN`. Empfehlung: **Nein**, Phase 1 strict DE. Migration-Anker bleibt simple `LICENSE_INFO`-Object, Phase-3-Migration ist 1-Refactor-Pass.

5. **`Geodatenzugangsgesetz` als License-Type — wirklich License oder Rechts-Kontext?** Aktuell in `LICENSE_INFO` als Eintrag. Eigentlich kein Lizenz-Volltext sondern Rechts-Grundlage für DE-Verwaltungs-Daten. Empfehlung: **drinnen lassen** (bestehender Stand, kein Refactor-Bedarf). Falls Editorial-Sicht ändern: separate Phase-2-Story.

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
