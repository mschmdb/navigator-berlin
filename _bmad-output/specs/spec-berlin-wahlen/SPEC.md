---
id: SPEC-berlin-wahlen
companions:
  - ux-blueprint.md
  - technical-notes.md
  - ../../../docs/wahldaten-methodik.md
sources:
  - ~/claude-hub/topics/navigator-berlin/politik-portal.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Berlin-Wahlen: Wahldaten-Analyse-Portal unter /berlin-wahlen

## Why

Vision plus Gelegenheit: navigator.berlin hält 12 Berliner Wahlen bis auf Stimmbezirks-Ebene, zeigt sie aber nur als Einzelwahl-Ansichten. Ein Analyse-Portal macht daraus Zeitreihen, Wechsel-Muster und Kontraste, die sonst niemand auf Kiez-Ebene anbietet. Der Termin-Hook: Die AGH/BVV-Wahl ist am 20.09.2026, die endgültigen Ergebnisse kommen ab ~30.09. (BVV) und ~05.-08.10. (AGH). Das Portal muss vorher stehen und die 2026er-Zahlen ohne Umbau aufnehmen. UX-Vorbild ist die Spiegel-Ergebnisseite Sachsen-Anhalt 2026 (Muster, keine Kopie); unser Eigenes bleibt Kiez-Tiefe, Zeit-Animation, Wahl×Layer und die Agent-Schnittstelle.

## Capabilities

- **CAP-1**
  - **intent:** Besucher erreichen unter `/berlin-wahlen` eine lange Scroll-Seite mit Sticky-Kapitel-Nav und Wahl-Reihen-Auswahl über alle vorhandenen Wahlen.
  - **success:** Route prerendered, Kapitel-Nav springt zu jedem Modul, SEO-Pflichtmuster komplett (JSON-LD, OG-Image, Sitemap-Eintrag, llms.txt; `llms-sitemap-consistency`-Test grün).
- **CAP-2**
  - **intent:** Besucher sehen je Wahl die stärkste Partei pro Gebiet als Winner-Map mit Farbtiefe = Stimmenanteil, umschaltbar zwischen Stimmbezirk, Kiez und Bezirk, mit Adress-Suche direkt in der Karte.
  - **success:** Level-Toggle wechselt die Ebene ohne Reload, Adress-Eingabe zentriert und markiert das Gebiet, Tabellen-Alternative liefert dieselben Daten screenreader-tauglich.
- **CAP-3**
  - **intent:** Besucher animieren die Karte über die Jahre einer Wahl-Art-Reihe (Play-Button und Jahr-Slider) und teilen ein Jahr als Deep-Link.
  - **success:** Umfärbung läuft flüssig per GPU-Expression (kein Daten-Reload pro Jahr), URL trägt Reihe + Jahr, Reload stellt exakt diese Ansicht her.
- **CAP-4**
  - **intent:** Besucher sehen, wo die stärkste Kraft wechselte, wann und wie oft (Einmal-Wechsler vs. Dauerwechsler), als Karte und Liste.
  - **success:** Für jedes Gebiet mit Wechsel sind Jahr(e) und Von/Nach-Parteien abrufbar; Formulierungen bestehen `lint:wahl`.
- **CAP-5**
  - **intent:** Besucher sehen pro Partei und Gebiet den Anteils-Trend über die Reihe sowie einen Volatilitäts-Index (stabiles vs. wechselhaftes Berlin).
  - **success:** Trend- und Volatilitäts-Werte sind unit-getestet gegen Fixture-Reihen und stimmen mit der JS/SQL-Referenzrechnung überein.
- **CAP-6**
  - **intent:** Besucher erkunden Kontraste: Ausgeglichenheit (Abstand Platz 1 zu Platz 2), schärfste Nachbar-Grenzen, AGH vs. BVV am selben Tag, Erst- vs. Zweitstimmen-Splitting.
  - **success:** Jedes Kontrast-Modul zeigt Karte oder Ranking mit konkreten Gebietspaaren/-werten; Nachbar-Grenzen nennen beide Gebiete und die Differenz.
