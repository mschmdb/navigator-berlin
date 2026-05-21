/**
 * Shared Ranking-Row-Type (Story 2.9b).
 * Server-Loader baut RankingRow aus bezirk_score/kiez_score; Client-Component
 * konsumiert die gleiche Struktur. Hier statt im +page.server.ts, damit das
 * Client-Bundle keinen Pfad in $lib/server importiert.
 */
export interface RankingRow {
	readonly slug: string;
	readonly displayName: string;
	readonly bezirkSlug: string | null;
	readonly bezirkName: string | null;
	readonly composite: number | null;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
}
