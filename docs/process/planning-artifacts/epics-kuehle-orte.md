---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - product-brief-kuehle-orte-berlin.md
  - brainstorming/brainstorming-session-2026-06-30-1327.md
  - architecture.md (Projekt-Kontext)
---

# navigator.berlin · Kühle Orte – Epic Breakdown

## Overview

Decomposition des Features „Kühle Orte Berlin" in Epics und Stories. Requirements-Quelle: Product Brief (kein dediziertes PRD), technischer Kontext aus bestehender Layer-Pipeline und `architecture.md`.

## Requirements Inventory

### Functional Requirements

FR1: Ein neuer Karten-Layer `kuehle-orte` zeigt geeignete kühle Orte Berlins im navigator.berlin-Atlas.
FR2: Jeder Ort zeigt im Tooltip/Inspector Name und Typ (Kino, Bibliothek, Mall, Schwimmhalle …).
FR3: Jeder Ort zeigt die verifizierte, kopierbare Adresse.
FR4: Jeder Ort bietet Ein-Tap-Navigation per Deep-Link zu Google Maps und Apple Maps.
FR5: Jeder Ort zeigt Öffnungszeiten plus Live-Status (jetzt offen / schließt bald / zu) aus `opening_hours`.
FR6: Ein Filter „jetzt offen" blendet geschlossene Orte aus.
FR7: Jeder Ort zeigt einen transparenten Kühle-Score (1–5) mit Begründung.
FR8: Orte mit `summer_available=no` werden als „im Sommer geschlossen" gekennzeichnet und abgewertet.
FR9: Jeder Ort zeigt ein Zugangs-Flag (kostenlos / Konsum / Ticket).
FR10: Jeder Ort zeigt AC-Status, wenn belegt.
FR11: Jeder Ort zeigt Barrierefreiheit, wenn bekannt.
FR12: Ungeeignete (`suitable=false`) und nicht mehr existierende (`still_exists=no`) Orte erscheinen nicht im Layer.
FR13: Jeder Ort bietet einen „stimmt nicht / gibt's nicht mehr"-Melde-Link (Wiederverwendung `feedbackMailto`).
FR14: Eine eigenständige Landing Page präsentiert das Angebot nutzerorientiert (NYC-Geist) mit eingebetteter Karte.
FR15: Die Landing Page zeigt ein Live-DWD-Hitzewarn-Banner.
FR16: Die Landing Page bietet „in deiner Nähe" per Geolocation (nächste offene Orte).
FR17: Die Landing Page bietet einen Mail-Opt-out für Institutionen.
FR18: Der bestehende `trinkbrunnen`-Layer wird als Wasser-Quelle referenziert, nicht dupliziert.
FR19: Saison-Logik blendet saisonale Orte korrekt ein/aus (Trinkbrunnen Mai–Okt etc.).
FR20: Die Landing Page führt per CTA direkt in den Atlas/Explorer mit vorab aktiviertem `kuehle-orte`-Layer (URL-State-Deep-Link).

### NonFunctional Requirements

NFR1: Barrierefreiheit nach WCAG (Tastaturbedienung, Screenreader, Kontrast, Fokus).
NFR2: Mobile-first, performant auf dem Smartphone bei Außennutzung in der Hitze.
NFR3: Typsicher (kein `any`), Dateien unter 500 Zeilen.
NFR4: Pragmatic TDD für Build-Transforms, neuen Fetch-Pfad und Logik-Komponenten (ADR-012).
NFR5: ISO-27001/9001-Muster, keine Hardcoded-Daten ohne Beleg.
NFR6: Datenqualität: kein Datenmüll, jede AC=yes- und still_exists=no-Aussage belegt.
NFR7: Datenfrische: reproduzierbarer Refresh-Pfad, Snapshot datiert.
NFR8: Haltung: Angebot, kein „besser als die Stadt"-Anspruch, Quellen transparent genannt.
NFR9: DE-only. Paraglide ist vorhanden, dieses Feature nutzt aber KEINE i18n-Keys, Inhalte sind deutsch direkt.

