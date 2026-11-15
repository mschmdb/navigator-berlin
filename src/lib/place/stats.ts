function present(values: readonly (number | null)[]): number[] {
	return values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
}

export function median(values: readonly (number | null)[]): number | null {
	const xs = present(values).sort((a, b) => a - b);
	if (xs.length === 0) return null;
	const mid = Math.floor(xs.length / 2);
	return xs.length % 2 === 1 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

export function mean(values: readonly (number | null)[]): number | null {
	const xs = present(values);
	if (xs.length === 0) return null;
	return xs.reduce((s, v) => s + v, 0) / xs.length;
}

/** Niedrigster und höchster Eintrag, etwa die Spannweite der Kieze eines Bezirks. */
export function spread<T>(
	items: readonly T[],
	valueOf: (item: T) => number | null
): { min: T; max: T; range: number } | null {
	const withValue = items
		.map((item) => ({ item, v: valueOf(item) }))
		.filter((e): e is { item: T; v: number } => e.v !== null && Number.isFinite(e.v));
	if (withValue.length < 2) return null;
	withValue.sort((a, b) => a.v - b.v);
	const lo = withValue[0];
	const hi = withValue[withValue.length - 1];
	return { min: lo.item, max: hi.item, range: hi.v - lo.v };
}

/** Achsenbereich, auf `step` nach außen gerundet. */
export function niceDomain(values: readonly (number | null)[], step: number): [number, number] {
	const xs = present(values);
	if (xs.length === 0) return [0, step];
	return [Math.floor(Math.min(...xs) / step) * step, Math.ceil(Math.max(...xs) / step) * step];
}

/** Wie viele Werte genau 0 sind. Große Nullstapel (Milieuschutz) machen den Median zu 0. */
export function zeroShare(values: readonly (number | null)[]): {
	zeros: number;
	total: number;
	share: number;
} {
	const xs = present(values);
	const zeros = xs.filter((v) => v === 0).length;
	return { zeros, total: xs.length, share: xs.length === 0 ? 0 : zeros / xs.length };
}

/** Häufigste Kategorie, etwa die überwiegende Lärmklasse unter allen Kiezen. */
export function mostCommon(labels: readonly (string | null)[]): string | null {
	const counts = new Map<string, number>();
	for (const l of labels) if (l !== null) counts.set(l, (counts.get(l) ?? 0) + 1);
	let best: string | null = null;
	for (const [l, n] of counts) if (best === null || n > (counts.get(best) ?? 0)) best = l;
	return best;
}

/** Ab 10 Nullwerten und 20 % Anteil bekommen Nullwerte einen eigenen Block, der Median lässt sie aus. */
export function splitsZeros(values: readonly (number | null)[]): boolean {
	const z = zeroShare(values);
	return z.zeros >= 10 && z.share >= 0.2;
}

export function zeroAwareMedian(
	values: readonly (number | null)[],
	/** Nur bei Kennzahlen, deren Nullen nichts aussagen (Milieuschutz); echte Nullen zählen mit. */
	zeroPile = true
): {
	value: number | null;
	zerosLeftOut: number;
} {
	if (!zeroPile || !splitsZeros(values)) return { value: median(values), zerosLeftOut: 0 };
	return {
		value: median(values.filter((v) => v !== 0)),
		zerosLeftOut: zeroShare(values).zeros
	};
}
