---
title: 'Texte kürzen und vereinheitlichen (#92)'
type: 'story'
created: '2026-10-17'
status: 'in-review'
route: 'dispatch'
baseline_commit: 'ed3336a'
review_loop_iteration: 0
context: ['#85', '#92']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Texte zeigen AI-Slop-Muster (Leitlinie 30): gehäufte Abgrenzungen „X, kein Y“, Parallelreihen, Pointen, englische Fachwörter im DE-Text, Versalien-Betonung, Entwicklertext im UI, Bundle-Buchstaben A bis J ohne Abfolge, falsche Anführungszeichen.

**Approach:** Messages DE und EN überarbeiten. Abgrenzungen mit echtem Grund (Stigma, Kälte-Notfall, Haltung) bleiben, höchstens zwei pro Seite. Kleine Code-Anpassungen nur dort, wo Text im Code entsteht (Bundle-Kürzel, Chip-Anführungszeichen, Datenstand-Format). Spec-Checkpoint übersprungen: Issue und Kommentare gelten als abgenommene Spec (Freigabe Matze 17.10.2026).

## Boundaries & Constraints

**Always:** DE und EN gleichzeitig ändern. Message-Keys behalten, damit kein Aufrufer bricht. Fakten nicht verändern.

**Never:** Keine Score-Umbenennung (#93), kein Layout (#90), keine Änderung am Widerspruch Bezirks-Ranking (#101). /ueber und Texte über Matze nur minimal.

## Acceptance

- AC1: Auf home, uis, architektur, kuehle-orte, hitze höchstens zwei „X, kein Y“ je Seite (Guard-Test).
- AC2: Keine Versalien-Betonung, keine Überschrift mit „Was“ (Guard-Test).
- AC3: Keine Bundle-Buchstaben in Labels und in der Palette (Guard- und Komponententest).
- AC4: Keine „Features“/„Coverage“ im DE-Text (Guard-Test).
- AC5: Kein Entwicklertext im Wahlportal (Guard-Test).
- AC6: Chips auf der Startseite mit korrekten Anführungszeichen je Sprache (Komponententest).
- AC7: Datenstand als ausgeschriebener Monat (Unit-Test).

</frozen-after-approval>
