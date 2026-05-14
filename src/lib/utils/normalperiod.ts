import type { YearValue } from '$lib/data';

export const NORMAL_OLD = { from: 1961, to: 1990 } as const;
export const NORMAL_NEW = { from: 1991, to: 2020 } as const;

export interface NumericYearPoint {
	readonly year: number;
	readonly value: number;
}

export type YearValueField = 'count' | 'temp';

export function yearValuesToNumeric(
	values: readonly YearValue[] | undefined,
	field: YearValueField
): NumericYearPoint[] {
	if (!values) return [];
	const out: NumericYearPoint[] = [];
	for (const v of values) {
		const raw = v[field];
		if (typeof raw === 'number' && Number.isFinite(raw)) {
			out.push({ year: v.year, value: raw });
		}
	}
	return out;
}

export function getNormalperiodMean(
	points: readonly NumericYearPoint[],
	from: number,
	to: number
): number | null {
	let sum = 0;
	let n = 0;
	for (const p of points) {
		if (p.year >= from && p.year <= to) {
			sum += p.value;
			n += 1;
		}
	}
	return n === 0 ? null : sum / n;
}
