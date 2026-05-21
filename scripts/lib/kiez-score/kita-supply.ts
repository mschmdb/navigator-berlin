import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

/**
 * Kita-Versorgung pro Kopf (Story 10.1). `e_platz` ist die gemeldete Platzkapazität
 * (WFS-String). Pro LOR: Σ e_platz aller enthaltenen Kitas ÷ Kinder 0-6 (aus Story 10.0).
 */
export function parseEPlatz(raw: unknown): number {
	if (typeof raw === 'number') return Number.isFinite(raw) && raw > 0 ? raw : 0;
	if (typeof raw !== 'string') return 0;
	const n = Number.parseInt(raw.trim(), 10);
	return Number.isFinite(n) && n > 0 ? n : 0;
}

export function plaetzeProKind(kitaPlaetzeSum: number, kinder0bis6: number | null): number | null {
	if (kinder0bis6 === null || !Number.isFinite(kinder0bis6) || kinder0bis6 <= 0) return null;
	return kitaPlaetzeSum / kinder0bis6;
}

/**
 * Summiert `e_platz` aller Kita-Punkte, die im jeweiligen LOR-Polygon liegen.
 * Build-Time-Aggregation (Point-in-Polygon). LOR ohne Kita → 0.
 */
export function aggregateKitaPlaetzeByLor(
	lorFeatures: readonly Feature[],
	kitaFeatures: readonly Feature[],
	lorIdFn: (feat: Feature) => string
): Record<string, number> {
	const out: Record<string, number> = {};
	const lorPolys = lorFeatures
		.filter((f) => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
		.map((f) => ({ id: lorIdFn(f), feat: f as Feature<Polygon | MultiPolygon> }));
	for (const { id } of lorPolys) out[id] = out[id] ?? 0;

	for (const kita of kitaFeatures) {
		if (kita.geometry?.type !== 'Point') continue;
		const platz = parseEPlatz(kita.properties?.e_platz);
		if (platz === 0) continue;
		const pt = point(kita.geometry.coordinates as [number, number]);
		for (const { id, feat } of lorPolys) {
			if (booleanPointInPolygon(pt, feat)) {
				out[id] += platz;
				break;
			}
		}
	}
	return out;
}
