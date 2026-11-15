export type DiffClass = 'hoeher' | 'niedriger' | 'gleich';

export interface DimDiff<D extends string = string> {
	readonly dim: D;
	readonly own: number;
	readonly ref: number;
	readonly diff: number;
}

/** Unter 5 Punkten Abstand gilt ein Wert als etwa gleich: kleiner als die Messunschärfe der Scores. */
export const SAME_BAND = 5;

export function classifyDiff(diff: number): DiffClass {
	if (diff >= SAME_BAND) return 'hoeher';
	if (diff <= -SAME_BAND) return 'niedriger';
	return 'gleich';
}

export function dimDiffs<D extends string>(
	dims: readonly D[],
	own: Readonly<Record<D, number | null>>,
	ref: Readonly<Record<D, number | null>>
): DimDiff<D>[] {
	const out: DimDiff<D>[] = [];
	for (const dim of dims) {
		const o = own[dim];
		const r = ref[dim];
		if (o === null || r === null) continue;
		out.push({ dim, own: o, ref: r, diff: o - r });
	}
	return out;
}

export function joinDe(items: readonly string[]): string {
	if (items.length <= 1) return items[0] ?? '';
	return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
}

export function signedPoints(diff: number): string {
	const n = Math.round(diff);
	if (n === 0) return '±0';
	return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

/** „Gegenüber Berlin höher bei A (+9), niedriger bei B (−7). Etwa gleich: C.“ */
export function compareSentence<D extends string>(
	diffs: readonly DimDiff<D>[],
	labelOf: (dim: D) => string,
	refLabel: string
): string {
	if (diffs.length === 0) return '';
	const bySize = [...diffs].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
	const named = (d: DimDiff<D>) => `${labelOf(d.dim)} (${signedPoints(d.diff)})`;
	const higher = bySize.filter((d) => classifyDiff(d.diff) === 'hoeher').map(named);
	const lower = bySize.filter((d) => classifyDiff(d.diff) === 'niedriger').map(named);
	const same = diffs.filter((d) => classifyDiff(d.diff) === 'gleich').map((d) => labelOf(d.dim));

	const parts: string[] = [];
	if (higher.length > 0) parts.push(`höher bei ${joinDe(higher)}`);
	if (lower.length > 0) parts.push(`niedriger bei ${joinDe(lower)}`);
	if (parts.length === 0) return `Gegenüber ${refLabel} etwa gleich bei ${joinDe(same)}.`;
	const head = `Gegenüber ${refLabel} ${parts.join(', ')}.`;
	return same.length > 0 ? `${head} Etwa gleich: ${joinDe(same)}.` : head;
}
