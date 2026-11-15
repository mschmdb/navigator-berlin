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

/** Platz absteigend (1 = höchster Wert), Gleichstand teilt sich den Platz. */
export function rankOf(
	value: number | null,
	values: readonly (number | null)[]
): { rang: number; total: number } | null {
	if (value === null || !Number.isFinite(value)) return null;
	const xs = present(values);
	return { rang: xs.filter((v) => v > value).length + 1, total: xs.length };
}

export function countBelow(value: number | null, values: readonly (number | null)[]): number | null {
	if (value === null || !Number.isFinite(value)) return null;
	return present(values).filter((v) => v < value).length;
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
