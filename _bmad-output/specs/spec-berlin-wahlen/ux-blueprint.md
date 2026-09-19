# UX-Blaupause /berlin-wahlen

Übersetzung der Spiegel-Muster (Ergebnisseite Sachsen-Anhalt 2026, gesehen 08.09.) auf navigator-Verhältnisse. Ziel-Gefühl: ruhige, redaktionelle Daten-Seite im Atlas-Look; kein Dashboard, kein Widget-Grid. Referenz-Ästhetik: bestehende Tokens (`--bg #eceae0`, Indigo-Akzent, IBM Plex, Papier-Look), keine neuen Farbwelten.

## Seiten-Architektur (eine lange Scroll-Seite)

Sticky-Kapitel-Nav oben (unter dem Header, horizontal scrollbar auf Mobile, `aria-current` fürs aktive Kapitel). Kapitel in dieser Reihenfolge:

1. **Kopf**: Titel, Untertitel, Wahl-Reihen-Auswahl (BTW / AGH / BVV als Toggle-Group, Jahr-Auswahl je Reihe), Datenstand-Banner (`data-stand-banner.svelte`-Muster).
2. **Karte** (CAP-2/3): Winner-Map mit Level-Toggle, Adress-Suche, darunter Zeit-Animations-Leiste (Play, Jahr-Slider, Jahr-Chips). Karte ist das Hero-Element, volle Content-Breite.
3. **Wechsel** (CAP-4): Karte der Gebiete mit Wechsel der stärksten Kraft + kompakte Liste (Gebiet, Jahr, von → nach).
4. **Trends** (CAP-5): Partei-Auswahl als Chips, Trend-Karte (Steigung als diverging-Rampe), Volatilitäts-Karte daneben oder als Toggle.
5. **Kontraste** (CAP-6): Ausgeglichenheits-Karte, „Eine Straße, zwei Welten"-Paare als Karten-Ausschnitt-Duos, AGH-vs-BVV- und Splitting-Blöcke (nur wenn die gewählte Reihe sie hergibt, sonst Kapitel ausgeblendet).
6. **Stärkste und schwächste Gebiete** (CAP-7): Small-Multiples-Raster, eine Mini-Karte pro Partei, Extrem-Kieze beschriftet.
7. **Dein Kiez** (CAP-10): Adress-/Kiez-Eingabe, Profil-Sparkline über die Jahre, politischer Zwilling (Top-5 ähnliche Kieze, klickbar).
8. **Wahl × Atlas** (CAP-9): Kreuzung mit Layer-Auswahl, ökologischer-Fehlschluss-Notiz direkt unter der Überschrift.
9. **Methodik & Quellen** (CAP-12): Quellen/Lizenz-Akkordeon (Disclosure-Komponente), Links auf /methodik/wahldaten und /lizenzen.

## Interaktions-Prinzipien

- **Ein globaler Zustand**: gewählte Reihe + Jahr + Ebene gelten seitenweit; Kapitel reagieren gemeinsam. URL-Sync (`?reihe=agh&jahr=2021&ebene=kiez`) nach dem Muster der Finder-URL-States.
- **Live statt Submit**: Slider und Toggles färben sofort um (GPU-Expression); keine „Anwenden"-Buttons.
- **Takeaway-Zeile** (CAP-8): Jedes Kapitel beginnt mit einem redaktionellen Satz in Serif (`--font-serif`), Daten-Deltas als `+/-x,x Pp.` in `tabular-nums`.
- **Progressive Tiefe**: Karte zuerst, Liste/Tabelle als Alternative darunter (A11y + Skeptiker); nie Zahlenfriedhof über der Karte.
- **Scrollytelling light**: Kapitel faden nicht, Karten bleiben stehen; Sticky-Nav ersetzt Scroll-Magie. Reduzierte Motion respektiert `prefers-reduced-motion` (Animation dann nur per Klick durch die Jahre).

## Visuelle Sprache

- Winner-Map: Partei-Farbe aus `partei-farben.ts`, Opacity 0.4-0.9 über Anteil (Bestandsmuster `wahl-stimmbezirk-choropleth.svelte:119-125`), Patterns als Achromatopsie-Fallback zuschaltbar.
- Trend/Volatilität: Diverging- bzw. Strukturell-Indigo-Rampe aus den 5-Stufen-Tokens; niemals Partei-Farbe für Nicht-Partei-Metriken.
- Small Multiples: gleiche Projektion/Ausschnitt je Mini-Karte, max. 7 Parteien (`FINDER_PARTIES`), 2-spaltig Mobile, 3-4 Desktop.
- Charts als eigene SVG-Primitives (Sparkline-, score-bar-Muster); layerchart nur, wenn ein Bestandschart wiederverwendet wird, dann lazy.
- Zahlen: de-DE, Komma, `tabular-nums`, Prozentpunkte als „Pp.".

## A11y-Pflichten

- Jede Karte: `role="img"` + sprechendes `aria-label` + `data-table-alternative` mit denselben Werten.
- Kapitel-Nav: `<nav aria-label="Kapitel">`, Links mit `aria-current="true"`.
- Toggles nach Bestandsmuster (`role="radiogroup"`, `tablist` aus `wahl-section.svelte`).
- Zeit-Animation: Play/Pause als echter Button mit `aria-pressed`, Slider als `<input type="range">` mit Jahr-Ansage (`aria-valuetext`).
- Fokus-Reihenfolge folgt der Kapitel-Reihenfolge; Axe-E2E (`a11y.e2e.ts`-Muster) für die Portal-Route.

## Mobile

Bottom-lastige Bedienung: Reihe/Jahr/Ebene als sticky Leiste am unteren Rand (Bottom-Sheet-Muster), Karte 60vh, Kapitel-Nav horizontal scrollbar. Small Multiples 2-spaltig. Keine Desktop-only-Funktionen.
