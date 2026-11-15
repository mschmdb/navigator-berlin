import type { WahlPunkt } from './wahl-types';

function latestYear(points: readonly WahlPunkt[]): number | null {
	return points.length === 0 ? null : Math.max(...points.map((p) => p.jahr));
}

/** Parteien nach Anteil bei der jüngsten Wahl, ältere Parteien (nur früher stark) danach. */
export function partiesOf(points: readonly WahlPunkt[]): string[] {
	const jahr = latestYear(points);
	const latest = points.filter((p) => p.jahr === jahr).sort((a, b) => b.anteil - a.anteil);
	const names = latest.map((p) => p.partei);
	for (const p of [...points].sort((a, b) => b.anteil - a.anteil)) {
		if (!names.includes(p.partei)) names.push(p.partei);
	}
	return names;
}

export function seriesFor(points: readonly WahlPunkt[], partei: string): WahlPunkt[] {
	return points.filter((p) => p.partei === partei).sort((a, b) => a.jahr - b.jahr);
}
