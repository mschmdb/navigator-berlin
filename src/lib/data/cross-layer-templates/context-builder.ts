/**
 * Cross-Layer-Template-Context-Builder (Story 6.7).
 *
 * Pro Kiez/Bezirk werden Daten aus verschiedenen Queries zu einem
 * TemplateContext aggregiert. Builder bleibt Pure-Function und delegiert
 * I/O an den Caller (Page-Server-Load).
 */

import type { TemplateContext } from './renderer.js';

export interface KiezSparklinePoint {
	readonly jahr: number;
	readonly parteiKurzname: string;
	readonly anteil: number;
}

export interface KiezTrendInput {
	readonly kiezName: string;
	readonly wahlTypLabel: string;
	readonly stimmtypLabel: string;
	readonly sparkline: readonly KiezSparklinePoint[];
}

/**
 * Baut Context für wahl-trend-zeit-kiez. Sparkline-Punkte werden nach Jahr
 * gruppiert; pro Jahr wird die stärkste Partei ausgewählt.
 */
export function buildKiezTrendContext(input: KiezTrendInput): TemplateContext | null {
	if (input.sparkline.length === 0) return null;

	const byYear = new Map<number, KiezSparklinePoint[]>();
	for (const p of input.sparkline) {
		const bucket = byYear.get(p.jahr) ?? [];
		bucket.push(p);
		byYear.set(p.jahr, bucket);
	}
	const years = Array.from(byYear.keys()).sort((a, b) => a - b);
	if (years.length < 2) return null;

	const topPerYear: { jahr: number; partei: string }[] = [];
	for (const y of years) {
		const points = byYear.get(y) ?? [];
		if (points.length === 0) continue;
		const top = points.reduce((a, b) => (a.anteil >= b.anteil ? a : b));
		topPerYear.push({ jahr: y, partei: top.parteiKurzname });
	}
	if (topPerYear.length < 2) return null;

	return {
		kiez_name: input.kiezName,
		wahl_typ_label: input.wahlTypLabel,
		stimmtyp_label: input.stimmtypLabel,
		sparkline_jahre: years.join(', '),
		sparkline_jahre_top_parteien: topPerYear
			.map((t) => `${t.partei} (${t.jahr})`)
			.join(', ')
	};
}
