function clamp(n: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, n));
}

/** Mappt value linear auf 0-100 Prozent, geclamped. min===max → 0. */
export function barPercent(value: number, min: number, max: number): number {
	if (max <= min) return 0;
	return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

export interface ShareInput {
	share: number;
}

export interface Segment {
	offsetPct: number;
	widthPct: number;
}

/**
 * Normalisiert eine Klassen-Verteilung auf 100% und liefert pro Klasse
 * kumulativen Offset + Breite (für gestapelte Verteilungs-Balken).
 */
export function cumulativeSegments(classes: readonly ShareInput[]): Segment[] {
	const total = classes.reduce((sum, c) => sum + Math.max(0, c.share), 0);
	let offset = 0;
	return classes.map((c) => {
		const widthPct = total > 0 ? (Math.max(0, c.share) / total) * 100 : 0;
		const seg = { offsetPct: offset, widthPct };
		offset += widthPct;
		return seg;
	});
}

/** Nähe als 0..1: nah = 1 (voller Ring), bei/jenseits maxMeters = 0. */
export function proximityFraction(distanceMeters: number, maxMeters: number): number {
	if (maxMeters <= 0) return 0;
	return clamp(1 - distanceMeters / maxMeters, 0, 1);
}

/** SVG stroke-dasharray für einen Kreis: gefüllter Anteil + voller Umfang. */
export function ringDashArray(fraction: number, circumference: number): string {
	const filled = clamp(fraction, 0, 1) * circumference;
	return `${filled} ${circumference}`;
}
