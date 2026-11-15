import type { WahlArt, WahlPunkt } from './wahl-types';

/** Stimmtyp je Wahlart: Zweitstimme bei Bundestag und Abgeordnetenhaus, eine Stimme bei der BVV. */
export const WAHL_STIMMTYP = {
	btw: 'zweitstimme',
	agh: 'zweitstimme',
	bvv: 'einstimme'
} as const satisfies Record<WahlArt, string>;

/** Bestehender Endpunkt `/api/wahl/series` für die Zeitreihe eines Vergleichsgebiets. */
export function seriesUrl(typ: WahlArt, ebene: 'kiez' | 'bezirk', gebiet: string): string {
	const q = new URLSearchParams({ typ, stimmtyp: WAHL_STIMMTYP[typ], ebene, gebiet });
	return `/api/wahl/series?${q.toString()}`;
}

interface ApiPoint {
	readonly jahr: number;
	readonly partei: string;
	readonly farbe_hex: string;
	readonly anteil: number;
}

function isApiPoint(x: unknown): x is ApiPoint {
	if (typeof x !== 'object' || x === null) return false;
	const p = x as Record<string, unknown>;
	return (
		typeof p.jahr === 'number' &&
		typeof p.partei === 'string' &&
		typeof p.farbe_hex === 'string' &&
		typeof p.anteil === 'number'
	);
}

/** Antwort von `/api/wahl/series` in Punkte mit Anteil in Prozent, wie die Server-Zeitreihe. */
export function pointsFromSeries(body: unknown): WahlPunkt[] {
	const points = (body as { points?: unknown } | null)?.points;
	if (!Array.isArray(points)) return [];
	return points.filter(isApiPoint).map((p) => ({
		jahr: p.jahr,
		partei: p.partei,
		farbe: p.farbe_hex,
		anteil: p.anteil * 100
	}));
}
