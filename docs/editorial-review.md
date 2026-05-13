# Editorial-Review-Checkliste (Pre-Phase-1-Launch + halbjährlich)

Solo-Maintainer-Pflicht. Vor jedem Release.

## 1. Stolpersteine (FR50, FR51)

- [ ] StolpersteinDetail rendert NUR OSM-Properties (`person`, `inscription`, `wikipedia:de/en`)
- [ ] Keine LLM-generierten Personen-Hintergründe im UI
- [ ] Fallback-Text "Information nicht verfügbar, bitte Quelle besuchen" wenn `inscription` leer
- [ ] Berliner-Koordinierungsstelle-Link (`stolpersteine-berlin.de`) IMMER vorhanden
- [ ] Wikipedia-Link nur wenn `wikipedia:de` oder `wikipedia:en` OSM-Property existiert
- [ ] `neverMachineTranslate: true` in EDITORIAL_CONFIG.stolpersteine bestätigt
- [ ] `data-osm-sourced="true"` Marker im DOM

## 2. Mauer/Sektoren (FR52)

- [ ] Disclaimer `historic` zeigt "1961–1989" und OSM-Hinweis
- [ ] Source-Link zu `berlin-mauer.de` Gedenkstätte
- [ ] `neverMachineTranslate: true` in EDITORIAL_CONFIG.mauer-sektoren
- [ ] TODO-Annotation für Phase-2-Layer-Daten (Manifest-Eintrag) gepflegt

## 3. Mietspiegel + Bodenrichtwerte (FR55)

- [ ] 100% Coverage: jeder Hit zeigt Disclaimer `legal` "Ersetzt keine rechtliche Aussage"
- [ ] Primary-Source-URL zeigt auf offizielle Seite (berlin.de/mietspiegel, gutachterausschuss)
- [ ] Numerische Werte korrekt formatiert (€/m²)

## 4. Trinkbrunnen (FR21)

- [ ] Mai bis Oktober: `seasonal-pill-active` "aktiv (Mai–Oktober)" mit Success-Token
- [ ] November bis April: `seasonal-pill-outofseason` "außerhalb der Saison" mit Warning-Token + Disclaimer `seasonal`
- [ ] `isInSeason`-Helper korrekt (Inklusiv 01.05. + 31.10.)

## 5. Feedback-Mailto (FR53)

- [ ] Recipient `hallo@navigator.berlin` (Konstante `FEEDBACK_EMAIL` in `src/lib/utils/contact.ts`)
- [ ] MetaFooter-Kontakt-Link nutzt zentrale `FEEDBACK_EMAIL`-Konstante (kein Hardcode)
- [ ] **Deferred (Phase-2):** Eigene Feedback-Form-Page (z.B. `/feedback` oder `/fehler-melden`), verlinkt aus MetaFooter. Per-Row-Mailto im Inspector entfernt wegen Clutter-Gefahr (Story 1.12 Review-Pivot 2026-05-13). `buildErrorReportMailto` + `ErrorFeedbackMailto`-Komponente bleiben für künftige Konsumierung.

## 6. Visuelle Hierarchie (UX-DR38, UX-DR32)

- [ ] Disclaimer-Stack unter Value + DataStandBanner
- [ ] Custom-Detail (Stolperstein, Mauer) nach Disclaimer
- [ ] Mailto-Link rechts-unten, Tertiary-Style `text-accent underline`
- [ ] Trennung via Hairlines (`border-rule`), keine Cards

## 7. A11y

- [ ] axe-core 0 Violations auf Inspector-Panel + Bottom-Sheet
- [ ] Mailto-Link Keyboard-erreichbar (Tab-Order korrekt)
- [ ] `aria-label` an Mailto-Link beschreibt Layer-Kontext
- [ ] Disclaimer keine Tooltip-only-Display (UX-DR20)

## 8. Translation-Pipeline-Foundation (Story 3.3, FR55i)

- [ ] `docs/never-machine-translate.md` aktuell
- [ ] Translation-Skript prüft `EDITORIAL_CONFIG[slug].neverMachineTranslate`
- [ ] DE-Original mit Hinweis "Editorial-Sensible nicht maschinell übersetzt" sichtbar

## 9. CSP / Drittanbieter (Story 4.3)

- [ ] `de.wikipedia.org` + `en.wikipedia.org` in CSP-Allowlist
- [ ] `stolpersteine-berlin.de` + `berlin-mauer.de` in CSP-Allowlist
- [ ] Keine US-Drittanbieter-Tracker (Wikimedia-Lookup nur Outbound, kein Embed)

## Review-Frequenz

- Pre-Phase-1-Launch: Pflicht
- Halbjährlich (jeweils 1. Q1 + 1. Q3 des Jahres)
- Bei Layer-Daten-Update mit Stolperstein/Mauer-Betrifft: ad-hoc
