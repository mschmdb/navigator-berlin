/**
 * Shared Ranking-Row-Type (Story 2.9b).
 * Server-Loader baut RankingRow aus bezirk_score/kiez_score; Client-Component
 * konsumiert die gleiche Struktur. Hier statt im +page.server.ts, damit das
 * Client-Bundle keinen Pfad in $lib/server importiert.
 */
/** Sortierbare Score-Spalten mit eigenem Berlin-Rang aus `kiez_rank`/`bezirk_rank`. */
export const RANKED_METRICS = [
	'composite',
	'ruheLuft',
	'gruenHitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz',
	'kultur'
] as const;
export type RankedMetric = (typeof RANKED_METRICS)[number];
export type RankingRanks = Readonly<Partial<Record<RankedMetric, number | null>>>;

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
	readonly kultur: number | null;
	/** Story 14.9: Kontext-Spalte (nicht sortierbar, kein Rang). Strukturell-Indigo. */
	readonly kriminalitaet: number | null;
	/** Wettkampf-Rang je Spalte aus der Rang-Tabelle, damit die Tabelle denselben Platz zeigt wie die Profilseite. */
	readonly ranks: RankingRanks;
}
