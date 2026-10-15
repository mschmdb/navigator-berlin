# Landing-Audit Kiez-, Bezirks- und Layer-Seiten

Stand: 14.10.2026 (Code-Inventur per Subagent, Branch feat/zensus-wohndaten). Anlass: Bounce-Befund Plausible 08.10.2026 (Kiez-Seiten springen fast immer sofort ab, Layer gemischt). Grundlage für das Brainstorming zum Prio-Thema „Seiten attraktiver machen“.

## Kernbefund

Keine der drei Seitenarten zeigt im ersten mobilen Bildschirm eine Karte, ein Bild oder ein interaktives Element. Alle starten mit Eyebrow, h1 und grauem Text-Lead. Kiez- und Bezirksseiten verlinken nie auf die Karte mit diesem Ort; einziger Kartenweg ist der generische Header-Button „Atlas öffnen“. Der Verzicht auf eine Karte war eine Entscheidung vom 16.05.2026 (Kommentar in `kiez-hero.svelte`: „Kein Karten-Embed … User-Decision 2026-05-16“), steht im Brainstorming also zur Neubewertung.

## Kiez (143 Seiten, prerendered)

Reihenfolge mobil: Breadcrumb → Hero (Eyebrow „Bezirk X“, h1, Lead „Kiez X, Bezirk Y, N Einwohner:innen, N ha. Daten zu … auf dieser Seite.“) → Profil-Prosa (2 Absätze, Median 94 Wörter) → Kiez-Score (Zahl /100 + 4 Dimensionen) → Vergleich (Kiez/Bezirk/Berlin, Rang) → Steckbrief-Tabelle (3 Spalten, Details eingeklappt) → Wahl-Verlauf (nur mit Feature-Flag) → FAQ → 3 Geschwister-Kieze → Rang-Link, Methodik.

- Links: Breadcrumb, Methodik, 3 Geschwister (ganz unten), Rang-Link (ganz unten). Kein Link zur Karte mit dem Kiez, zu Layer-Seiten, Vergleich oder Finder.
- Ungenutzt oder versteckt: `profile.centroid` (nur JSON-LD), Rang je Dimension erst weiter unten, `compositeRank` nur im letzten Link, Geschwister ohne Scores, Haltestellen/Grün/Spielplätze in `<details>`, OG-Bild ungenutzt.
- Schwächen: Lead wiederholt Eyebrow und h1 und endet in einem Meta-Satz statt einem Fakt. Prosa liest sich wie generierter Rang-Text. Score erst ~1,5 Bildschirme tief. Steckbrief auf Mobil eng. Kein inhaltlicher nächster Schritt. Meta-Description ist eine Keyword-Liste ohne Score oder Rang.
- Ladezeit vermutlich unkritisch (prerendered, kein Karten-JS): Sofort-Bounce deutet eher auf Inhalt/Intent oder Bots.
- Typische Seiten: `friedenau-ost`, `alt-lichtenberg`, `hellersdorf-nord`, `schillerpromenade`.

## Bezirk (12 Seiten)

Reihenfolge: Breadcrumb → h1 + Lead → Prosa (76-93 Wörter) → Vergleich → Steckbrief → FAQ → Top-5-Kieze mit Score → Rang-Link, Methodik. Kein großer Score-Block.

- Links: Top-5-Kieze (erst nach der FAQ), Rang-Link, Methodik. Kein Karten-, Layer- oder Vergleichs-Link.
- Ungenutzt: alle Kieze berechnet, nur 5 gezeigt; `centroid`, `compositeRank`, `sameAs` (Wikipedia/Wikidata) nur in JSON-LD.
- Keine Karte: Besucher sehen nie, wo der Bezirk und seine Kieze liegen.

## Layer (eine Seite je Layer)

Reihenfolge: Eyebrow (Bundle) → h1 → `explain.long` → (nur kuehle-orte: CTA /hitze) → Hinweise → Quelle → Werte → Berechnung → Lücken/Auslassungen → Verwandte Layer → Methodik → „Layer auf Karte anschauen →“ (kleiner Textlink, weit unten) → FAQ.

- Liest sich wie Dokumentation: Quelle, Lizenz, Methodik vor dem eigentlichen Nutzen (der Karte).
- Ungenutzt: `explain.short` nur in der Meta-Description, Datei-URL nur in JSON-LD (kein Download), keine Kiez-/Bezirkswerte oder Rankings, keine Links zu Kiezen, OG-Bild ungenutzt.
- Wer „Lärmkarte Berlin“ sucht, bekommt Metadaten statt Karte.

## Muster über alle drei

- Erster Bildschirm: h1 + Text, nichts zum Anschauen oder Antippen außer „Atlas öffnen“.
- Kein kontextueller Karten-CTA (Kiez/Bezirk gar nicht, Layer versteckt).
- `/explore` kennt keinen Parameter für Kiez- oder Bezirksfokus (`layers`, `lat`/`lng`, `finder` vorhanden); Deep-Link bräuchte neuen Parameter oder `centroid`.
- Kein Einstieg „Kiez vergleichen“ oder „ähnliche Kieze“, obwohl `/api/wahl/similar-kieze` existiert.
- Titel einheitlich „X - Berlin in Daten - navigator.berlin“; Descriptions generisch ohne konkreten Fakt.

## Schlüsseldateien

- `src/lib/components/atlas/kiez-hero.svelte`, `bezirk-hero.svelte`
- `src/routes/(with-header)/kiez/[slug]`, `bezirk/[slug]`, `layer/[slug]`
- `src/lib/components/atlas/site-header.svelte`
- `src/lib/content/kiez-profile/`
- `messages/de.json` (Titel, Descriptions)

## Plausible-Befund (Einstiege, 16.09.-14.10.2026, Site navigator.berlin)

Abgefragt am 14.10.2026 aus der selbst gehosteten Plausible-Instanz. Konkrete Zahlen stehen nicht im öffentlichen Repo. Die Lesart:

- Startseite, Explore und Layer-Seiten halten Besuchende am besten. Layer-Einstiege von Google springen selten ab und lesen im Schnitt mehrere Seiten pro Besuch.
- Wahlen und Updates verlieren mehr als die Hälfte der Besuche nach dem ersten Aufruf.
- Kiez- und Bezirksseiten bouncen am stärksten, bei sehr kurzer Verweildauer.
- Kiez-Einstiege kommen fast ausschließlich aus Suchmaschinen (Google, Bing). Das sind echte Suchende, keine Bots.
- Einzelne Kiez-Seiten springen komplett sofort ab (Beispiele: reuterstrasse, rummelsburger-bucht, charlottenburg-nord).

Lesart: Layer-Seiten funktionieren für Such-Traffic besser als gedacht. Das Problem sitzt bei Kiez- und Bezirksseiten: Suchende landen und gehen nach Sekunden. Fallzahlen sind klein, die Tendenz ist eindeutig.