### Additional Requirements

- Layer-Integration über bestehende Pipeline: neuer `kind: 'local'` in `scripts/lib/sources.ts` + `fetchSource()` in `scripts/fetch-static.ts`, dann gehashtes GeoJSON + MANIFEST-Eintrag (bundleGroup, zoomThresholds, geometryType).
- Build-Script `scripts/build-kuehle-orte.ts`: merged `static/data/kuehle-orte/enrichment.json` + `places-osm.json` + relevante Bestands-Layer per `osmId`, filtert `suitable=false`/`still_exists=no`, hängt Navi-Links und alle Tooltip-Felder an.
- Registrierung in `editorial-config.ts` (`feedbackMailto: true`, `disclaimerVariants`), `pin-icon-mapping.ts`, `layer-synonyms.ts`.
- Wiederverwendung des Inspector-Panel-/Layer-Hit-Rendering statt neuer Tooltip-Infrastruktur.
- Hitze-Kontext-Layer (`bioklima-2023`, `klima-pet-2022`, `kiez-score-gruen-hitze`) optional als Hintergrund.

### UX Design Requirements

UX-DR1: Tooltip/Inspector-Layout für einen kühlen Ort: Titelzeile (Name + Typ-Icon), Status-Ampel, Adresse, Aktions-Buttons.
UX-DR2: Navi-Buttons „Google Maps" und „Apple Maps" als barrierefreie, touch-große Links.
UX-DR3: Status-Ampel-Komponente (grün/gelb/rot) mit Text-Alternative, nicht nur Farbe.
UX-DR4: Badge-Set: Kühle-Score, „im Sommer geschlossen", kostenlos/Ticket, klimatisiert, barrierefrei.
UX-DR5: „Jetzt offen"-Filter als bedienbares Steuerelement im Layer-Panel.
UX-DR6: Landing-Page-Aufbau: DWD-Banner, Intro (Angebot-Haltung), Karte, „in deiner Nähe", Transparenz/Quellen, Opt-out-Mail.
UX-DR7: Geolocation mit Fallback und klarer Consent-Kommunikation.

### FR Coverage Map

FR1: Epic 15 - Layer `kuehle-orte` im Atlas sichtbar
FR2: Epic 15 - Name/Typ im Inspector
FR3: Epic 15 - verifizierte Adresse
FR4: Epic 15 - Navi-Deep-Links Google/Apple
FR5: Epic 15 - Öffnungszeiten + Live-Status
FR6: Epic 15 - „jetzt offen"-Filter
FR7: Epic 15 - Kühle-Score
FR8: Epic 15 - „im Sommer geschlossen"-Kennzeichnung
FR9: Epic 15 - Zugangs-Flag (frei/Konsum/Ticket)
FR10: Epic 15 - AC-Status
FR11: Epic 15 - Barrierefreiheit
FR12: Epic 15 - Ungeeignete/Tote ausgefiltert
FR13: Epic 15 - Melde-Link (feedbackMailto)
FR14: Epic 16 - Landing Page mit eingebetteter Karte
FR15: Epic 16 - DWD-Hitzewarn-Banner
FR16: Epic 16 - „in deiner Nähe" Geolocation
FR17: Epic 16 - Mail-Opt-out für Institutionen
FR18: Epic 15 - Trinkbrunnen-Reuse
FR19: Epic 15 - Saison-Logik
FR20: Epic 15 + Epic 16 - Layer per URL-State aktivierbar (Epic 15), CTA-Deep-Link von der Landing Page (Epic 16)

## Epic List

### Epic 15: Kühle Orte im Atlas
Nutzer finden geeignete kühle Orte auf der navigator.berlin-Karte, sehen pro Ort Adresse, Live-Öffnungsstatus, Kühle-Score und ehrliche Flags, und navigieren mit einem Tap hin. Ungeeignete und tote Orte erscheinen nicht. Liefert den vollständigen, eigenständigen Layer.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR18, FR19