- **CAP-7**
  - **intent:** Besucher sehen pro Partei eine Mini-Karte (Small Multiples) mit dem stärksten und schwächsten Kiez benannt.
  - **success:** Für jede Partei aus `partei-farben.ts` rendert eine Mini-Karte mit beiden Extrem-Kiezen samt Anteil; Begriff „Hochburg" kommt nicht vor.
- **CAP-8**
  - **intent:** Jedes Modul trägt einen Ein-Satz-Takeaway in Klartext, jede Zahl ihr Delta zur Vorwahl, jeder Datenstand ist ausgewiesen.
  - **success:** Kein Modul ohne Takeaway-Zeile; Deltas erscheinen als +/- Prozentpunkte; `lint:wahl` und `banned-words` laufen über alle Portal-Texte.
- **CAP-9**
  - **intent:** Besucher kreuzen ein Wahlergebnis mit Atlas-Layern (z. B. Lärm, Grün) auf Kiez-Ebene.
  - **success:** Kreuzungs-Ansicht kombiniert Wahl-Choropleth mit Layer-Symbolen nach dem Karten-Regelwerk; die Methodik-Notiz zum ökologischen Fehlschluss ist unübersehbar verlinkt.
- **CAP-10**
  - **intent:** Besucher finden Kieze, die ähnlich wählen wie ihr eigener (politischer Zwilling über den Partei-Anteils-Vektor).
  - **success:** Eingabe Kiez liefert Top-N ähnlichste Kieze mit Ähnlichkeitswert; Metrik ist unit-getestet und in der Methodik dokumentiert.
- **CAP-11**
  - **intent:** Agenten nutzen die Portal-Analytik über WebMCP: `get_political_profile`, `get_political_trend`, `find_similar_kieze`.
  - **success:** Alle drei Tools registrieren mit JSON-Schema im Manifest, liefern `license` + Quelle mit und verlinken das Portal als Deep-Link; Tool-Surface englisch.
- **CAP-12**
  - **intent:** Methodik und Lizenz-Provenienz sind wie überall im Projekt vollständig dokumentiert.
  - **success:** `docs/wahldaten-methodik.md` um Portal-Analytik ergänzt, `/methodik` verlinkt sie, Portal-Seite endet mit Quellen/Lizenz-Akkordeon, jede neue API-Response führt `license` + `sourceUrl`.
- **CAP-13**
  - **intent:** Besucher finden das Portal über Home-Feature-Block, Footer, Inspector-Wahl-Sektion und die Redirects der alten `/wahl`-Routen.
  - **success:** Alle Einstiege verlinken auf `/berlin-wahlen` (Inspector mit wahl- und gebietsabhängigem Deep-Link); `/wahl` antwortet 301 auf `/berlin-wahlen`, `/wahl/[slug]` 301 auf `/berlin-wahlen/[slug]`.
- **CAP-14**
  - **intent:** AGH/BVV 2026 erscheint im Portal allein durch Pipeline-Deklaration, ohne Änderung am Portal-Code.
  - **success:** Nach Eintrag von `agh26`/`bvv26` in `sources.ts` + Geo-Quelle + Gate-Schwellen + Partei-Seed rendert das Portal die neuen Wahlen in allen Modulen; Nachweis per lokalem Ingest-Testlauf.
- **CAP-15**
  - **intent:** Besucher sehen Wahlbeteiligung je Gebiet und deren Zeitreihe.
  - **success:** `wahlberechtigte`/`waehlende`/`ungueltige` sind persistiert und aggregiert, das Modul zeigt Beteiligung mit Vorwahl-Delta. (Droppable: v1 darf ohne CAP-15 live gehen.)
- **CAP-16**
  - **intent:** Jede Einzelwahl behält eine eigene indexierbare Detailseite unter `/berlin-wahlen/[slug]`, neu gebaut aus den Portal-Bausteinen.
  - **success:** Alle Bestands-Slugs rendern unter `/berlin-wahlen/[slug]` (prerendered, Slugs unverändert), sämtliche internen Links (Inspector-Wahl-Sektion wahlabhängig, Home-Teaser, Kiez-Seiten, Methodik, llms, OG, Sitemap) zeigen direkt auf die neuen URLs, und `grep '/wahl'` findet keine internen Alt-Links mehr.

