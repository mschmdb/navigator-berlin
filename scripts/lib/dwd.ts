import { parse } from 'csv-parse/sync';

export interface DailyRecord {
	date: string;
	txk: number | null;
	tnk: number | null;
	tmk: number | null;
}

export interface YearlyCount {
	year: number;
	count: number;
}

export interface YearlyAggregation {
	summerDays: YearlyCount[];
	frostDays: YearlyCount[];
	hotDays: YearlyCount[];
}

const SENTINEL = -999;

function toNumberOrNull(raw: string): number | null {
	const n = parseFloat(raw.trim());
	if (Number.isNaN(n) || n === SENTINEL) return null;
	return n;
}

function toIsoDate(mess: string): string {
	const y = mess.slice(0, 4);
	const m = mess.slice(4, 6);
	const d = mess.slice(6, 8);
	return `${y}-${m}-${d}`;
}

export function parseDwdKlCsv(csv: string): DailyRecord[] {
	const rows = parse(csv, {
		delimiter: ';',
		columns: true,
		trim: true,
		skip_empty_lines: true,
		relax_column_count: true
	}) as Array<Record<string, string>>;

	const records: DailyRecord[] = [];
	for (const row of rows) {
		const messRaw = row.MESS_DATUM;
		if (!messRaw) continue;
		const mess = messRaw.trim();
		if (!/^\d{8}$/.test(mess)) continue;
		records.push({
			date: toIsoDate(mess),
			txk: toNumberOrNull(row.TXK ?? ''),
			tnk: toNumberOrNull(row.TNK ?? ''),
			tmk: toNumberOrNull(row.TMK ?? '')
		});
	}
	return records;
}

function countPerYear(
	records: DailyRecord[],
	predicate: (r: DailyRecord) => boolean
): YearlyCount[] {
	const map = new Map<number, number>();
	for (const r of records) {
		const year = parseInt(r.date.slice(0, 4), 10);
		if (!map.has(year)) map.set(year, 0);
		if (predicate(r)) map.set(year, map.get(year)! + 1);
	}
	return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }));
}

export function aggregateYearly(records: DailyRecord[]): YearlyAggregation {
	return {
		summerDays: countPerYear(records, (r) => r.txk !== null && r.txk >= 25.0),
		frostDays: countPerYear(records, (r) => r.tnk !== null && r.tnk < 0.0),
		hotDays: countPerYear(records, (r) => r.txk !== null && r.txk >= 30.0)
	};
}