### Epic 16: Kühle-Orte-Landing-Page
Eine eigenständige, nutzerorientierte Seite (NYC-Geist) macht das Angebot zugänglich: Live-DWD-Hitzewarnung, eingebettete Karte, „in deiner Nähe" per Geolocation, transparente Quellen und Opt-out-Mail für Institutionen. Baut auf Epic 15, steht eigenständig.
**FRs covered:** FR14, FR15, FR16, FR17

---

## Epic 15: Kühle Orte im Atlas

Nutzer finden geeignete kühle Orte auf der navigator.berlin-Karte, sehen pro Ort Adresse, Live-Öffnungsstatus, Kühle-Score und ehrliche Flags, und navigieren mit einem Tap hin. Ungeeignete und tote Orte erscheinen nicht.

### Story 15.1: Kühle-Orte-Daten-Build (Merge + Anreicherung)

As a Solo-Maintainer,
I want ein deterministisches Build-Script, das OSM-Geometrie und die redaktionelle Anreicherung zu einem sauberen GeoJSON merged,
so that der Layer auf geprüften, gefilterten Daten steht.

**Acceptance Criteria:**

**Given** `static/data/kuehle-orte/enrichment.json` (659 angereicherte Orte) und `places-osm.json` (Geometrie)
**When** `scripts/build-kuehle-orte.ts` läuft
**Then** entsteht ein GeoJSON-FeatureCollection, gejoint per `id` (`type/osmId`), mit Koordinaten aus der Geometrie und allen Anreicherungs-Feldern als Properties

**Given** die Qualitäts-Flags
**When** gemerged wird
**Then** Features mit `suitable=false` oder `still_exists=no` werden ausgefiltert, die ausgefilterte Anzahl wird geloggt (kein stiller Verlust)

**Given** jeder Ort
**When** das Feature gebaut wird
**Then** werden Navi-Deep-Links als Properties erzeugt: Google (`https://www.google.com/maps/dir/?api=1&destination=LAT,LON`) und Apple (`https://maps.apple.com/?daddr=LAT,LON`)

**Given** TDD (ADR-012)
**When** Tests laufen
**Then** Join-Treffer/Misses, Filter-Logik, Navi-Link-Erzeugung und Edge-Cases (fehlende Koordinaten, leeres Set, unbekannte id) sind getestet, kein Crash bei Lücken

### Story 15.2: Layer-Integration in die Pipeline (kind 'local' + MANIFEST + Lizenz)

As a Solo-Maintainer,
I want den `kuehle-orte`-Layer als First-Class-Bürger in der bestehenden Layer-Pipeline,
so that er gehasht, manifest-registriert und lizenzkonform wie jeder andere Layer ausgeliefert wird.

**Acceptance Criteria:**

**Given** `scripts/lib/sources.ts` mit den Arten `overpass|fis-broker|odis`
**When** eine neue Art `kind: 'local'` plus `fetchSource()`-Pfad die vorgebaute GeoJSON liest
**Then** lädt `fetch-static.ts` den `kuehle-orte`-Layer durch dieselbe Simplify-/Hash-/Manifest-Mechanik

**Given** der MANIFEST-Eintrag
**When** der Layer geschrieben wird
**Then** enthält er Quelle, Stand, SHA256 und Lizenz: OSM-Anteil ODbL 1.0 mit Attribution, redaktionelle Anreicherung als eigener Datensatz gekennzeichnet, dazu `bundleGroup`, `zoomThresholds`, `geometryType: Point`

**Given** `editorial-config.ts`, `pin-icon-mapping.ts`, `layer-synonyms.ts`
**When** der Layer registriert wird
**Then** ist `kuehle-orte` mit Slug, `disclaimerVariants`, `primarySourceUrl`, `feedbackMailto: true`, Icon und Synonymen eingetragen (FR13-Mechanik vorhanden)