## Constraints

- Kein Liveticker, keine Hochrechnungen. Ausnahme (Matze 23.09., 1B): das amtliche vorläufige Ergebnis einer frisch stattgefundenen Wahl (z. B. AGH/BVV 2026) darf mit dem nächsten Deploy live gehen, wenn Portal, `/wahl/[slug]` und Tool-/API-Responses die Kennzeichnung „vorläufig" plus Stand-Datum tragen. Beim Endergebnis ist ein Re-Ingest Pflicht, der die Kennzeichnung entfernt.
- Neutralität hart: `lint:wahl`-Forbidden-Tokens (u. a. „Hochburg", Farb-Adjektive, „Wahlsieger") gelten für alle Portal-Texte; neue Dateien in `TARGET_PATHS` eintragen; `banned-words.ts` als zweites Gate.
- Keine eigene Sitzberechnung: Sitze/Koalitionen erst, wenn offizielle Sitzzahlen vorliegen.
- Zeit-Animation nur innerhalb einer Wahl-Art-Reihe (AGH, BVV, BTW getrennt).
- Datenlücken ehrlich ausweisen: Kiez/Stimmbezirk erst ab 2016/2017; 2011/2013 nur Bezirk/Berlin; Wiederholungswahl-2023- und Briefwahl-Caveats (<2021) übernehmen.
- Partei-Farben ausschließlich aus `src/lib/data/partei-farben.ts` (Kontrast + Achromatopsie-Patterns); DB-Hex ist Seed, wird nie gerendert.
- Karten nach Bestandsmuster: MapLibre, Farb-Tokens aus `app.css`/`internal/colors.ts`, GPU-Expressions nach Finder-Engine-Muster; Karten-Regelwerk (max. 2 Wertkarten) bei Kreuzungen.
- `layerchart` (~227 KB gzip) nur lazy oder gar nicht; Portal-Charts bevorzugt eigene SVG-Primitives.
- TDD-Mandat ADR-012; Dateien unter 500 Zeilen; A11y-Muster des Bestands (Tabellen-Alternative, ARIA-Rollen, `tabular-nums`, de-DE-Formate).
- Phase 1 DE-only; WebMCP-Tool-Surface englisch.
- WebMCP-Jury-Freeze bis 22.09. 02:00 CEST: lokal bauen ok, kein Push, kein Deploy, keine Prod-Daten-Läufe.

## Non-goals

- Liveticker, Hochrechnungen. Vorläufige Ergebnisse sind kein genereller Non-Goal mehr, siehe Constraints-Ausnahme (Matze 23.09., 1B) -- nur klar gekennzeichnet, nie unmarkiert.
- Sitzverteilungs-Halbkreis und Koalitionsrechner in v1 (erst mit offiziellen 2026er-Sitzzahlen).
- Europawahl und BTW-2024-Teilwiederholung (Phase-2-Backlog der Wahl-Pipeline).
- Abgeordneten-Fotos oder Personen-Datenbank.
- EN-Version (kommt mit dem i18n-Plan, nicht hier).
- Subdomain in v1; später optional `wahlen.navigator.berlin` als Redirect-Alias (nicht `politik.`).

## Success signal

Wenn die endgültigen BVV-2026-Ergebnisse (~30.09.) vorliegen, erscheint die neue Wahl im Portal durch einen Pipeline-Lauf ohne Portal-Code-Änderung. Ein Besucher beantwortet „Wie hat mein Kiez seit 2011 gewählt, und wo wechselte die stärkste Kraft?" in unter einer Minute über Karte und Takeaways, ohne eine Tabelle zu lesen.

## Assumptions

- Das Portal startet flag-gated (`wahlPortal` analog `wahlSection`); Default-on entscheidet Matze nach UX-Review.
- Takeaway-Sätze werden generiert und von Matze redigiert, bevor der Flag auf Default-on geht.

## Open Questions

- Soll CAP-15 (Wahlbeteiligung, braucht Migration + Re-Ingest aller 20 Wahlen) noch vor dem 2026-Ingest laufen oder danach?
