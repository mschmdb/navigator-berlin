# navigator.berlin

Cross-Layer Berlin Atlas — adressgenaue Multi-Layer-Inspektion (Klima, Lärm, Mobilität, Heritage, demografische Daten) auf einer offenen Karte.

GitHub: <https://github.com/mschmdb/navigator-berlin>

## Setup

```sh
pnpm install
pnpm dev
```

Anforderungen: Node.js ≥20 (siehe `.nvmrc`), pnpm 10.

## Stack

SvelteKit 2 · Svelte 5 (Runes) · TypeScript strict · Tailwind v4 · Paraglide v2 (8 Sprachen) · MapLibre GL · Layerchart · D3 · Turf · Bits UI · WebMCP · Vitest · Playwright.

Volle Architektur-Übersicht: `docs/adr/` (Architectural Decision Records).

## Lizenz

MIT — siehe [`LICENSE`](./LICENSE).