**Given** der bestehende `trinkbrunnen`-Layer (FR18)
**When** Wasser-Orte als kühle Option erwogen werden
**Then** referenziert/aktiviert der `kuehle-orte`-Kontext den bestehenden Trinkbrunnen-Layer, statt Brunnen-Daten zu duplizieren (kein doppelter Datensatz im Manifest)

**Given** der bestehende URL-State-Sync (FR20)
**When** der Atlas mit dem Layer-Slug `kuehle-orte` als URL-Parameter geladen wird
**Then** ist der Layer beim Laden vorab aktiviert und sichtbar, ohne manuelles Einschalten (Deep-Link-Ziel für die Landing Page)

**Given** TDD
**When** der `kind: 'local'`-Pfad getestet wird
**Then** sind Datei-Read, Manifest-Merge (Slug-Filter überschreibt nicht andere Layer) und Lizenz-Feld abgedeckt; der Layer rendert sichtbar auf der Karte

### Story 15.3: Orts-Inspector mit Adresse, Navigation und Melde-Link

As a hitzegeplagter Nutzer,
I want pro Ort die genaue Adresse, einen Navi-Link und einen Melde-Link,
so that ich sofort hinfinde und Fehler melden kann.

**Acceptance Criteria:**

**Given** ein ausgewählter kühler Ort
**When** der Inspector/Tooltip öffnet
**Then** zeigt er Name, Typ (mit Icon) und die verifizierte, kopierbare Adresse

**Given** die Navi-Properties (Story 15.1)
**When** ich die Aktions-Buttons sehe
**Then** öffnen „Google Maps" und „Apple Maps" je den korrekten Routing-Deep-Link, touch-groß und tastaturbedienbar (WCAG)

**Given** `feedbackMailto` (Story 15.2)
**When** ich „stimmt nicht / gibt's nicht mehr" wähle
**Then** öffnet ein vorbefüllter Mail-Entwurf mit Ortsname und id im Betreff/Body

**Given** bestehende Inspector-Panel-Komponenten
**When** der Ort gerendert wird
**Then** wird das vorhandene Layer-Hit-Rendering wiederverwendet, kein neuer Tooltip-Stack, Dateien unter 500 Zeilen

### Story 15.4: Live-Öffnungsstatus, „jetzt offen"-Filter und Saison-Logik

As a Nutzer bei Hitze,
I want sehen, was gerade offen ist, und Geschlossenes ausblenden,
so that ich keine vergeudeten Wege mache.

**Acceptance Criteria:**

**Given** das `opening_hours`-Feld eines Orts
**When** der Status berechnet wird
**Then** zeigt eine Ampel „jetzt offen" (grün), „schließt bald" (gelb), „zu" (rot), als Farbe UND Text (nicht nur Farbe)

**Given** fehlende/unplausible Öffnungszeiten
**When** der Status nicht bestimmbar ist
**Then** Fallback „Zeiten unbekannt", der Ort bleibt sichtbar

**Given** der „jetzt offen"-Filter
**When** ich ihn aktiviere
**Then** verschwinden geschlossene Orte aus dem Layer, der Filter ist tastaturbedienbar und beschriftet

**Given** saisonale Orte (FR19)
**When** der Status berechnet wird
**Then** berücksichtigt die Logik Saison (z.B. Trinkbrunnen Mai–Okt), außerhalb der Saison korrekt als „zu/saisonal" behandelt

**Given** TDD
**When** Parser-Tests laufen
**Then** offen/zu/Grenzzeiten, fehlende Daten, Saison-Randfälle sind getestet

### Story 15.5: Kühle-Score, Sommer-Verfügbarkeit und ehrliche Flags

As a Nutzer,
I want pro Ort wissen, wie kühl er ist und ob er bei Hitze überhaupt nutzbar ist,
so that ich nicht vor einem im Sommer geschlossenen Eisstadion stehe.

**Acceptance Criteria:**

