# Runbook: Adress-Bookmark-Storage

Operatives Referenz-Dokument für die Bookmark-Funktion. Zweck: Compliance-Audits, Incident-Response, Migrations-Planung.

## Storage-Key

- **Key:** `navigator-berlin.bookmarks.v1`
- **Mechanismus:** Browser-`window.localStorage`
- **Server-Seite:** keine Persistenz, kein Backup, keine Replikation.
- **Cookie:** keiner. Auch keine Hidden-Form-State, keine HTTP-Header.

## Schema (Phase 1)

```ts
interface BookmarkStoreV1 {
  schemaVersion: 1;
  bookmarks: Bookmark[];
}

interface Bookmark {
  id: string;          // uuid v4 via crypto.randomUUID
  displayName: string; // <= 200 chars
  lat: number;         // 52.3..52.7 (Berlin Bbox)
  lng: number;         // 13.0..13.8
  bezirk?: string;
  postcode?: string;
  createdAt: string;   // ISO 8601 UTC
}
```

Validation via `valibot`-Schema in `src/lib/state/bookmark-schema.ts`. Reject-Path schreibt nicht zurück (User-Daten erhalten).

## Quota

- **MAX_BOOKMARKS:** 50 (Konstante in `src/lib/state/bookmark-store.ts`).
- **Begründung:** ausreichend für realistische Wohnungssuche-Shortlist; weit unter LocalStorage-5MB-Limit; vermeidet unbegrenztes Wachstum.
- Überschreitungsversuch: Save-Action blockiert, Inline-Hinweis "Limit erreicht".

## Migrationspfad

- Schema-Versionierung via `schemaVersion`-Feld.
- Phase-2-Schema (z. B. Tags, Notes, Compared-Sets) erhöht Version, `migrate()` mappt rückwärts kompatibel oder verwirft inkompatibel.
- Unbekannte Versionen: leeres Array fallback, console.warn. Daten NICHT überschreiben.

## Lösch-Pfad (Compliance-relevant)

1. **In-App:** Header-Bookmark-Trigger → Dialog → Mülleimer-Icon pro Row oder "Alle löschen"-Footer.
2. **Browser-Settings:** Site-Data für navigator.berlin löschen.
3. **Inkognito-Modus:** automatischer Verwurf beim Schließen.

## Failure-Modi

| Szenario | Verhalten |
|----------|-----------|
| `QuotaExceededError` beim Schreiben | In-Memory-State bleibt aktiv, Inline-Banner "Speicher nicht verfügbar" im Dialog. |
| Private-Mode `SecurityError` | gleicher Pfad wie Quota-Fehler. |
| Korrupter JSON-Inhalt | Empty fallback, console.warn, Storage NICHT überschrieben (Recovery via Reload nach Browser-Restart möglich). |
| Schema-Version-Mismatch | Empty fallback + Warn (siehe Migrationspfad). |
| SSR-Aufruf | `loadBookmarks(null)` liefert leeres Store. |

## Cross-Tab-Sync

`window.addEventListener('storage', ...)` lauscht auf Updates anderer Tabs und refresht `ui.bookmarks` reaktiv. Konflikt-Resolution: last-write-wins (Browser-Default).

## Rechtliche Verortung

- §25 Abs. 2 Nr. 2 TDDDG (User-initiierter Telemediendienst).
- ADR-004 dokumentiert die Cookieless-Ausnahme.
- `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` ist Vorlage für die Datenschutzerklärung (Story 4.6).

## Audit-Checkliste

- [ ] Storage-Key entspricht `navigator-berlin.bookmarks.v1`.
- [ ] Keine Server-seitige Speicherung von Bookmark-Daten (Coolify-Logs prüfen).
- [ ] `loadBookmarks`/`persistBookmarks` ausschließlich in `bookmark-store.ts`.
- [ ] Lösch-UI funktioniert für Einzel- und Sammel-Operation.
- [ ] Datenschutzerklärung benennt Storage-Key, Datenumfang, Löschpfad.
