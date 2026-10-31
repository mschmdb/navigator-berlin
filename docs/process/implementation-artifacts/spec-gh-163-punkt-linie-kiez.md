---
title: 'gh-163: Punkt, Linie, Kiez als Komponente'
type: 'feature'
created: '2026-10-31'
status: 'done'
baseline_commit: '8fdbd8d472819debedb8071574a28f060beb1bef'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/CLAUDE.md', '{project-root}/docs/DESIGN.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die erste Serie der Data Stories existiert nur als lokale Skizze (`design-proposals/kunst-2026-10/`, nicht im Repo). Auf navigator.berlin gibt es sie noch nicht.

**Approach:**
- „Punkt, Linie, Kiez“ wird eine Svelte-Komponente für Kiez und Bezirk.
- Die Geometrie kommt aus einer reinen, getesteten Funktion, portiert aus `grammatik-shapes.mjs` (`geometry()`).
- Die Werte kommen aus `static/data/stories-kennzahlen.json` (#161).
- Ein Beitrag zeigt alle 12 Bezirke: einen groß mit Legende, die anderen 11 klein als Auswahl.
- Der Data-Stories-Platz auf der Startseite (#171) zeigt einen Teaser mit 4 Bezirks-Kompositionen aus derselben Komponente.

Freigabe: Matze 31.10. („ja mach weiter“) nach der Liste offener Punkte. Zwei Punkte entscheide ich hier vorläufig, Matze prüft sie danach:
- Die Serie schreibt durchgehend klein, wie in der Skizze.
- Das gelbe Dreieck bekommt eine Tinten-Haarlinie als Kontur. Gelb auf Papier hat nur 1,41:1, WCAG 1.4.11 verlangt 3:1.


Nachträge Matze 31.10. nach Sichtung (ersetzen widersprechende Punkte unten):
- Die Linien liegen immer im Hintergrund, unter allen Formen.
- Die Miniaturen zeigen die Linien auch. Die Regel „kleine Zeichen ohne Linien“ entfällt für diese Serie.
- Die Übersicht `/stories` zeigt bei jedem Beitrag ein Vorschaubild.
- Unter der großen Komposition gibt es einen PDF-Download (Vektor, DE und EN, je Bezirk). Damit zieht ein Teil von #168 vor.
- Miniaturen sind die große Komposition, nur verkleinert (gleiche Geometrie, gleiche Farben, kein Mischmodus).
- Der Startseiten-Teaser zeigt die neuesten Beiträge (bis zu drei) als Liste mit Vorschaubild, nicht die interaktive Komponente. Die Vorschau ist statisch, ohne Hover-Effekt.
- Beitragstext: Einleitung über der Komponente, Rest darunter (Marker `<!-- visual -->`).
- Das OG-Bild der Route `/stories` und der Beiträge trägt eine Komposition, damit Teilen auffällt. Damit zieht ein Teil von #165 vor.

## Boundaries & Constraints

**Always:**
- Formen und Bedeutung wie im Issue: Kreis = Grünversorgung, Quadrat = Altbau, Dreieck = Lärm, Balken = Bewohner, Linien = Haltestelle in 400 m, Donut = Clubs.
- Farben aus `src/lib/stories/tokens.ts`, Schrift `STORY_FONT`, Papier und Rahmen nach `docs/DESIGN.md`.
- Die Skizzen-Regeln bleiben erhalten:
  - Die Platzierung ist deterministisch (Seed = Slug).
  - Verspielt, keine erzwungene Ordnung.
  - Der Donut wächst mit der Wurzel der Clubzahl und fehlt ohne Clubs.
  - Der Balken liegt oben und wird nie angeschnitten.
  - Kleine Zeichen unter 120 px fallen ohne Linien und Punkte aus.
  - Auf Bezirksebene gelten absolute Skalen.
- Die Werte haben keinen Ersatzwert. Bei `null` fehlt die Form, und die Legende sagt „keine Daten“.
- Barrierefreiheit:
  - Die Komponente ist eine `figure`, die Textalternative nennt die eine Aussage mit Werten.
  - Jede Form ist per Tastatur fokussierbar und zeigt ihren Wert per Tooltip oder Hervorhebung. Hover macht dasselbe.
  - Legende und Form heben sich gegenseitig hervor.
  - Die Auswahl der 11 kleinen Bezirke sind echte Buttons mit `aria-pressed`, Klickziele mindestens 24 px.
  - Keine Bewegung bei `prefers-reduced-motion`.
- DE und EN: Legende, Titel und Alternativtexte über Paraglide. Die Legende schreibt klein („kreis: grünversorgung“ / „circle: green space“).
- Die Fußzeile nennt die Quellen aus `stories-kennzahlen.json`, inklusive OSM-Hinweis.
- Neuer Beitrag in `_content/stories/` (DE und EN, 120–200 Wörter) mit Frontmatter-Feld `visual: punkt-linie-kiez-bezirke`. Die Beitragsseite rendert dafür die Komponente vor dem Text.
- Startseiten-Teaser im vorhandenen Platz in `home-tasks.svelte` (nach der Gegend-Kachel, vor Hitze und Wahlen):
  - Überschrift „Berlin Data Stories“, ein Satz, Link zur Übersicht.
  - 4 kleine Bezirks-Kompositionen, jede verlinkt auf den Beitrag.
  - Keine Kachel, eigene Form wie im Mockup R.
- Text nach Skill `no-ai-slop`. Kein „Kunst“-Etikett.

**Never:**
- Kein Kiez-/Bezirksseiten-Block (#164).
- Keine OG-Bilder (#165).
- Kein Download (#168).
- Keine Live-Berechnung: Die Werte kommen nur aus der JSON-Datei.
- Keine Papiertextur.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bezirk normal | Friedrichshain-Kreuzberg | alle 6 Formen, Legende mit Werten | N/A |
| Ohne Clubs | `clubs: 0` | kein Donut, Legende „0“ | N/A |
| Wert fehlt | `laermDb: null` | kein Dreieck, Legende „keine Daten“ | N/A |
| Klein | Größe < 120 px | ohne Linien und Punkte, Formen größer im Feld | N/A |
| Tastatur | Tab auf Form | sichtbarer Fokus, Wert lesbar | N/A |
| Auswahl | Klick auf kleinen Bezirk | großer Bezirk wechselt, `aria-pressed` | N/A |
| Gleicher Slug | zweimal gerendert | identische Geometrie | N/A |

</frozen-after-approval>

## Code Map

- Skizzen, lokal und nicht im Repo, nur lesen:
  - `design-proposals/kunst-2026-10/grammatik-shapes.mjs` (`geometry()`, `shapes()`, `rng` in `lib.mjs`).
  - `point-line-bezirk.mjs` und `point-line-kiez-v2.mjs` für Legende, Skalen, Texte DE/EN und Quellenzeile.
  - `stories-mockup.html` für die interaktive Story-Seite.
  - Fertige Bilder als Sichtvergleich: `point-line-bezirk-friedrichshain-kreuzberg-de.png`.
- Neu `src/lib/stories/punkt-linie-kiez/geometry.ts` + Test: reine Funktion `(kennzahlen, { small }) => Geometrie`.
- Neu `src/lib/stories/punkt-linie-kiez/scales.ts` + Test: Umrechnung von `stories-kennzahlen.json` in die Eingaben der Geometrie.
  - Felder: `gruen`, `altbauAnteil`, `laermDb`, `bewohnerProKm2`, `haltestelle400mAnteil`, `clubs`.
- Neu `src/lib/components/stories/punkt-linie-kiez.svelte` + Test (SVG, Legende, Fokus/Hover).
- Neu `src/lib/components/stories/punkt-linie-kiez-auswahl.svelte` + Test (groß + 11 klein).
- Daten-Loader: `static/data/stories-kennzahlen.json`. Import im Server-Load (`+page.server.ts`, prerender) oder als JSON-Import in `src/lib/stories/`. Kein Client-Fetch.
- `src/lib/content/stories/` (#162): Frontmatter-Schema um optionales `visual` (Union-Literal) erweitern, Test.
- `src/routes/(with-header)/stories/[slug]/+page.svelte`: Bei `visual` die Auswahl-Komponente vor dem Body.
- `src/lib/components/home/home-tasks.svelte`: Kommentar-Platz durch `home-stories-teaser.svelte` ersetzen.
  - Den Wächter `internal/line-list.test.ts` beachten: keine Kachel.
  - Welche 4 Bezirke? Die ersten 4 alphabetisch, damit die Auswahl stabil bleibt und keine Wertung enthält.
- `messages/de.json`, `messages/en.json`.

## Tasks & Acceptance

**Execution:**
- [x] `scales.ts` + Test, `geometry.ts` + Test (Matrix: ohne Clubs, `null`, klein, Determinismus, Balken nie angeschnitten).
- [x] Komponente + Test (Legende, Fokus, Hover, `figure`/Alternativtext, reduced motion).
- [x] Auswahl-Komponente + Test (`aria-pressed`, Wechsel).
- [x] Schema `visual` + Beitragsseite + neuer Beitrag DE/EN.
- [x] Startseiten-Teaser + Test.
- [x] Messages DE/EN.

**Acceptance Criteria:**
- Given der Beitrag und die Startseite, when axe-core läuft, then keine Verstöße.
- Given die Design-Prüfung (DE/EN, 1440 und 390), then keine Befunde zu Regeln 7, 14, 23, 29, 30, und kein horizontaler Scroll.
- Given Friedrichshain-Kreuzberg groß, when man es neben `point-line-bezirk-friedrichshain-kreuzberg-de.png` legt, then stimmen Formensprache und Farben überein. Exakte Positionen dürfen abweichen.

## Implementation Notes

- Geometrie ohne Klein-Modus: Miniatur = verkleinertes Original, nur Strichstärke angepasst. Linien zuerst gezeichnet, kein Mischmodus. Formen werden ins Feld geklemmt (Test über alle 155 Einheiten).
- Auswahl: 12 Buttons statt 11 (der gewählte trägt `aria-pressed`, Fokus bleibt beim Wechsel). Bezirk per `?bezirk=` teilbar, `replaceState`.
- PDF: `pdfkit` 0.17.2 + `svg-to-pdfkit` 0.1.8, Jost eingebettet, 400 × 500 mm, 24 prerenderte Dateien. Klick sendet `Stories PDF Download` (serie, bezirk, sprache). Plausible-Goal muss Matze anlegen.
- OG: `static/og/page/stories.png` mit Komposition, für Übersicht und Beiträge mit Visual.
- Texte beider Beiträge von mir neu geschrieben (Matze 31.10.: lockerer, Kandinsky, Leseanleitung).

## Spec Change Log

## Review Triage Log

Erste Runde (3 Reviewer): 20 Befunde. Patch: Fokusring Auswahl, `figure` in `button`, `aria-pressed`-Fallback, Teaser-Links mit `?bezirk`, Startseite fängt Teaser-Fehler ab und cacht die JSON, Formen im Feld, `null`-Zusage eingegrenzt, vorhandene Werte immer sichtbar, Schema-Bereiche, Hover/Fokus getrennt, Balken-Fokus, Legende ohne Form, doppelte Screenreader-Ausgabe und Doppelpunkt, Linien-Token, Quellen mit Stand und Lizenzlinks, Kommentar zur öffentlichen JSON, Skalen und Einheiten im Text. Abgelehnt: keine. Danach Matzes Nachträge, siehe Intent.

## Verification

Ergebnis 31.10.: 906 + 56 Tests grün, `pnpm check` 0 Fehler. Design-Prüfung Startseite, `/stories`, Beitrag DE/EN bei 1440 und 390: axe 0 Verstöße, keine AI-Look-Indizien. Zeilenlängen-Treffer nur bei versteckter SVG-Beschreibung und Listenbreite der Updates (Text selbst auf `--measure`). PDF gerendert und angesehen. Voller `pnpm build` mit Prerender der PDFs nicht gelaufen.

**Commands:**
- `pnpm vitest run src/lib/stories src/lib/components/stories src/lib/content/stories src/lib/components/home "src/routes/(with-header)/stories"` -- expected: grün
- `pnpm check` -- expected: 0 Fehler

**Manual checks (if no CLI):**
- Dev-Server Port 5199: Beitrag DE/EN, Startseite; Skill `design-pruefung`.
