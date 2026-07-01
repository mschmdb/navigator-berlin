# Story 2.5b: FAQ-Section pure Template mit Daten-Slots

Status: ready-for-dev

## Story

As a interessierter Bürger / Suchender / LLM-Crawler,
I want auf Bezirks-, Kiez- und Layer-Pages eine FAQ-Sektion mit ~5-10 datengefüllten Q&As die aus deterministischen Templates und Aggregat-Werten gerendert werden,
so that Long-Tail-Suchanfragen wie „Wie laut ist es im Boxhagener Kiez?" oder „Wie hoch ist Bodenrichtwert in Mitte?" direkte, datenbasierte Antworten finden ohne LLM-Polish-Drift.

## Probleme heute

1. FAQ-Section ist auf Bezirks-/Kiez-Page-Stories (2.3, 2.4) als Placeholder vorgesehen, ohne Befüllungs-Pipeline. Long-Tail-SEO-Hebel (FR30) ist ungenutzt.
2. Story 2.0 schafft `faq_qna`-Tabelle (Schema only, leer). Konsument für die Befüllung existiert nicht ohne 2.5b.
3. `JsonLd`-Komponente und `buildFaqPage`-Generator existieren (Story 2.2 ready-for-dev), aber kein Input für `FAQPage`-Struktur fehlt.
4. Risiko bei LLM-generierten Q&A-Inhalten: Halluzination, Drift, Unbelegtheit. Per User-Vorgaben (Memory `no-ai-slop`, Methodik-Page-Aussage „Layer-Beschreibungen schreiben wir manuell. Kein LLM-Output für Personen-Biografien.") sind LLM-Polish-Outputs zur Build-Zeit verboten. Templates müssen deterministisch sein.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1195-1222.
- PRD: FR30 (`prd.md` Zeile 732), UX-DR28 (FAQ-Disclosure-Pattern).
- Story 2.0 (ready-for-dev): `faq_qna`-Tabelle (composite-PK `page_type, slug, cluster, locale`, Felder `question`, `answer`, `computed_at`).
- Story 2.2 (ready-for-dev): `buildFaqPage(input: FaqPageInput): WithContext<FAQPage>`, `JsonLd`-Komponente.
- Story 2.3 (ready-for-dev): Bezirks-Page-FAQ-Placeholder (in dieser Story durch echte FAQ-Section ersetzt).
- Story 2.4 (ready-for-dev): Kiez-Page-FAQ-Placeholder analog.
- Story 1.29 (review): Layer-Detail-Page existiert, bekommt mit dieser Story FAQ-Section dazu.
- Bestehende Disclosure-Komponente: `src/lib/components/ui/disclosure.svelte` (Bits-UI-Accordion-Wrapper, type=single, tastaturbar).
- Bestehender FaqEntry-Typ: `src/lib/data/types.ts:84-87` (`{question, answer}`).
- Methodik-Page-Begriffs-Disziplin (`feedback_no_lebenswert.md`, `feedback_no_em_dashes.md`, `no-ai-slop`).
- Postgres-Aggregat-Daten (Story 2.0): `bezirk_stats`, `kiez_stats` mit Cluster-Werten Lärm/Luft/Klima/Grün/ÖPNV/Bildung/Wohnen/Soziale Lage.

## Akzeptanz-Kriterien

1. **AC-1 (Template-Bibliothek pro Cluster + Locale):**
   **Given** dass Q-Templates source-controlled, deterministisch und ohne LLM-Polish reproduzierbar sein müssen
   **When** ich `src/lib/data/faq-templates/`-Verzeichnis pro Cluster anlege
   **Then**:
   - Verzeichnis-Struktur: `src/lib/data/faq-templates/{cluster}/{cluster}.{locale}.yaml` mit 9 Clustern × 2 Locales (`de`, `en`) = 18 YAML-Files
   - Cluster: `laerm`, `luft`, `klima`, `wohnen`, `gruen`, `verkehr`, `bildung`, `heritage`, `score`
   - Schema pro YAML-File (Valibot-validiert):
     ```yaml
     cluster: laerm
     locale: de
     templates:
       - id: laerm-mean-lden-bezirk
         applicableTo: [bezirk]
         requires: [laerm.meanLDen]
         question: "Wie laut ist es im Bezirk {bezirkName}?"
         answer: "Der durchschnittliche Tages-Lärmpegel (L_DEN) in {bezirkName} liegt bei {meanLDen} dB. {laermInterpretation}"
       - id: laerm-share-65db-kiez
         applicableTo: [kiez]
         requires: [laerm.shareAbove65Db]
         question: "..."
         answer: "..."
     ```
   - YAML wegen Editor-Friendliness + Mehrzeilen-Strings (Antworten können lang werden). YAML-Parser via `js-yaml` (Story-2.5b T1.1 ergänzt Dep)
   - Templates sind purely deterministisch: `{slot}`-Platzhalter werden mit Aggregat-Werten ersetzt, KEIN LLM-Output zur Build-Zeit
   - Konditionale Sub-Slots (z.B. `{laermInterpretation}`): Lookup-Map in TypeScript-Helper, z.B. „leise", „mittel", „laut" je nach dB-Bucket. Diese Helper sind Pure-Functions, getestbar
   - Pro Cluster 5-10 Q-Templates × 3 Page-Types × 2 Locales = mindestens 30, maximal 60 Q-Templates pro Cluster
   - Test: Schema-Validation per YAML-File; Coverage-Check dass jeder Cluster Templates für mindestens 2 Page-Types liefert

2. **AC-2 (Co-Design-Pilot: Lärm-Cluster zuerst):**
   **Given** Q-Template-Stil + Tonalität müssen mit User abgestimmt sein bevor Massen-Generierung startet
   **When** ich den ersten Cluster baue
   **Then**:
   - Lärm-Cluster (`laerm.de.yaml`, `laerm.en.yaml`) zuerst, mit 5-10 Templates jeweils
   - Q-Template-Schema und Style-Guide werden in `docs/faq-template-style-guide.md` dokumentiert (kurze Datei mit Beispielen)
   - User-Matze-Co-Design-Session: Tonalität (Frage in Du-Form oder Sie? Antwort sachlich-knapp oder erklärend?), Slot-Konventionen, Zahlen-Formatierung (z.B. dB-Werte gerundet auf 1 Nachkommastelle), Quellen-Attribution-Format am Antwort-Ende
   - Erst nach Lärm-Cluster-Approval starten die anderen 8 Cluster
   - Phase-1-Scope: Lärm-Cluster ist Pflicht; 4 weitere Cluster (Luft, Klima, Wohnen, Mobilität/Verkehr) als Phase-1-MVP-Stretch; restliche 4 (Grün, Bildung, Heritage, Score) als Phase-2-Backlog falls Zeit-Budget knapp (siehe Open-Question 1)

3. **AC-3 (Build-Step `render-faq.ts`):**
   **Given** Templates + Aggregat-Werte aus Postgres
   **When** ich `scripts/render-faq.ts` implementiere und unter `pnpm data:faq` registriere
   **Then**:
   - Script läuft NACH `pnpm data:aggregate` (Story 2.0) und VOR `pnpm build`
   - Liest alle YAML-Templates aus `src/lib/data/faq-templates/**`
   - Iteriert über alle Bezirke (12) + Kieze (138 oder 542, je nach Story 2.4-Entscheidung) + Layer (42)
   - Pro Page × Cluster × Locale: rendert 5-10 Q&As durch Slot-Substitution
   - Skipt Templates wenn `requires`-Felder in Postgres-Aggregat fehlen (z.B. kein Lärm-Wert für einen Kiez → Lärm-FAQs für diesen Kiez überspringen)
   - Schreibt Output in `faq_qna`-Tabelle via Drizzle-Upsert (Story 2.0-Pattern)
   - Pure-Function-Slot-Renderer in `src/lib/server/faq/template-renderer.ts` (server-only, da Postgres-Zugriff)
   - Idempotenz: zweimal aufrufen liefert identische `question`+`answer` (ausser `computed_at`-Timestamp)
   - Output-Volumen Phase 1 (mit 5 Clustern): 5 Cluster × ~5 Q&As × (12 + 138 + 42 Pages) × 2 Locales ≈ 9.600 Q&As gerendert
   - Tests:
     - Slot-Renderer pro Cluster-Pilot mit Fixture-Aggregat
     - Idempotenz-Test (2× ausführen, Diff = nur `computed_at`)
     - Skip-Logic-Test (Template ohne benötigtes Aggregat-Feld)

4. **AC-4 (FAQ-Section-Komponente):**
   **Given** Disclosure-Pattern (Bits-UI), Bestand `src/lib/components/ui/disclosure.svelte`
   **When** ich `src/lib/components/atlas/faq-section.svelte` implementiere
   **Then**:
   - Komponente nimmt `{ items: FaqEntry[], pageType: 'bezirk' | 'kiez' | 'layer', headingLevel?: 2 }` als Props
   - Rendert:
     - `<h2>` Plex-Serif „Häufige Fragen" (DE) / „Frequently Asked" (EN) via Paraglide-Message
     - `<Disclosure>`-Wrapper mit `<DisclosureItem>` pro Q&A (oder `bits-ui` `Accordion.Item` direkt; siehe Open-Question 3)
     - Q als Plex-Sans-Bold, A als Plex-Sans-Regular max 72ch
     - Quellen-Attribution-Footer pro Antwort optional („Quelle: {layer}, Stand {sourceUpdatedAt}")
   - `JsonLd`-Einbindung via Story 2.2: `<JsonLd data={faqJsonLd} testid="faq-jsonld" />` mit `buildFaqPage({mainEntity: items})`
   - Komponente <300 LOC (MUST-Rule #2)
   - Progressive-Enhancement: Disclosure-Items sind im SSR offen (`open`-Attribute auf erstes Item) damit Crawler ohne JS Content sieht; Client-Hydration faltet zu (außer erstes)
   - aria-expanded korrekt gesetzt (Bits-UI macht das)

5. **AC-5 (Integration in Bezirks-/Kiez-/Layer-Page):**
   **Given** Stories 2.3, 2.4 haben FAQ-Placeholder; 1.29-Layer-Detail hat aktuell keine FAQ
   **When** ich `<FaqSection>` einbinde
   **Then**:
   - Page-Loader (`+page.server.ts`) liest `faq_qna` aus DB via neuem `getFaqQna({pageType, slug, locale})`-Query (existiert als Stub aus Story 2.0; in dieser Story füllen)
   - `<FaqSection items={faq} pageType="bezirk" />` rendert nach Steckbrief-Section
   - Bezirks-Page (`bezirk-hero.svelte` aus 2.3): FAQ-Placeholder wird durch `<FaqSection>` ersetzt
   - Kiez-Page (`kiez-hero.svelte` aus 2.4): analog
   - Layer-Detail-Page (`layer/[slug]/+page.svelte`): neue FAQ-Section unter „Verwandte Layer"
   - Falls `items.length === 0`: Section komplett ausgeblendet (kein leerer Header)
   - Test: Page-Snapshot mit FAQ-Section-Render

6. **AC-6 (Locale-Konsistenz + Fallback):**
   **Given** dass EN-Übersetzungen pro Cluster mit Story 2.5a-Übersetzungs-Sprint koordiniert sein müssen
   **When** EN-Locale gerendert wird
   **Then**:
   - EN-Templates müssen pro Cluster vorhanden sein, sonst fällt FAQ-Section graceful auf DE zurück MIT Translation-Disclaimer (Pattern aus Story 2.5a)
   - Phase-1-Pflicht: alle 5 Cluster (siehe AC-2) haben EN-Templates Co-Equal-Qualität
   - Test: Coverage-Check `en.yaml`-File pro Cluster
   - Fallback-Logik: Page-Loader lädt EN-FAQs aus DB; bei `items.length === 0` für EN-Page versucht er DE-Fallback + setzt `faqLocale: 'de'` für TranslationDisclaimer

7. **AC-7 (Editorial-Sensible-Inhalte explizit ausgeschlossen):**
   **Given** dass bestimmte Layer per Editorial-Policy ohne automatische FAQ-Generation sind (Memory `project_compare_editorial_profiles.md`, `feedback_no_lebenswert.md`)
   **When** Templates für Cluster mit sensitiven Layern definiert werden
   **Then**:
   - Cluster `score`: KEINE evaluative Q&A wie „Ist Boxhagener Kiez lebenswert?". Stattdessen neutrale Variante „Wie schneidet Boxhagener Kiez im Kiez-Score ab?". Begriff „Lebenswert/Lebensqualität" NIRGENDS (Memory `feedback_no_lebenswert.md`)
   - Cluster `wohnen` mit MSS-Bezug (Story 1.30): keine Single-Adress-Stigmatisierung; FAQ-Text bezieht sich auf den ganzen Kiez/Bezirk-Aggregat ohne „dieser Kiez ist sozial schwach"-Wording. Sprachliche Disziplin per `de-konzept-erstellung`/`no-ai-slop`-Skills
   - Cluster `heritage` (Stolpersteine): KEINE automatische Q&A zu Personen-Biografien. Templates nur über Layer-Coverage („Wie viele Stolpersteine gibt es in {bezirk}?")
   - Editorial-Disclaimer wird pro Sensible-Cluster in FAQ-Section als Footer-Subline angezeigt
   - Test: FAQ-Output enthält keine verbotenen Begriffe (Lint-Test gegen Wörter-Blacklist)

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012 Pragmatic-TDD
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: YAML-Schema-Validation-Tests + Coverage-Tests pro Cluster
   - AC-2: Lärm-Cluster-Renderer-Tests gegen Fixture-Aggregat
   - AC-3: `render-faq.ts`-Idempotenz-Test, Skip-Logic-Test, Pure-Function-Slot-Renderer-Tests
   - AC-4: Komponenten-Test `faq-section.svelte` (Render, Disclosure-Open-State, JSON-LD-Output)
   - AC-5: Page-Integration-Snapshot pro Page-Type
   - AC-6: Fallback-Test EN→DE
   - AC-7: Begriffs-Lint-Test
   - E2E `tests/e2e/faq-section.e2e.ts`: 1 Bezirks-Page mit FAQ, Disclosure-Toggle, axe-Check, no-JS-Smoke (Crawler-View)
   - Coverage-Ziel: Template-Renderer 100%, FaqSection-Komponente ≥80%, Build-Step ≥85%

## Tasks / Subtasks

- [ ] **T1: YAML-Foundation + Schema** (AC: 1, 8)
  - [ ] T1.1: `pnpm add js-yaml` und `pnpm add -D @types/js-yaml`
  - [ ] T1.2: `src/lib/server/faq/template-schema.ts` mit Valibot-Schema (`FaqTemplate`, `FaqTemplateFile`)
  - [ ] T1.3: `src/lib/server/faq/load-templates.ts` mit `loadFaqTemplates(): Map<ClusterKey, FaqTemplateFile[]>`
  - [ ] T1.4: Verzeichnis `src/lib/data/faq-templates/` anlegen
  - [ ] T1.5: Schema-Tests

- [ ] **T2: Lärm-Cluster-Pilot + Co-Design** (AC: 2, 7)
  - [ ] T2.1: 5-10 Lärm-Q-Templates DE in `laerm/laerm.de.yaml`
  - [ ] T2.2: `docs/faq-template-style-guide.md` mit Schema-Beispielen + Tonalitäts-Regeln
  - [ ] T2.3: User-Co-Design-Session-Marker (in Sprint-Status notieren)
  - [ ] T2.4: Approval → Lärm-EN-Templates + Stretch-Cluster (Luft, Klima, Wohnen, Verkehr)

- [ ] **T3: Slot-Renderer Pure-Function** (AC: 3, 8)
  - [ ] T3.1: `src/lib/server/faq/template-renderer.ts` mit `renderTemplate(template, aggregateData, locale): {question, answer} | null`
  - [ ] T3.2: Slot-Substitution mit Type-Guard für `requires`-Felder
  - [ ] T3.3: Sub-Slot-Helper (z.B. `laermInterpretation(dbValue, locale)`)
  - [ ] T3.4: Pure-Function-Tests

- [ ] **T4: Build-Step `render-faq.ts`** (AC: 3, 8)
  - [ ] T4.1: `scripts/render-faq.ts` als CLI-Orchestrator
  - [ ] T4.2: Iteration über alle Pages × Cluster × Locales
  - [ ] T4.3: Drizzle-Upsert in `faq_qna`
  - [ ] T4.4: `package.json`-Script `data:faq` registrieren, Doku in `docs/data-pipeline.md` ergänzen
  - [ ] T4.5: Idempotenz-Test, Skip-Logic-Test

- [ ] **T5: Query-Layer + FaqEntry-Erweiterung** (AC: 5, 6)
  - [ ] T5.1: `src/lib/server/db/queries/get-faq-qna.ts` aus Story 2.0 implementieren (`getFaqQna({pageType, slug, locale}): Promise<FaqEntry[]>`)
  - [ ] T5.2: `FaqEntry`-Typ in `types.ts` ggf. erweitern um `cluster?`, `sourceLayer?`, `sourceUpdatedAt?` für Attribution-Footer
  - [ ] T5.3: Fallback-Logik EN→DE
  - [ ] T5.4: Query-Tests gegen Mock-Drizzle

- [ ] **T6: FaqSection-Komponente** (AC: 4, 8)
  - [ ] T6.1: `src/lib/components/atlas/faq-section.svelte`
  - [ ] T6.2: Disclosure-Pattern via existierender `ui/disclosure.svelte`
  - [ ] T6.3: JsonLd-Einbindung via Story 2.2
  - [ ] T6.4: Progressive-Enhancement (erstes Item offen im SSR)
  - [ ] T6.5: Translation-Disclaimer bei EN→DE-Fallback (re-use Komponente aus 2.5a)
  - [ ] T6.6: Komponenten-Tests

- [ ] **T7: Page-Integration** (AC: 5)
  - [ ] T7.1: Bezirks-Page (Story 2.3): FAQ-Placeholder ersetzen
  - [ ] T7.2: Kiez-Page (Story 2.4): FAQ-Placeholder ersetzen
  - [ ] T7.3: Layer-Detail-Page (1.29): FAQ-Section unter „Verwandte Layer"
  - [ ] T7.4: Loader pro Page um `getFaqQna`-Aufruf erweitern
  - [ ] T7.5: Snapshot-Tests pro Page-Type

- [ ] **T8: Cluster-Skalierung** (AC: 1, 6)
  - [ ] T8.1: 4 Stretch-Cluster: Luft, Klima, Wohnen, Verkehr (DE + EN)
  - [ ] T8.2: Phase-2-Backlog dokumentieren: Grün, Bildung, Heritage, Score (siehe Open-Question 1)
  - [ ] T8.3: Score-Cluster bei Phase-1-Approval: Stigma-disziplinierte Templates per AC-7

- [ ] **T9: E2E + Final-Verifikation** (AC: 1-8)
  - [ ] T9.1: E2E mit Disclosure-Toggle + axe + no-JS
  - [ ] T9.2: `pnpm test:unit -- --run` 100% grün
  - [ ] T9.3: `pnpm check` 0 Errors
  - [ ] T9.4: `pnpm data:faq` läuft, Spotcheck Postgres `faq_qna`-Tabelle hat Einträge
  - [ ] T9.5: Browser-Verify 3 Bezirke + 3 Kieze + 3 Layer mit FAQ
  - [ ] T9.6: Sprint-Status-Eintrag

## Dev Notes

### Phase-1-Scope (Open-Question 1)

Epic-Wortlaut: 9 Cluster × 3 Page-Types × 5 Q&As × 2 Locales ≈ 270 Q-Templates + 3.000 gerenderte Q&As.

Reality-Check für Solo-Maintainer:

- Phase-1-Pflicht: **Lärm-Cluster** (Pilot mit Co-Design)
- Phase-1-Stretch: **Luft, Klima, Wohnen, Verkehr** (4 weitere Cluster)
- Phase-2-Backlog: **Grün, Bildung, Heritage, Score** (4 Cluster)

Empfehlung: 5-Cluster-Scope für Phase 1, 4 Cluster später. Falls Lärm-Pilot zeigt dass Template-Erstellung schneller geht als gedacht: alle 9 in Phase 1.

### Co-Design-Session-Pflicht

Q-Template-Tonalität ist Editorial-Entscheidung. Vor Massen-Templating ist User-Matze-Approval verbindlich:

- **Frage-Form:** „Wie laut ist es im Boxhagener Kiez?" (direkter, du-implizit) oder „Welcher durchschnittliche Tages-Lärmpegel wurde für Boxhagener Kiez gemessen?" (formell, distanziert)
- **Antwort-Stil:** sachlich-knapp („L_DEN: 58 dB, Stand 2023") oder erklärend („Der Tages-Lärmpegel L_DEN liegt bei 58 dB. Das ist im Berliner Mittel, deutlich unter Hauptverkehrsstraßen.")
- **Quellen-Footer:** in Antwort-Text integriert oder als separate Sub-Subline
- **Zahlen:** gerundet auf 1 Nachkommastelle? Werte mit Einheit oder nur Zahl?
- **Stigma-Disziplin:** wie wird MSS-Soziale-Lage in Wohnen-Cluster formuliert?

Pilot dokumentiert in `docs/faq-template-style-guide.md`; alle Folge-Cluster halten sich an die Pilot-Konvention.

### Slot-Substitution-Pattern

Templates haben `{slot}`-Platzhalter. Slot-Quellen:

- Aggregat-Werte aus Postgres: `{meanLDen}` → `bezirk_stats.laerm.meanLDen.value`
- Stamm-Daten: `{bezirkName}` → `bezirk_stats.name`, `{kiezName}`, `{layerName}`
- Sub-Slot-Helpers (Pure-Functions): `{laermInterpretation}` → Lookup-Map(dbBucket) → „leise" / „mittel" / „laut"
- Source-Attribution: `{laermSource}` → Layer-Name + Stand-Datum

Renderer-Signatur:

```typescript
function renderTemplate(
  template: FaqTemplate,
  context: TemplateContext, // { pageType, slug, aggregate, name, locale }
  helpers: HelperRegistry
): FaqEntry | null
```

`null`-Rückgabe wenn `requires`-Felder fehlen.

### YAML-Pflicht-Schema (Valibot)

```typescript
const FaqTemplate = v.object({
  id: v.string(),
  applicableTo: v.array(v.picklist(['bezirk', 'kiez', 'layer'])),
  requires: v.array(v.string()), // dot-pfade in aggregate
  question: v.string(),
  answer: v.string(),
  editorialNote: v.optional(v.string()) // z.B. Stigma-Disclaimer
});
const FaqTemplateFile = v.object({
  cluster: v.picklist([...CLUSTERS]),
  locale: v.picklist(['de', 'en']),
  templates: v.array(FaqTemplate)
});
```

### Bits-UI-Disclosure-Komponente bereits da (Open-Question 3)

`src/lib/components/ui/disclosure.svelte` wrappt `bits-ui` `Accordion.Root type="single"`. Für FAQ-Pattern brauchen wir entweder:

- a) `type="multiple"` damit mehrere Q&As gleichzeitig offen sein können (besser für lange FAQ-Listen)
- b) `type="single"` damit nur eine Q&A offen ist (reduzierter Lesefluss, gut für 3-5 Q&As)

Empfehlung (a) `type="multiple"`. Bestehende `disclosure.svelte` ist hard `type="single"`; entweder erweitern um `type`-Prop oder eigene `faq-disclosure.svelte`. Entscheidung beim Dev-Start.

### Progressive-Enhancement-Pattern

Crawler ohne JS müssen FAQ-Content sehen. Bits-UI rendert mit `data-state="closed"` → Content via CSS `display: none` versteckt. Workaround:

- SSR: alle Items offen (`open` initial)
- Client-Hydration: erste Item bleibt offen, Rest fold-up

Oder: Section rendert plain HTML `<details>/<summary>` als no-JS-Fallback und Bits-UI-Disclosure überschreibt im Client. Pragmatisch: Plain `<details>` ist semantisch + a11y-clean + ohne Bits-UI-Hydration-Kosten. Story-Bid: `<details>` statt Bits-UI für FAQ-Section.

### Begriffs-Lint-Test (AC-7)

```typescript
// tests/lint/faq-banned-words.test.ts
const BANNED_DE = ['lebenswert', 'lebensqualität', 'sozial schwach', 'schlechter kiez'];
const BANNED_EN = ['quality of life', 'liveable', 'socially weak'];

it.each(allFaqQna)('FAQ contains no banned words', (entry) => {
  const text = `${entry.question} ${entry.answer}`.toLowerCase();
  for (const word of BANNED) expect(text).not.toContain(word);
});
```

Lint-Gate als Vitest-Test, nicht ESLint-Rule (zu spezifisch für ESLint).

### Page-Type vs. Page-Slug-Konvention

`page_type`-Enum aus Story 2.0: `bezirk | kiez | layer`. `slug` ist der Page-Slug (z.B. `friedrichshain-kreuzberg`, `boxhagener-kiez`, `laerm-2023`). Composite-PK in `faq_qna` (page_type, slug, cluster, locale) garantiert keine Konflikte.

Erweiterung möglich für Ranking-Page (Story 2.9b), Welcome-Overlay (Story 2.11): aktuell out-of-scope.

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** Renderer, Komponente, Build-Step strikt halten
- **#3 Bestehende Funktionen prüfen:** `Disclosure`-Komponente, `valibot`, `js-yaml` (neu), `getBezirkStats`/`getKiezStats` (Story 2.0)
- **#7 TypeScript strict:** Slot-Substitution mit Type-Guard, kein `any`
- **#10 Cookieless:** keine Cookies in FAQ-Section
- **#13 A11y-First:** Disclosure-Pattern muss WCAG-AA, axe 0 Violations
- **#14 i18n-First:** alle UI-Strings via Paraglide, FAQ-Inhalte via lokalisierte YAML-Bundles
- **#19 Remote-Functions:** nicht relevant (Pages sind prerendered, FAQ liegt im Server-Loader)

### Open-Questions vor Dev-Start

1. **Phase-1-Cluster-Scope:** 1 Cluster (nur Lärm), 5 Cluster (Lärm + 4 Stretch), oder alle 9? Empfehlung 5 Cluster. Akzeptabel?
2. **Co-Design-Session:** wann + wie lange? Empfehlung: Lärm-Templates Initial-Draft, dann 30-Min-Review-Session mit User Matze. OK?
3. **Disclosure-Variant:** `<details>` statt Bits-UI für Progressive-Enhancement? Oder Bits-UI `type="multiple"` mit SSR-Workaround? Empfehlung `<details>` (simpler, semantischer).
4. **Build-Step-Pflicht in `prebuild`:** Story 2.0 hatte explizit „`data:aggregate` NICHT in prebuild" (zu teuer für Dev-HMR). FAQ analog: `data:faq` NICHT in prebuild, CI muss explizit aufrufen. OK?
5. **Stigma-Lint-Blacklist:** initial 4 DE + 3 EN-Wörter (siehe Dev-Notes). User soll ergänzen vor Dev-Start.

### Project Structure Notes

- Templates: `src/lib/data/faq-templates/{cluster}/{cluster}.{locale}.yaml` (9 Cluster, aber Phase-1-Scope nur 5)
- Server-Helper: `src/lib/server/faq/` (`template-schema.ts`, `template-renderer.ts`, `load-templates.ts`, `helpers/{cluster}.ts` für Sub-Slot-Lookups)
- Build-Script: `scripts/render-faq.ts` + `scripts/lib/faq/` falls Split nötig
- Komponente: `src/lib/components/atlas/faq-section.svelte`
- Query: `src/lib/server/db/queries/get-faq-qna.ts` (Story-2.0-Stub ausimplementieren)
- Style-Guide: `docs/faq-template-style-guide.md`
- i18n-Keys: neue Messages für FAQ-Header

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1195-L1222](../planning-artifacts/epics.md)
- FR30 + UX-DR28: [prd.md#L732](../planning-artifacts/prd.md), [ux-design-specification.md](../planning-artifacts/ux-design-specification.md)
- Story 2.0: [./2-0-postgres-aggregat-foundation-drizzle-build-step.md](./2-0-postgres-aggregat-foundation-drizzle-build-step.md)
- Story 2.2: [./2-2-json-ld-generator-bibliothek.md](./2-2-json-ld-generator-bibliothek.md)
- Story 2.3: [./2-3-bezirks-pages-prerendered.md](./2-3-bezirks-pages-prerendered.md)
- Story 2.4: [./2-4-kiez-pages-prerendered.md](./2-4-kiez-pages-prerendered.md)
- Story 2.5a: [./2-5a-layer-page-en-variante-dataset-jsonld.md](./2-5a-layer-page-en-variante-dataset-jsonld.md)
- Bestehende Disclosure: [src/lib/components/ui/disclosure.svelte](../../src/lib/components/ui/disclosure.svelte)
- FaqEntry-Typ: [src/lib/data/types.ts:84-87](../../src/lib/data/types.ts)
- Methodik-Statement: [src/routes/(with-header)/methodik/+page.svelte:90-93](../../src/routes/(with-header)/methodik/+page.svelte) („Layer-Beschreibungen schreiben wir manuell. Kein LLM-Output ...")
- Memory `feedback_no_lebenswert.md`, `feedback_no_em_dashes.md`, `project_compare_editorial_profiles.md`

## Dev Agent Record

### Agent Model Used

(wird vom Dev-Agent ausgefüllt)

### Debug Log References

### Completion Notes List

### File List
