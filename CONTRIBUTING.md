# Contributing

Thanks for your interest in navigator.berlin. This is a solo-maintained project. Open an issue before you start larger work, so we can agree on scope.

## Run locally

Requirements: Node.js 22 (see `.nvmrc`) and pnpm 10.

```sh
pnpm install
pnpm dev
```

The map, the layers and the Kiez-Finder run without a database. Election results and supplementary data need Postgres: see [`docs/runbooks/local-postgres-setup.md`](./docs/runbooks/local-postgres-setup.md).

## Checks before a pull request

```sh
pnpm check          # svelte-check, types
pnpm lint           # prettier and eslint
pnpm test:unit      # vitest
pnpm test:e2e       # playwright, optional
```

New logic comes with a unit test. Write the test first and cover edge cases, not only the happy path.

## Code rules

- TypeScript strict, no `any`.
- Accessible markup first: semantic HTML, keyboard use, WCAG contrast.
- Keep files under 500 lines.
- No hardcoded or mocked data.
- UI strings go through Paraglide (`messages/de.json`, `messages/en.json`).

## Commits

- Imperative mood, one logical change per commit: "Add feature", not "Added feature".
- Write German or English, matching the surrounding history.
- Use no em-dashes.

## Process documents

Specs, stories and audits in [`docs/process/`](./docs/process/) are working logs of the BMAD process. You do not need to read or update them to contribute. Architecture decisions are in [`docs/adr/`](./docs/adr/).