**Given** `cool_score` (1–5) und Begründung
**When** der Ort gerendert wird
**Then** zeigt ein Badge den Score plus Kurzbegründung (klimatisiert/Massivbau/am Wasser)

**Given** `summer_available=no`
**When** der Ort gerendert wird
**Then** trägt er ein deutliches Badge „im Sommer geschlossen" und wird in Sortierung/Sichtbarkeit abgewertet; `limited` wird als „eingeschränkt" gekennzeichnet

**Given** `is_free`, `ac_status`, Barrierefreiheit
**When** die Flags gerendert werden
**Then** erscheinen „kostenlos/Ticket/Konsum", „klimatisiert" nur wenn belegt (`yes`), Rollstuhl-Symbol wenn bekannt, je mit Text-Alternative

**Given** TDD
**When** die Badge-Mapping-Logik getestet wird
**Then** Score-Stufen, Sommer-Abwertung, Flag-Darstellung und „AC nur wenn belegt" sind abgedeckt

### Story 15.6: Methodik-Doku, Kühle-Score-Transparenz und ADR

As a Nutzer und Maintainer,
I want die Methodik hinter Kühle-Score, Sommer-Verfügbarkeit und Datenherkunft transparent dokumentiert,
so that das Angebot ehrlich und nachvollziehbar bleibt.

**Acceptance Criteria:**

