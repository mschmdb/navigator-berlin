export const prerender = true;

/**
 * Story 3 (Portal-Skeleton /berlin-wahlen): reines Shell-Prerender ohne
 * DB-Zugriff. Die Steuerleiste und alle Kapitel-Daten laden client-seitig
 * über die Story-2-APIs (`/api/wahl/list` etc., siehe
 * `wahl-portal-context.svelte.ts`). Das hält den Build DB-los-sicher und
 * hält Kapitel-Substanz auf den Detailseiten (Story 10).
 */
