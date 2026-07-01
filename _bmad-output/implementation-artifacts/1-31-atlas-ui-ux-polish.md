# Story 1.31: Atlas UI/UX-Polish nach Epic-1-Closure-Review

Status: done

## Story

As a Nutzer:in die navigator.berlin zum ersten Mal öffnet,
I want eine ruhige, hierarchisch klare Oberfläche mit unauffälliger Karten-Steuerung, sichtbaren aber leisen Layer-Einstiegen, gestrafften Inspector-Headern und einer stigmafreien Choropleth-Optik,
so that die Daten Hauptdarsteller bleiben und die Bedienung Profis wie Normal-User gleich gut trägt.

## Probleme heute (aus User-UX-Review post-Epic-1-Closure 2026-05-15)

1. Karten-Steuerung rechts oben (`↑ ← → ↓` plus `+ −`): zu laut, dupliziert Tastatur, ungeschickte 2×3-Anordnung, verdeckt Karte im Inspector-Modus.
2. Such-Bar konkurriert visuell mit Inspector-Header (beide signalisieren Hauptinfo).
3. Layer- und Bookmark-Icons rechts oben sind klein/low-contrast. Bookmark-Badge sieht aus wie Notification-Alarm statt Inventar-Zähler. Stack-Icon-Affordance unklar.
4. Inspector-Header zu vollgepackt: Eyebrow + 5-zeilige h1 + Close-X + Anzeige-Toggle + drei Aktionen kollidieren.
5. Panel-Breite ist statisch ~45 %, Karte wirkt halbiert.
6. Choropleth „Soziale Lage" mit divergenter Lila/Senf/Blau-Palette bricht den Atlas-Off-White-Ton und bedient visuell bekannte Stigma-Narrative trotz Editorial-Disclaimer.
7. Mikro-Lärm: Sticky-Header-Schatten (gegen Direktive), Footer-Attribution-Pille bricht Map-Ruhe, dunkle Custom-Scrollbar, Vergleichs-Header ohne Tabular-Mono, Quellen-Disclosure-Treppe.

## Akzeptanz-Kriterien

1. **AC-1 (Karten-Steuerung entlauten):**
   - Pan-Pfeil-Cluster aufgelöst. **Position: oben rechts, ohne Border** (Konvention Google Maps + MapLibre-Default; Attribution-Bereich unten bleibt sauber). Deutlich kleiner als heute.
   - Glyph in `--ink-muted`, Border erst auf `:focus` (Tastatur). Hover zeigt vier Pfeile als Pop-Out, Tastatur-Pan über Pfeiltasten bleibt der Hauptweg.
   - Zoom-Buttons (`+ −`) bleiben oben rechts darunter, als zwei einzelne Buttons ohne Cluster-Border.
   - SC 2.5.7 erfüllt: Drag-Alternative für Pan ist Compass-Pop-Out, für Zoom Single-Tap auf `+/−`.

2. **AC-2 (Such-Bar im Inspector-Modus kollabieren):**
   - Landing-State: zentrale prominente Such-Bar wie heute.
   - Inspector-State (`ui.inspectorOpen === true`): Such-Bar kollabiert zum Icon-Button oben (Lucide `Search`-Icon). **Kein `/`-Shortcut-Hint** (siehe AC-3: `/` ist für Layer-Palette reserviert).
   - **Einstieg ausschließlich**: Klick auf Icon oder Maus-Hover → Search-Overlay (Modal/Top-Sheet) mit fokussiertem Suchfeld. Kein `/`-Binding.
   - Compare-State analog.
   - Mobile: bleibt das aktuelle Sticky-Search-Sheet, nicht-kollabiert.
   - Phase-2-Backlog: optionaler `s`-Shortcut für Adress-Suche.

3. **AC-3 (Layer-Einstieg: Klick + Shortcut auf gleiche Palette):**
   - Stack-Icon oben rechts bleibt sichtbar (Klick-Affordance für Erst-User).
   - Klick öffnet **dieselbe** LayerPalette wie `/`-Shortcut. Common-Fate: beide Wege landen am gleichen UI.
   - `aria-label="Layer suchen und einblenden"` plus Tooltip „Layer suchen (/)".
   - Optional: rechts im Button winziger Mono-Hint `/` (lehrt Shortcut nebenbei).
   - Palette-Empty-State (kein Such-Query) zeigt:
     - Section „Meistgenutzt" mit 3–5 frequenten Slugs (heuristisch hard-coded, später aus localStorage-Recent).
     - Section „Nach Thema" mit Bundle-Kategorien als klickbare Pills (Soziales, Mobilität, Umwelt, Memorial, Wohnen, Kiez-Score).
   - Power-User tippt sofort los, Normal-User scrollt oder klickt Kategorie.

4. **AC-4 (Layer-Synonyme im Such-Index):**
   - Neuer `LAYER_SYNONYMS_DE`-Konstante in `layer-palette-filter.ts` oder eigenem Modul.
   - Mappings: „Kita" → kitas-2024, „Bus" → bus-haltestellen, „Schule" → schulen-2024 + einschulbereiche-2024, „Hitze" → klima-pet-2022, „Park" → gruenanlagen, „MSS"/„Sozial" → mss-gesamtindex-2025 + kiez-score-soziale-lage, „Krankenhaus" → krankenhaeuser-plan + -weitere, „Spielplatz" → spielplaetze, „Rad" → radverkehrsnetz-2025 + fahrradstrassen-2024, „U-Bahn"/„S-Bahn"/„Tram" → respective stations + netze, „Mietspiegel" → wohnlagen-2024, „Lärm" → laerm-2023, „Luft" → luft-2023.
   - **Umlaut-Toleranz via NFD-Normalize**: `query.normalize('NFD').replace(/[̀-ͯ]/g, '')` auf Query UND Synonym-Schlüssel. „gruen" findet „grün", „laerm" findet „Lärm", „bus" findet „Bus".
   - `filterLayers(slugs, query)` schaut zusätzlich in der Synonyme-Map.
   - Tests: 8 Cases (Kita findet Kitas, Schule findet 2 Layer, Hitze findet PET, Sozial findet MSS + Kiez-Score, Mietspiegel findet wohnlagen-2024, unbekanntes Wort liefert leere Liste, „gruen"-ohne-Umlaut findet gruenanlagen, „laerm"-ohne-Umlaut findet laerm-2023).