**Given** die neue Datenbasis
**When** `docs/kuehle-orte-methodik.md` + die Methodik-Route aktualisiert werden
**Then** sind erklärt: Kühle-Score-Rubrik, `summer_available`-Definition, AC-Ehrlichkeit (29 belegt, Rest likely/unknown), Datenherkunft (OSM ODbL + redaktionelle Web-Recherche-Anreicherung), Caveats (kein Behörden-Ersatz, kein „besser als die Stadt", kein Rechtsanspruch/Hausrecht)

**Given** die Architektur-Entscheidung
**When** ein ADR geschrieben wird
**Then** dokumentiert es den neuen `kind: 'local'`-Pfad, den `build-kuehle-orte.ts`-Merge und die Lizenz-Trennung OSM/Anreicherung; Methodik + ADR sind verlinkt

**Given** die Forbidden-Token-Konvention
**When** die Doku geschrieben wird
**Then** keine em-dashes, aktive Sprache, Quellen verlinkt

### Story 15.7: Epic-15-Dokumentation (Pipelines + Story-Map + INDEX)

As a Solo-Maintainer,
I want Epic 15 im docs-Tree dokumentiert,
so that kein Wissens-Drift entsteht.

**Acceptance Criteria:**

**Given** der neue Layer + Build-Pfad
**When** `pnpm doc:pipelines` + `pnpm doc:story-map` neu laufen
**Then** erscheinen `kuehle-orte`-Layer und `build-kuehle-orte.ts` im Pipeline-Atlas, `docs/INDEX.md` + System-Map verweisen darauf, Frontmatter gesetzt

**Given** die Doku-Konsistenz
**When** geprüft wird
**Then** Methodik + ADR + MANIFEST-Lizenz sind verlinkt und stimmig, keine em-dashes

---

## Epic 16: Kühle-Orte-Landing-Page

Eine eigenständige, nutzerorientierte Seite im NYC-Geist macht das Angebot zugänglich und verteilbar.

### Story 16.1: Landing-Page-Gerüst mit eingebetteter Karte

As a Besucher (auch ohne Atlas-Vorwissen),
I want eine klare Seite, die mir kühle Orte zeigt,
so that ich bei Hitze sofort Hilfe finde.

**Acceptance Criteria:**

**Given** eine neue Route (z.B. `/kuehle-orte`)
**When** ich sie öffne
**Then** sehe ich eine mobile-first Seite mit freundlichem Intro (Angebot-Haltung, kein Behörden-Ersatz, kein „besser als die Stadt") und der eingebetteten Kühle-Orte-Karte

**Given** WCAG
**When** ich die Seite per Tastatur/Screenreader nutze
**Then** sind Überschriften-Hierarchie, Fokus, Kontrast und die Karten-Interaktion bedienbar

**Given** der „Zum Explorer" / „Karte erkunden"-CTA (FR20)
**When** ich ihn antippe
**Then** lande ich im Atlas/Explorer mit bereits aktiviertem `kuehle-orte`-Layer (URL-State-Deep-Link), nahtloser Übergang von der eingebetteten Vorschau in die volle Karte

**Given** DE-only (NFR9)
**When** Texte gerendert werden
**Then** stehen sie direkt deutsch im Code, ohne i18n-Keys

### Story 16.2: Live-DWD-Hitzewarn-Banner

As a Besucher,
I want sehen, ob gerade eine Hitzewarnung gilt,
so that ich die Dringlichkeit einschätze.

**Acceptance Criteria:**

**Given** die DWD-Warnlage für Berlin
**When** eine Hitzewarnung aktiv ist
**Then** zeigt ein Banner Warnstufe und Kurzinfo, mit DWD-Quellenangabe

**Given** keine aktive Warnung
**When** die Seite lädt
**Then** ist das Banner ausgeblendet, ohne Layout-Sprung

**Given** ein Abruf-Fehler
**When** die DWD-Quelle nicht erreichbar ist
**Then** degradiert die Seite still, kein Crash, getestet

### Story 16.3: „In deiner Nähe" per Geolocation

As a Besucher unterwegs,
I want die nächsten offenen kühlen Orte zu meinem Standort,
so that ich den kürzesten Weg ins Kühle finde.

**Acceptance Criteria:**

**Given** Geolocation-Consent
**When** ich „in meiner Nähe" wähle
**Then** werden die nächsten geeigneten, jetzt-offenen Orte nach Distanz sortiert gezeigt, je mit Navi-Link

**Given** verweigerter/fehlender Standort
**When** Geolocation nicht verfügbar ist
**Then** klare Fallback-Kommunikation (z.B. Adresssuche/ganze Karte), kein toter Zustand

**Given** TDD
**When** die Distanz-/Sortier-Logik getestet wird
**Then** Nähe-Sortierung, Filter „jetzt offen", Fehlerpfad sind abgedeckt

### Story 16.4: Opt-out-Mail für Institutionen und Quellen-Transparenz

As a Institution oder transparenter Anbieter,
I want einen einfachen Austragungs-Weg und offene Quellen,
so that das Angebot fair und nachvollziehbar bleibt.

**Acceptance Criteria:**

**Given** eine Institution, die nicht gelistet sein will
**When** sie den Opt-out-Mail-Link nutzt
**Then** öffnet ein vorbereiteter Mail-Entwurf zur Austragung

**Given** der Transparenz-Abschnitt
**When** ich ans Seitenende scrolle
**Then** sind Datenquellen (OSM/ODbL, redaktionelle Anreicherung, DWD) und die Angebot-Haltung klar genannt, keine Absolutismen

### Story 16.5: Landing-Doku + Feature-Launch-Eintrag (/updates)

As a Solo-Maintainer,
I want die Landing Page dokumentiert und einen nutzerseitigen Changelog-Eintrag,
so that der Launch sichtbar und einordbar ist.

**Acceptance Criteria:**

**Given** die neue Route
**When** die Doku-Generatoren laufen
**Then** erscheint die Landing Page in System-Map/`docs/INDEX.md`, Frontmatter gesetzt

**Given** die `/updates`-Route
**When** der Feature-Changelog geschrieben wird
**Then** existiert `_content/updates/2026-MM-DD-kuehle-orte.md` (category `feature`), erklärt das Angebot in Nutzersprache (kühle Orte, Live-Status, Navi, Angebot-Haltung), verlinkt Methodik, hält die Forbidden-Token-Konvention (keine em-dashes)

**Given** der Eintrag
**When** `/updates` + Feeds prerendern
**Then** erscheint er chronologisch, Feed-Tests grün, kein Build-Fehler
