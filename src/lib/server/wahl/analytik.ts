/**
 * Build-Zeit-Rechenkern für Wahl-Analytik (Story: Daten-Fundament Zeitreihen
 * und Bulk-Winners). Pure Functions ohne DB-Zugriff, siehe ADR-013
 * (Build-Time-Aggregat als Postgres-Cache, kein zweiter Live-Rechenpfad).
 *
 * Wiederholungswahl-Regel (Boundaries): Wechsel/Trend/Volatilität nutzen pro
 * Legislatur den letztgültigen Stand. Eine Wiederholungswahl (z.B. AGH 2023)
 * ersetzt ihre Eltern-Wahl (AGH 2021) an derselben Legislatur-Position;
 * Eltern-Jahr → Wiederholungs-Jahr zählt dadurch nie als eigener Wechsel,
 * weil das Eltern-Jahr in der effektiven Reihe gar nicht mehr auftaucht.
 */

export type PartyShares = ReadonlyMap<string, number>;

export type SeriesEntry = {
	readonly jahr: number;
	readonly isRepeatElection: boolean;
	readonly parentJahr: number | null;
	readonly shares: PartyShares;
};

export type WechselResult = {
	readonly wechselCount: number;
	readonly wechselJahre: readonly number[];
};

/**
 * Löst Wiederholungswahlen auf: eine Wiederholungswahl ersetzt ihre
 * Eltern-Wahl an deren Position in der Reihe, statt einen eigenen Slot
 * zu belegen. Sortiert aufsteigend nach Jahr.
 */
function mergeRepeatElections(points: readonly SeriesEntry[]): SeriesEntry[] {
	const sorted = [...points].sort((a, b) => a.jahr - b.jahr);
	const effective: SeriesEntry[] = [];
	for (const point of sorted) {
		if (point.isRepeatElection && point.parentJahr !== null) {
			const parentIndex = effective.findIndex((entry) => entry.jahr === point.parentJahr);
			if (parentIndex !== -1) {
				effective[parentIndex] = point;
				continue;
			}
		}
		effective.push(point);
	}
	return effective;
}

function winningPartei(shares: PartyShares): string | null {
	let best: string | null = null;
	let bestAnteil = -Infinity;
	for (const [partei, anteil] of shares) {
		// Gleichstand alphabetisch aufloesen: sonst hinge der "Sieger" an der
		// Map-Einfuegereihenfolge (unsortierte DB-Rows) und Wechsel-Ergebnisse
		// waeren zwischen Builds nicht deterministisch.
		if (
			anteil > bestAnteil ||
			(anteil === bestAnteil && best !== null && partei.localeCompare(best, 'de') < 0)
		) {
			bestAnteil = anteil;
			best = partei;
		}
	}
	return best;
}

function l1Distance(a: PartyShares, b: PartyShares): number {
	const keys = new Set<string>([...a.keys(), ...b.keys()]);
	let sum = 0;
	for (const key of keys) {
		sum += Math.abs((a.get(key) ?? 0) - (b.get(key) ?? 0));
	}
	return sum;
}

/**
 * Zählt Wechsel der stärksten Partei über die effektive Legislatur-Reihe
 * (Wiederholungswahlen bereits gemergt).
 */
export function computeWechsel(points: readonly SeriesEntry[]): WechselResult {
	const effective = mergeRepeatElections(points);
	const wechselJahre: number[] = [];
	for (let i = 1; i < effective.length; i++) {
		const prev = winningPartei(effective[i - 1].shares);
		const curr = winningPartei(effective[i].shares);
		if (prev !== null && curr !== null && prev !== curr) {
			wechselJahre.push(effective[i].jahr);
		}
	}
	return { wechselCount: wechselJahre.length, wechselJahre };
}

/**
 * Trend einer Partei = Steigung der linearen Regression ihres Anteils über
 * die Jahre (kleinste Quadrate), auf der effektiven Legislatur-Reihe.
 * Jahre ohne Anteil für die Partei werden ausgelassen. Mit < 2 Datenpunkten
 * ist kein Trend bestimmbar → 0.
 */
export function computeTrendSlope(points: readonly SeriesEntry[], parteiKurzname: string): number {
	const effective = mergeRepeatElections(points);
	const xy = effective
		.map((entry) => ({ jahr: entry.jahr, anteil: entry.shares.get(parteiKurzname) }))
		.filter((p): p is { jahr: number; anteil: number } => p.anteil !== undefined);

	if (xy.length < 2) return 0;

	const n = xy.length;
	const meanX = xy.reduce((sum, p) => sum + p.jahr, 0) / n;
	const meanY = xy.reduce((sum, p) => sum + p.anteil, 0) / n;

	let numerator = 0;
	let denominator = 0;
	for (const p of xy) {
		numerator += (p.jahr - meanX) * (p.anteil - meanY);
		denominator += (p.jahr - meanX) ** 2;
	}

	return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Volatilität = mittlere L1-Distanz aufeinanderfolgender Anteils-Vektoren
 * über die effektive Legislatur-Reihe. Mit < 2 Legislaturen: 0.
 */
export function computeVolatilitaet(points: readonly SeriesEntry[]): number {
	const effective = mergeRepeatElections(points);
	if (effective.length < 2) return 0;

	let total = 0;
	for (let i = 1; i < effective.length; i++) {
		total += l1Distance(effective[i - 1].shares, effective[i].shares);
	}
	return total / (effective.length - 1);
}

/**
 * Zwilling-Ähnlichkeit zweier Anteils-Vektoren: 1 − normierte L1-Distanz,
 * skaliert auf 0..100. L1-Distanz zweier Anteils-Vektoren (Summe je Vektor
 * = 1) liegt in [0, 2], die Normierung teilt daher durch 2.
 */
export function computeSimilarity(a: PartyShares, b: PartyShares): number {
	const distance = l1Distance(a, b);
	const normalized = Math.min(distance / 2, 1);
	return Math.round((1 - normalized) * 100);
}