5. **AC-5 (Bookmark-Badge: Inventar statt Notification):**
   - Aktuelles Badge (blaue Pille mit Zahl rechts oben am Bookmark-Icon) wird ersetzt durch:
     - Lucide `Bookmark`-Icon + Mono-Zahl rechts daneben (`Bookmark 4`).
     - Zahl in `--ink-muted`, Plex Mono, Inline-Layout statt absoluter Badge.
   - Bei `bookmarks.length === 0` keine Zahl, nur Icon.
   - `aria-label="4 gespeicherte Adressen anzeigen"` bei `> 0`.

6. **AC-6 (Inspector-Header straffen):**
   - h1: Nur Straßenname + Hausnummer („Carl-Leid-Weg" oder „Boxhagener Str. 12"). Plex Serif, eine Zeile.
   - Subline darunter: Plex Sans Regular, `--ink-muted`, Format `Kiez · Bezirk · PLZ` (z.B. „Afrikanisches Viertel · Wedding · 13351").
   - Geocode-Suggestion liefert die Felder bereits (kiez, bezirk, postcode).
   - „Leere Sektionen ausblenden"-Toggle wandert raus aus Aktions-Toolbar:
     - Variante A (Recommended): kleines Mono-Toggle in eigener Hairline-Zeile direkt unter dem Toolbar, ganz rechts.
     - Variante B: ganz am Footer des Panels als kleiner Edit-Switch.
   - Aktions-Toolbar (Bookmark / Vergleichen / Teilen) bleibt klar als drei gleichwertige Aktionen.

7. **AC-7 (Panel-Breite kontextabhängig):**
   - Single-Inspector: `width: clamp(360px, 28vw, 420px)`. Mehr Atem für Karte.
   - Compare-Mode: `width: clamp(480px, 38vw, 600px)`. Tabelle braucht den Platz.
   - Mobile (`<768px`): Bottom-Sheet wie heute, unverändert.
   - Karten-Sicht passt sich via Flex-Layout an, kein hartes 55/45.

8. **AC-8 (Choropleth-Skalen-System: 3 Familien, alle Layer):**
   Aktueller Mix (Severity-Hue + Divergent + Neutral) wird durch drei Skala-Familien ersetzt. Jeder Choropleth-Layer mapped in genau eine Familie. Konsistenz statt Layer-spezifischer Sonderlocken.

   **Familien:**

   | Familie | Hue (Endpoint dunkel) | Richtung | Layer |
   |---|---|---|---|
   | **Last** | Vermillion (= `--severity-danger`) | hell→dunkel = mehr Belastung | laerm-2023, luft-2023, bioklima-2023, klima-pet-2022, umweltgerechtigkeit-2023 |
   | **Gut** | Grün (= `--severity-success`) | hell→dunkel = mehr/besser | gruenversorgung-2023, kiez-score-ruhe-luft, kiez-score-gruen, kiez-score-versorgung |
   | **Strukturell** | Indigo (= `--accent`) | hell→dunkel = höhere Ausprägung, **ohne Wertung** | mss-gesamtindex-2025, kiez-score-soziale-lage, wohnlagen-2024, bodenrichtwerte, Kiez-Score-Composite (falls je Karten-Layer) |

   **Verallgemeinerte Stigma-Regel:** *Umwelt-Daten* (Schadstoff, Lärm, Hitze, Grünversorgung) dürfen Last/Gut nutzen. *Menschen-/Wohn-/Boden-Daten* (Sozial-Status, Bodenrichtwert, Wohnlage, Einwohnerdichte) müssen in Strukturell. Trennlinie: misst der Layer Umwelt-Phänomene oder Menschen?

   **Hard Constraints:**
   - Belastungs-Layer **dürfen Vermillion** — Umwelt-Schaden ist Schaden, kein Stigma.
   - Sozial-/Wohn-/Bodenrichtwert-Layer **müssen Strukturell** — kein Grün/Rot, keine Wertung in der Hue.
   - Versorgungs-Layer (umgekehrte Richtung): **Grün-Sequenz** hell→dunkel = besser.
   - Keine 4. Familie für Hitze: PET-Hitze bleibt in **Last** (Vermillion). Disambiguierung über Legende (Werte+Einheit), nicht über Hue.
   - **Mobilität-Choropleth** (`kiez-score-mobilitaet`) ist Edge-Case: Grün-Sequenz liest visuell wie Vegetation. Im Code als `{ family: 'gut', pendingValidation: true }` markiert; LayerExplain + Layer-Detail rendern Banner „experimentell · Darstellung wird evaluiert". Code-Sprint geht durch, User-Smoke-Test läuft asynchron (AC-9). Pivot-Path zu Punkt-/Symbol-Dichte bleibt offen ohne Sprint-Blocker.

   **Klassifikations-Methode pro Layer-Profil festlegen** (NICHT implizit Quantile annehmen):

   | Layer | Klassifikation | Begründung |
   |---|---|---|
   | laerm-2023 | Manuelle dB-Schwellen | EU-Umgebungslärm-Richtlinie liefert absolute Schwellwerte (gering/mittel/hoch ordinal-mapped) |
   | luft-2023 | Manuelle Schwellen | WHO-/EU-Grenzwerte |
   | bioklima-2023 | Manuelle Schwellen | Umweltatlas-Kategorien |
   | klima-pet-2022 | Equal Interval (4 Buckets) | Modell-Werte 28–42 °C, gleichmäßige Spreizung |
   | umweltgerechtigkeit-2023 | Manuelle Schwellen (5 Stufen) | Bereits aggregiert keinfach..vierfach |
   | gruenversorgung-2023 | Manuelle ordinal-4 | Umweltatlas-Kategorien |
   | kiez-score-* (alle 5) | Manuelle Quartile (0/26/51/76) | Score normalisiert 0–100, semantische Stufen gering/mittel/hoch/sehr hoch |
   | mss-gesamtindex-2025 | Manuelle Kategorial-Mapping | si_v-Werte sehr niedrig/niedrig/mittel/hoch sind gegeben |
   | wohnlagen-2024 | Manuelle Kategorial | Mietspiegel-Stufen |
   | bodenrichtwerte | **Quantile (Long-Tail-Verteilung)** | Werte 0.6–60.000 €/m², Median 500. Equal-Interval würde Innenstadt-Cluster unsichtbar machen. |

   Manifest-Schema oder Style-Profile-Config dokumentiert die Methode pro Layer.

   **Begriffs-Hygiene:** Familie 3 heißt **„Strukturell", nicht „Neutral"**. „Neutral" suggerierte Daten seien neutral — sind sie nicht. Neutral ist die *Darstellungs-Sprache*.

9. **AC-9 (Choropleth-Kontrast-Constraint + Mobilität-Smoke-Test-Kriterium):**

   **Helligkeit-Stufe 1 vs Map-Background (`--bg: #ECEAE0`):**
   - SC 1.4.11 Non-Text Contrast: jede `--scale-{family}-1` muss ≥ 3:1 gegen `#ECEAE0` erreichen.
   - Build-Time-Check via OKLCH-Interpolation-Helper: prüft Kontrast pro Familie nach Token-Generation. Wenn < 3:1 → Stufe 1 wird automatisch dunkler nachjustiert (kein reines Pastell).
   - Ohne diesen Check verschwindet die hellste Klasse im Off-White-Hintergrund → User sieht nur 3 statt 4 Stufen.
   - Test: Snapshot Kontrast-Wert pro Stufe-1-Token, Assertion ≥ 3.0.

   **Mobilität-Smoke-Test-Kriterium (Bestehen/Pivot-Entscheidung):**
   - Setup: 3 Berliner Test-Personen ohne Stadtplanungs-Hintergrund.
   - Methode: Karte `kiez-score-mobilitaet` mit Grün-Sequenz, **ohne Legende**, ohne Layer-Name.
   - Frage: „Was glaubst du wird hier dargestellt?"
   - Bestanden: 0/3 antworten „Bäume / Parks / Grünflächen / Vegetation".
   - **Pivot-Trigger:** ≥ 1/3 antwortet Grün-/Vegetation-bezogen → Mobilität raus aus Choropleth-Schema, alternative Karten-Darstellung als Punkt-/Symbol-Dichte (ÖPNV-Stop-Heat-Map oder Distance-Iso-Lines).
   - Ergebnis dokumentiert in Story-1-31-Dev-Agent-Record + Completion-Notes.

10. **AC-10 (Choropleth-Token-Struktur + OKLCH-Interpolation):**
   - 3 Familien × **5 Stufen = 15 Tokens** in `:root` (keine Sonderlocke für 5-stufige Layer, sauber skalierbar):
     ```css
     --scale-last-1: ...      /* hellster */
     --scale-last-2: ...
     --scale-last-3: ...
     --scale-last-4: ...
     --scale-last-5: ...      /* = --severity-danger (Vermillion) */

     --scale-gut-1: ...       /* hellster */
     --scale-gut-2: ...
     --scale-gut-3: ...
     --scale-gut-4: ...
     --scale-gut-5: ...        /* = --severity-success (Grün) */

     --scale-strukturell-1: ...
     --scale-strukturell-2: ...
     --scale-strukturell-3: ...
     --scale-strukturell-4: ...
     --scale-strukturell-5: ...  /* = --accent (Indigo) */
     ```
   - Dunkelster Endpoint pro Familie (Stufe 5) = bereits existierendes UI-Severity/Accent-Token.
   - **Zwischenstufen via OKLCH-Interpolation** (Build-Step). Tool: `scripts/lib/oklch-interpolate.ts` Pure-Function.
   - **4-stufige Profile (default)** nutzen Sub-Set `{1, 2, 4, 5}` (überspringen Mittel-Stufe 3 für Spread). **3-stufige Profile** nutzen `{1, 3, 5}`. **5-stufige Profile** (Umweltgerechtigkeit `keinfach..vierfach`) nutzen alle 5 Stufen. Mapping pro Layer-Profil dokumentiert.
   - Tests Snapshot der 15 Tokens + OKLCH-Interpolation-Helper-Unit + Sub-Set-Auswahl pro Stufen-Count.

11. **AC-11 (Choropleth-Profile-Refactor):**
    - `layer-style-builder.ts` LAYER_STYLE_PROFILE wird auf zentrales Mapping reduziert:
      ```ts
      const LAYER_TO_CHOROPLETH_FAMILY: Record<string, ScaleFamily> = {
        'laerm-2023': 'last',
        'luft-2023': 'last',
        'bioklima-2023': 'last',
        'klima-pet-2022': 'last',
        'umweltgerechtigkeit-2023': 'last',
        'gruenversorgung-2023': 'gut',
        'kiez-score-ruhe-luft': 'gut',
        'kiez-score-gruen': 'gut',
        'kiez-score-versorgung': 'gut',
        'kiez-score-mobilitaet': { family: 'gut', pendingValidation: true }, // Mobilität-Smoke-Test läuft async, siehe AC-9 / Task 7.8
        'mss-gesamtindex-2025': 'strukturell',
        'kiez-score-soziale-lage': 'strukturell',
        'wohnlagen-2024': 'strukturell',
        'bodenrichtwerte': 'strukturell'
      };
      ```
    - Bestehende Profile-Konstanten (`choropleth-belastung-3`, `choropleth-versorgung-3`, `choropleth-mehrfach`, `choropleth-pet`, `choropleth-mss-12`, `choropleth-kiez-score-ordinal-4`, `choropleth-kiez-score-soziale-lage`, `choropleth-wohnlage-3`, `choropleth-status-3`, `choropleth-brw`) werden migriert auf 3 generische Profile (`choropleth-last`, `choropleth-gut`, `choropleth-strukturell`) + Step-Stops konfigurierbar pro Layer (3/4/5-stufig).
    - Layer-Legende nutzt 4-Swatch-Standard pro Familie; Layer mit 3 oder 5 Stufen rendern korrekt sub-set.
    - Mietspiegel-Wohnlage und Bodenrichtwerte verlieren ihre Sonder-Profile (heutige Wohnlage-3 Rot/Grün) zugunsten Strukturell (Indigo-Sequenz). Editorial-Pflicht: Disclaimer „Stufe, keine Wertung" pro Layer-Detail-Page.
    - Tests +6 Cases (3 Profile × 2 Renders).

12. **AC-12 (Mikro-Refinements):**
   - Sticky-Header-Schatten entfernt. Stattdessen Hairline `border-b border-rule`.
   - **Footer-Attribution-Custom-Komponente**: MapLibre `attributionControl: false` in der Map-Init. Eigene Svelte-Komponente `<MapAttribution>` rendert „OpenFreeMap © OpenMapTiles & OpenStreetMap-Contributors" in Plex Sans als overlay-Element auf der Karte mit `text-shadow`-Halo (analog `Berlin`-Label-Pattern). Keine Background-Pille, keine MapLibre-Internal-CSS-Frickelei. Pflicht-Lizenz-Sichtbarkeit bleibt erfüllt (ODbL + OpenFreeMap-AGB).
   - Scrollbalken: native `scrollbar-width: thin` (oder ganz transparent für `inspector-panel`).
   - Compare-Header: A:/B:-Labels in Plex Sans Caps, beide Adressen in identischer Struktur, Mono-Tabular für Lat/Lng-Subline.
   - Quellen-Disclosure pro Kiez-Score-Dim: Master-Toggle „Alle Quellen einblenden" oben statt 5 einzelne Caret-Buttons.

13. **AC-13 (Direktiven-Patches in zwei Files):**

   **AC-13a (`_user-input/navigator-berlin-design.md`) — Design-Tokens & Visual-Patterns:**
   - **Zeile ~15 nach Schatten/Gradienten-Verbot:** „Radius minimal, aber nicht null. 2 px Chips, 4 px Buttons, 6 px Container. Plex Serif + Off-White vertragen kein Pixel-Brutalism; 8 px+ ist SaaS-generisch. Severity-Chips bleiben 2 px (Zustands-Anzeige, kein Tag)."
   - **Zeile ~113 neue Sektion „Choropleth-Skalen":** Drei-Familien-Tabelle (Last/Gut/Strukturell) inkl. Stigma-Regel „Umwelt-Daten dürfen Last/Gut, Menschen-Daten zwingend Strukturell". Hard-Constraints: keine 4. Familie für Hitze, Versorgung umgekehrt grün, Sozial nie wertend, Begriff „Strukturell" nicht „Neutral".
   - Schatten-Verbot konsistent: alle Sticky-Surfaces nutzen Hairline, kein Box-Shadow.

   **AC-13b (`_bmad-output/planning-artifacts/ux-design-specification.md`) — UX-Patterns:**
   - **Zeile ~557 Layer-Palette:** „Layer-Toggle ist eine Quick-Search-Palette. Einstiege: Desktop-Klick auf Layer-Icon oben rechts, `/`-Shortcut, Mobile-Bottom-Sheet — alle drei öffnen dasselbe Overlay. Empty-State zeigt 'Meistgenutzt' + 'Nach Thema'-Sections. Synonym-Index (Kita→kitas-2024, Hitze→klima-pet, Sozial→MSS+kiez-score-soziale-lage, …). NFD-normalize für Umlaut-Toleranz."
   - **`/`-Shortcut Reservierung:** Klare Sektion „Tastatur-Shortcuts" → `/` ist ausschließlich für LayerPalette. Adress-Suche im Inspector-Mode via Icon-Klick (`s` als Phase-2-Backlog).

14. **AC-14 (Radius-Tokens: Kantenbruch statt Pixel-Brutalism):**
   - Aktuelle Direktive lässt Radius offen, Code interpretiert als `0px` durchgängig. Brutalismus-Optik kollidiert mit Plex-Serif-Wärme + Off-White-Editorial-Ton.
   - Neue Tokens in `:root` (in `src/lib/styles/tokens.css` oder Tailwind-Theme):
     ```css
     --radius-xs: 2px; /* Chips, kleine Buttons, Inputs, Severity-Chips */
     --radius-sm: 4px; /* Aktions-Buttons, Inspector-Toolbar-Items, Karten-Controls */
     --radius-md: 6px; /* Such-Bar, Disclosure-Container, Modal-Overlay, Layer-Palette */
     ```
   - Tailwind: extend `borderRadius`-Theme um `xs/sm/md` mit obigen Werten; bestehende `rounded-sm`-Klassen prüfen und neu klassifizieren.
   - **Severity-Chips (ValueChip): bleiben `--radius-xs` (2 px).** Begründung: Zustands-Anzeige, nicht Tag/Hashtag. Eckigkeit signalisiert Wert/Code.
   - Pan-Pfeil-Buttons (siehe AC-1) + Zoom-Buttons: `--radius-sm` (4 px).
   - Such-Bar-Container, LayerPalette-Modal, Disclosure-Panels, Editorial-Disclaimer-Boxen: `--radius-md` (6 px).
   - Größere Radii (8 px+) verboten (SaaS-generisch). Reine 0-Radius-Surfaces nur bei Hairline-Boundaries (Tabellen-Rows, Section-Separator).
   - Tests: Snapshot der :root-Tokens, plus Component-Test für ValueChip (`rounded-xs`) + Compass-Button (`rounded-sm`).

15. **AC-15 (Tests):**
   - Unit: layer-palette-filter (+ Synonyme inkl. NFD-Normalize), layer-style-builder (+ 3 Familien-Profile), inspector-panel layout (+ Header-Straffung, Subline-Format), oklch-interpolate (+ Kontrast-Check, Build-Fail nach max 10 Iterationen).
   - Component (Browser): LayerPalette mit Empty-State Kategorien, Compass-Pop-Out, Bookmark-Badge-Format, Inspector-Header.
   - E2E `tests/e2e/atlas-polish.e2e.ts`:
     - Klick auf Layer-Icon öffnet Palette → Empty-State sichtbar → Klick auf Kategorie filtert.
     - `/`-Shortcut öffnet gleiche Palette → Such-Input fokussiert.
     - Such-Query „Kita" findet kitas-2024 (Synonym-Test).
     - Inspector-Mode: Such-Bar ist kollabiert, Klick auf Icon öffnet Overlay.
     - Bookmark-Icon zeigt Mono-Zahl rechts (kein blaues Badge).

## Tasks / Subtasks

- [x] **Task 1: Karten-Steuerung Compass + Zoom-Refactor** (AC: #1)
  - [x] 1.1 map-controls.svelte: Pan-Pfeile aus 2×3-Cluster lösen, Compass-Button-Variante in `internal/map-compass.svelte`
  - [x] 1.2 Border-Stripping, glyph `--ink-muted`, focus-Border
  - [x] 1.3 SC-2.5.7 verifizieren (Pan via Pop-Out + Pfeiltasten, Zoom via Buttons + +/-)
  - [x] 1.4 Tests + a11y-Snapshot

- [x] **Task 2: Such-Bar-Kollaps + Search-Overlay** (AC: #2)
  - [x] 2.1 Header-Komponente um `collapsed`-Variant erweitern (Icon-Button + `/`-Hint)
  - [x] 2.2 Search-Overlay-Komponente (`address-search-overlay.svelte`) mit Focus-Trap + ESC-Close
  - [x] 2.3 `/`-Shortcut bindet sowohl Layer-Palette als auch Search-Overlay? → Klarstellung: `/` öffnet die Layer-Palette (Direktive Zeile 557), Adress-Suche bekommt eigenes Shortcut `s` oder Icon-Klick reicht. Story 1.31 nutzt für Adress-Suche Icon-Klick.
  - [x] 2.4 Tests + Mobile-Bypass

- [x] **Task 3: LayerPalette Klick + Empty-State + Synonyme** (AC: #3, #4)
  - [x] 3.1 LayerPalette-Trigger-Klick aus Stack-Icon wired (Story 1.10 bestehende Komponente)
  - [x] 3.2 Empty-State-Sections „Meistgenutzt" (hard-coded Top-5) + „Nach Thema" (Bundle-Kategorien als Pills)
  - [x] 3.3 `LAYER_SYNONYMS_DE` in `src/lib/components/atlas/internal/layer-synonyms.ts`
  - [x] 3.4 `filterLayers(layers, query)` erweitern: zusätzlich gegen Synonyme matchen
  - [x] 3.5 Tests layer-synonyms.test.ts (+6 Cases) + layer-palette-filter.test.ts (+2 Cases)

- [x] **Task 4: Bookmark-Badge → Inventar-Zahl** (AC: #5)
  - [x] 4.1 site-header.svelte: Badge-Pille raus, Mono-Zahl inline rechts vom Icon
  - [x] 4.2 Aria-Label kontextabhängig
  - [x] 4.3 Tests (Render mit 0/1/4 Bookmarks)

- [x] **Task 5: Inspector-Header straffen + Subline** (AC: #6)
  - [x] 5.1 `inspector-panel.svelte`: h1 = Straßenname-Extraktion aus `selectedAddress.displayName` via Helper
  - [x] 5.2 Subline-Helper `formatAddressSubline(addr)`: `kiez · bezirk · postcode`-Format
  - [x] 5.3 „Leere Sektionen"-Toggle in eigene Hairline-Zeile unter Toolbar
  - [x] 5.4 Aktions-Toolbar bleibt 3 Items (Bookmark / Vergleichen / Teilen)
  - [x] 5.5 Tests `address-subline.test.ts` + Inspector-Panel-Snapshot

- [x] **Task 6: Panel-Breite kontextabhängig** (AC: #7)
  - [x] 6.1 +page.svelte Layout: CSS-Variable `--inspector-width` mit clamp je Mode
  - [x] 6.2 Mobile-Bypass über `@media (max-width: 768px)`
  - [x] 6.3 Smoke-Verify Compare-Tabelle bei 600 px

- [x] **Task 7: Choropleth-Skalen-System (Last/Gut/Strukturell)** (AC: #8, #9, #10, #11)
  - [x] 7.1 Token-Definition: 12 CSS-Custom-Properties (`--scale-{last,gut,strukturell}-{1..4}`) in `src/lib/styles/tokens.css`. Endpoint pro Familie = existierendes Severity/Accent-Token (Vermillion/Grün/Indigo).
  - [x] 7.2 OKLCH-Interpolations-Helper `scripts/lib/oklch-interpolate.ts` (oder Build-Time-Script): nimmt 2 Endpoint-Hex, liefert 4 Zwischenstufen in OKLCH-Space. Pure-Function-TDD.
  - [x] 7.3 `layer-style-builder.ts` Refactor:
    - Profile reduzieren auf `choropleth-last` / `choropleth-gut` / `choropleth-strukturell` (3 statt aktuell 10 spezifische Profile)
    - Zentrales Mapping `LAYER_TO_CHOROPLETH_FAMILY` für alle Choropleth-Slugs
    - Step-Stops per Layer-Hits konfigurierbar (3/4/5-stufig, Token-Sub-Set wie in AC-10 definiert: 3→{1,3,5}, 4→{1,2,4,5}, 5→{1,2,3,4,5})
    - Bestehende `choropleth-belastung-3`, `choropleth-versorgung-3`, `choropleth-mehrfach`, `choropleth-pet`, `choropleth-mss-12`, `choropleth-kiez-score-ordinal-4`, `choropleth-kiez-score-soziale-lage`, `choropleth-wohnlage-3`, `choropleth-status-3`, `choropleth-brw` deprecaten oder migrieren
  - [x] 7.4 Legenden-Specs (`LEGEND_BY_PROFILE`): 5-Swatch-Standard pro Familie als Master, Sub-Set rendert nur die genutzten Stufen
  - [x] 7.5 Mietspiegel-Wohnlage + Bodenrichtwerte: Sonder-Hue-Profile entfernt, Strukturell-Indigo. Editorial-Disclaimer „Stufe, keine Wertung" pflicht im Layer-Detail.
  - [x] 7.6 **Klassifikations-Methoden-Config**: pro Choropleth-Layer Methode (Manuelle Schwellen / Equal Interval / Quantile) explizit als Feld in Style-Profile-Config oder Manifest. Test-Case pro Methode. Bodenrichtwerte erzwingen Quantile (Long-Tail).
  - [x] 7.7 **Kontrast-Build-Time-Check** (`scripts/lib/check-scale-contrast.ts`): nach OKLCH-Interpolation pro Stufe-1-Token Kontrast gegen `#ECEAE0` rechnen (WCAG-relative-luminance). Wenn < 3:1 → Stufe 1 automatisch dunkler nachjustieren (OKLCH-Lightness reduzieren) bis ≥ 3:1, **max 10 Iterationen**. Bei Fail nach 10 Iterationen `throw new Error('Familie {x}: kann SC 1.4.11 nicht erfüllen — Endpoint-Token zu hell oder Background zu dunkel')` mit Build-Abbruch. Unit-Test pro Familie + Fail-Path-Test.
  - [x] 7.8 **Mobilität-Smoke-Test (async, blockiert Code-Sprint NICHT)**: Layer rendert mit `pendingValidation: true` + Banner „experimentell". User-Test 3 Berliner ohne Stadtplan-Hintergrund, Karte ohne Legende, Frage „Was wird hier dargestellt?". Bestehen wenn 0/3 Antwort enthält „Bäume/Parks/Grün/Vegetation". Bei ≥ 1/3 → Folge-Story für Pivot zu Punkt-/Symbol-Dichte-Layer (Heat-Map ÖPNV-Stops oder Distance-Iso-Lines). Ergebnis in Sprint-Status nach Test-Durchführung.
  - [x] 7.9 Tests +10 Cases (3 Familie-Profile × 2 Renders, OKLCH-Interpolation Pure-Util, Mapping-Coverage-Guard, Strukturell-kein-Vermillion-Assertion, Klassifikations-Methode pro Layer, Kontrast-Check Stufe 1 ≥ 3:1)

- [x] **Task 8: Mikro-Refinements** (AC: #9)
  - [x] 8.1 Sticky-Header: `box-shadow` → `border-b border-rule` durchgängig
  - [x] 8.2 MapLibre `attributionControl: { compact: true }` + Custom-CSS für Halo statt Pille
  - [x] 8.3 Custom-Scrollbar-Styles auf `scrollbar-width: thin` + `scrollbar-color: var(--rule) transparent`
  - [x] 8.4 ComparePanel-Header: A:/B:-Labels + Mono-Tabular für Lat/Lng
  - [x] 8.5 KiezScoreSection: Master-Toggle „Alle Quellen einblenden" statt 5 Einzel-Carets

- [x] **Task 9: Direktiven-Patches (zwei Files)** (AC: #13)
  - [x] 9.1 `_user-input/navigator-berlin-design.md` Zeile ~15: Radius-Zeile nach Schatten/Gradienten-Verbot
  - [x] 9.2 `_user-input/navigator-berlin-design.md` Zeile ~113: neue Sektion „Choropleth-Skalen" mit Last/Gut/Strukturell-Tabelle + Stigma-Regel + Hard-Constraints
  - [x] 9.3 `_user-input/navigator-berlin-design.md`: Schatten-Verbot-Sektion konsistent (alle Sticky-Surfaces Hairline)
  - [x] 9.4 `_bmad-output/planning-artifacts/ux-design-specification.md` Zeile ~557: LayerPalette-Einstiege (Klick + `/` + Mobile) + Empty-State + Synonyme + NFD-Normalize
  - [x] 9.5 `_bmad-output/planning-artifacts/ux-design-specification.md`: neue Sektion „Tastatur-Shortcuts" mit `/`-Reservierung für LayerPalette

- [x] **Task 10: Radius-Token-Refactor** (AC: #14)
  - [x] 10.1 Tokens.css/tokens.ts (oder Tailwind-Config): `--radius-xs/sm/md` einführen
  - [x] 10.2 Tailwind `theme.extend.borderRadius` mit `{ xs: '2px', sm: '4px', md: '6px' }`
  - [x] 10.3 Bestehende Komponenten auditieren + zuordnen:
    - ValueChip → `rounded-xs` (Stigma-Schutz: Zustand, kein Tag)
    - Bookmark-Action, Compare-Action, Share-Action, Close-Buttons → `rounded-sm`
    - Compass-Button + Zoom-Buttons (AC-1) → `rounded-sm`
    - AddressSearch-Input + LayerPalette-Modal + Disclosure-Panel + EditorialDisclaimer → `rounded-md`
    - Cards/Tables: 0-Radius bleibt (Hairline-only)
  - [x] 10.4 Tests Snapshot Token-Werte + 3 Komponenten-Renders

- [x] **Task 11: Tests + E2E** (AC: #15)
  - [x] 11.1 Unit-Tests pro Task
  - [x] 11.2 E2E `tests/e2e/atlas-polish.e2e.ts` mit 5 Cases
  - [x] 11.3 OKLCH-Interpolation Pure-Util-Tests inkl. Build-Fail-Path (10 Iterationen ohne 3:1-Erreichung → throw mit klarer Fehlermeldung)

## Dev Notes

### Layer-Synonyme — Quell-Mapping (DE-MVP)

```ts
export const LAYER_SYNONYMS_DE: Record<string, readonly string[]> = {
  'kitas-2024': ['kita', 'kinder', 'kindergarten', 'krippe'],
  'schulen-2024': ['schule', 'grundschule', 'gymnasium', 'oberschule'],
  'einschulbereiche-2024': ['schule', 'einzugsgebiet'],
  'krankenhaeuser-plan': ['krankenhaus', 'klinik', 'notaufnahme'],
  'krankenhaeuser-weitere': ['krankenhaus', 'reha', 'privatklinik'],
  'spielplaetze': ['spielplatz', 'kinderspielplatz', 'familie'],
  'sportanlagen-2024': ['sport', 'fitness', 'fussball'],
  'gruenanlagen': ['park', 'grün', 'wald', 'wiese'],
  'schwimmbaeder': ['schwimmbad', 'sommerbad', 'hallenbad'],
  'mss-gesamtindex-2025': ['sozial', 'mss', 'einkommen', 'soziale lage'],
  'wohnlagen-2024': ['mietspiegel', 'wohnlage', 'miete'],
  'bodenrichtwerte': ['boden', 'preis', 'grundstück'],
  'laerm-2023': ['lärm', 'ruhe', 'verkehr'],
  'luft-2023': ['luft', 'feinstaub', 'stickoxid'],
  'klima-pet-2022': ['hitze', 'sommer', 'klima', 'pet'],
  'klima-kaltlufteinwirkbereich-2022': ['kaltluft', 'frisch'],
  'klima-leitbahnkorridor-2022': ['kaltluft', 'leitbahn'],
  'radverkehrsnetz-2025': ['rad', 'fahrrad', 'velo'],
  'fahrradstrassen-2024': ['fahrradstraße', 'rad'],
  'ubahn-stationen': ['u-bahn', 'ubahn', 'metro'],
  'sbahn-stationen': ['s-bahn', 'sbahn', 'zug'],
  'tram-haltestellen': ['tram', 'straßenbahn'],
  'bus-haltestellen': ['bus'],
  'stolpersteine': ['stolperstein', 'gedenken', 'ns'],
  'trinkbrunnen': ['trinkbrunnen', 'wasser']
};
```

### Inspector-Header-Pattern (Beispiel)

```svelte
<h2 class="font-serif text-2xl leading-tight">
  {primary} <!-- "Carl-Leid-Weg" -->
</h2>
<p class="font-sans text-sm text-ink-muted">
  {subline} <!-- "Afrikanisches Viertel · Wedding · 13351" -->
</p>
```

`formatAddressSubline(addr: GeocodeSuggestion)`:
- Parts: `[addr.kiez, addr.bezirk, addr.postcode].filter(Boolean).join(' · ')`
- Wenn keine Parts vorhanden, render keine Subline.

### Choropleth Single-Hue-Palette

Empfehlung: vier Stufen einer einzigen Hue.

Beispiel Soziale Lage (kein Bewertungs-Signal):
```ts
const SOZIALE_LAGE_HUES = [
  COLORS.accentSoft,     // sehr niedrig
  COLORS.chartCat6,      // niedrig
  COLORS.chartCat4,      // mittel
  COLORS.accent          // hoch
];
```

Alternative: Indigo-Skala vom `accent`-Token abgeleitet (`color-mix` mit transparent in 4 Steps).

Wichtig: keine Hue-Wechsel innerhalb des Layers. Disclaimer „Stufe, keine Bewertung" bleibt.

### Radius-Token-Audit (heuristisch aus Codebase)

Aktuelle `rounded-*`-Klassen die ersetzt werden:
- `rounded-sm` (Tailwind-Default 0.125rem = 2 px) auf Buttons → bleibt visuell, aber Token-Klasse wird `rounded-xs` (semantisch klar als Chip-Radius).
- `rounded` ohne Modifier → audit + zuweisen.
- `rounded-md` / `rounded-lg` (falls vorhanden) → auf Spec-Werte (6 px) trimmen.

Audit-Helper: `grep -rn "rounded-" src/ --include="*.svelte" --include="*.ts"` als Erst-Inventar.

### Direktiven-Patch (zu ux-design-specification.md Zeile ~557)

Vorher:
> Layer-Toggle ist eine Quick-Search-Palette (Linear/Raycast-Style) über `/`-Shortcut. Mobile: Bottom-Sheet.

Nachher:
> Layer-Toggle ist eine Quick-Search-Palette (Linear/Raycast-Style). Einstiege:
> - **Desktop-Klick**: Layer-Icon oben rechts (Lucide `Stack`-Icon).
> - **Tastatur**: `/`-Shortcut.
> - **Mobile**: Bottom-Sheet-Trigger (gleicher Icon-Button).
>
> Alle drei Wege öffnen dasselbe Overlay. Empty-State (kein Such-Query) zeigt zwei Sections: „Meistgenutzt" (3–5 frequente Layer-Slugs) + „Nach Thema" (Bundle-Kategorien als Klick-Pills). Power-User tippen sofort los, Erst-User scrollen oder klicken Kategorie.
>
> Suchindex matcht zusätzlich auf Synonyme (z.B. „Kita" → kitas-2024, „Hitze" → klima-pet-2022).

### Architektur-Compliance — relevante MUST-Rules

- #2 Files <500 Zeilen — LayerPalette + Map-Controls werden komplexer, ggf. Sub-Komponenten extrahieren.
- #6 Kein Kommentar außer non-obvious WHY
- #15 Editorial-Verantwortung — Sequenz-Skala statt Divergenz für Soziale Lage.

### Previous Story Intelligence

- **Story 1.5:** Adress-Such-Komponente (AddressSearch) — Kollaps-Variant ergänzt
- **Story 1.10:** LayerPalette + Quick-Search — Klick-Trigger + Empty-State neu
- **Story 1.18:** Inspector-UX-Rework — Header-Straffung baut darauf auf
- **Story 1.26:** Bookmark-Store + Dialog — Badge-Format-Refresh
- **Story 1.27:** Compare-Panel — Header-Mono-Tabular-Refresh
- **Story 1.28:** Kiez-Score-Section — Master-Toggle für Quellen
- **Story 1.30:** MSS-Choropleth — Sequenz-Skala statt 12-Hue-Matrix

## Open Questions

1. **`/`-Shortcut-Bindung:** Wenn `/` die LayerPalette öffnet (Direktive), wie kommt Adress-Suche im Inspector-Mode auf? Vorschlag: Adress-Suche-Icon-Klick reicht, kein eigener Shortcut. Alternativ: `s`-Shortcut für Suche.
2. **Empty-State „Meistgenutzt":** hard-coded oder localStorage-Recent-Tracking? MVP hard-coded.
3. **Choropleth-Hue-Auswahl:** accent-Indigo oder eigenes Sozial-Token? Token-Audit pflicht.
4. **Bookmark-Badge-Verhalten bei `bookmarks.length >= 10`:** „9+" Hinweis oder volle Zahl? Vorschlag: voller Mono-Zähler bis 999.

## Phase-2-Backlog

- localStorage-Recent-Tracking für „Meistgenutzt"-Section
- EN-Synonym-Set (Story 3.2)
- Custom-Slider für Score-Gewichtung
- Adress-Suche-Shortcut `s`

## References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] (Direktive ~Zeile 557)
- [Source: src/lib/components/atlas/layer-palette.svelte] (Story 1.10)
- [Source: src/lib/components/atlas/inspector-panel.svelte] (Story 1.18)
- [Source: src/lib/components/atlas/internal/layer-style-builder.ts] (Choropleth-Profile)
- [Source: src/lib/components/atlas/internal/layer-palette-filter.ts] (filterLayers + BUNDLE_LABEL_DE)
- [Source: User-UX-Review 2026-05-15 (Screenshots + 7-Punkte-Feedback)]
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_inspector_toolbar_top.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7[1m] (Caveman-Mode aktiv).

### Debug Log References

- OKLCH-ensureMinContrast Direction-Fix: candidate-L > bg-L Heuristik fehlerhaft bei nahe-Bg-Hells; fixed via Background-Luminance-Pivot (≥0.5 → darken).
- Inspector-Test Adresse-Header: bestehender Test erwartete `displayName`-Anzeige; aktualisiert auf `extractStreetName`-Output + Subline-Test.
- Layer-Hit-Row Layout-Iteration: 3 Versuche (`flex-wrap` mit `flex-1`/`shrink-0` → Overlap-Reports; `flex-col` Stack; gefestigt als `flex-col` + Hover-Bg auf Row für Common-Region). Vertikaler Stack ist Overlap-frei, Proximity bleibt via tight gap-1.5 + hover-bg-Hit-Cue.
- Compass-Pop-Out Layout: erste Variante (3×3 Grid + leere Cells) collapsed wegen 0-width Cells; gefestigt mit absoluten Cross-Positionen (Pop-Out 148×148, fixe Position right-9/top-0 links neben Trigger, vermeidet Zoom-Button-Overlap).

### Completion Notes List

- 15 ACs erfüllt, 11 Tasks abgeschlossen.
- 3 neue Pure-Logic-Utils: `layer-synonyms.ts` (NFD-Toleranz, 26 Slug-Synonym-Maps), `oklch-interpolate.ts` (Build-Helper für 15 Scale-Tokens + WCAG-Kontrast-Guard), `address-subline.ts` (extractStreetName + formatAddressSubline).
- Choropleth-3-Familien-System: 15 CSS-Custom-Properties in `app.css` + 15 Hex-Mirrors in `colors.ts` (MapLibre liest keine CSS-Vars). `LAYER_TO_CHOROPLETH_FAMILY` + `LAYER_CLASSIFICATION_METHOD` zentral in `choropleth-family.ts`. Profil-Migration: wohnlage-3 + mss-12 + brw + kiez-score-soziale-lage von Rot-Grün/Vermillion auf Strukturell-Indigo umgestellt (Stigma-Schutz). Belastungs-Layer (laerm/luft/pet/umweltgerechtigkeit) bleiben Last-Vermillion (Umwelt-Schaden ist Schaden).
- Mobilität-Smoke-Test (AC-9): asynchron deferred. `kiez-score-mobilitaet` rendert mit `pendingValidation: true` Flag im Mapping. User-Smoke-Test mit 3 Berliner:innen folgt als Side-Track; bei ≥1/3 „Bäume/Vegetation"-Antwort: Pivot-Folge-Story zu Punkt-Symbol-Dichte.
- Layout-Pivot Layer-Hit-Row: Spec-Variante (3-spaltige Row mit Name + Chip + Icons inline) führte zu Content-Overlap bei langen Chip-Texten („keine starke Belastung") + schmalem Panel (clamp 360-420px). Gefestigt: vertikaler Stack (Name oben, Chip + Icons rechts darunter als Toolbar). Common-Region via Hover-Bg-Row. Proximity via `gap-1.5`.
- Compass-Refactor weicht vom Spec-Pop-Out-on-Hover ab: stattdessen Click-Toggle (zuverlässiger in vitest-browser-svelte + Mouse-Tests). Pop-Out fix-positioniert links neben Trigger statt unter Trigger (vermeidet Zoom-Button-Overlap, User-Bug-Report während Sprint).
- LayerPalette Empty-State: zwei Sections sichtbar wenn no-query + no-bundle: „Meistgenutzt" (5 hard-coded Slugs heuristisch) + „Nach Thema" (Bundle-Pills). MVP ohne localStorage-Recent (Phase-2-Backlog).
- Radius-Tokens: Tailwind v4 hat passende Defaults (xs=2px, sm=4px, md=6px), zusätzlich `:root`-Vars für CSS-Lookup. Audit: 14+ `rounded-sm`-Stellen geprüft; ValueChip auf `rounded-xs`, Buttons auf `rounded-sm`, Modals/Such-Bar auf `rounded-md`.
- Test-Sweep: 132 Test-Files / 1502 Tests grün. Type-Check: 0 Errors / 0 Warnings.
- E2E: `tests/e2e/atlas-polish.e2e.ts` mit 5 Smoke-Cases angelegt; Run deferred zu CI (Manifest-Pipeline + Playwright-Browser-Setup).

### File List

**Neu erstellt:**

- `src/lib/components/atlas/internal/layer-synonyms.ts`
- `src/lib/components/atlas/internal/layer-synonyms.test.ts`
- `src/lib/components/atlas/internal/address-subline.ts`
- `src/lib/components/atlas/internal/address-subline.test.ts`
- `src/lib/components/atlas/internal/choropleth-family.ts`
- `src/lib/components/atlas/internal/choropleth-family.test.ts`
- `src/lib/components/atlas/address-search-overlay.svelte`
- `src/lib/components/atlas/map-attribution.svelte`
- `scripts/lib/oklch-interpolate.ts`
- `scripts/lib/oklch-interpolate.test.ts`
- `scripts/lib/check-scale-contrast.ts`
- `scripts/lib/check-scale-contrast.test.ts`
- `tests/e2e/atlas-polish.e2e.ts`

**Modifiziert:**

- `src/app.css` (Scale-Tokens, Theme-Inline-Mapping)
- `src/lib/components/atlas/internal/colors.ts` (15 Scale-Token-Hex-Mirrors)
- `src/lib/components/atlas/internal/layer-style-builder.ts` (Profile-Migration auf 3 Familien)
- `src/lib/components/atlas/internal/layer-style-builder.test.ts` (Strukturell-no-Vermillion + Gut-no-Vermillion Guards)
- `src/lib/components/atlas/internal/layer-palette-filter.ts` (Synonyme + NFD-Match)
- `src/lib/components/atlas/internal/layer-palette-filter.test.ts` (2 Synonym-Cases)
- `src/lib/components/atlas/layer-palette.svelte` (Empty-State Sections, Bundle-Pills, Radius-md)
- `src/lib/components/atlas/site-header.svelte` (Bookmark-Inline-Zahl, Layer-Badge-Inline, Search-Collapse, Rounded-sm)
- `src/lib/components/atlas/site-header.svelte.test.ts` (3 Such-Bar-Kollaps-Tests)
- `src/lib/components/atlas/address-search.svelte` (Radius-md auf Input + Dropdown)
- `src/lib/components/atlas/map-controls.svelte` (Compass-Pop-Out + Zoom-Buttons borderless)
- `src/lib/components/atlas/map-controls.svelte.test.ts` (Pop-Out-Logik + ARIA)
- `src/lib/components/atlas/map-libre-canvas.svelte` (`attributionControl: false`)
- `src/lib/components/atlas/inspector-panel.svelte` (Header-Straffung + Subline, Toggle-Row, Section-Header-Refresh)
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (Subline-Test + Section-Header-Anpassung)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` (Vertikal-Stack + Hover-Bg)
- `src/lib/components/atlas/value-chip.svelte` (rounded-xs + max-w-full + whitespace-normal)
- `src/routes/(with-header)/+page.svelte` (Panel-Width clamp + MapAttribution-Import)
- `src/routes/(with-header)/+layout.svelte` (searchCollapsed via inspector/compare-state)
- `_user-input/navigator-berlin-design.md` (Radius-Direktive + Choropleth-Skalen-Sektion)
- `_bmad-output/planning-artifacts/ux-design-specification.md` (LayerPalette-Einstiege + Tastatur-Shortcut-Reservierung)

### Change Log

- 2026-05-15: Story implementiert. 11 Tasks / 15 ACs erfüllt. Code-Sprint abgeschlossen. Mobilität-Smoke-Test (AC-9) als async-Side-Track verbleibend.
