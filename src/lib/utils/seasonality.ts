export interface Seasonality {
	from: string;
	to: string;
}

function toMmDd(d: Date): string {
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${m}-${day}`;
}

export function isInSeason(s: Seasonality, now: Date = new Date()): boolean {
	const mmdd = toMmDd(now);
	if (s.from <= s.to) return mmdd >= s.from && mmdd <= s.to;
	return mmdd >= s.from || mmdd <= s.to;
}
