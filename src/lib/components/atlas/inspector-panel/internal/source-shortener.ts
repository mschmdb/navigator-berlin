import type { License } from '$lib/data';

const SOURCE_SHORT_BY_PREFIX: ReadonlyArray<readonly [string, string]> = [
	['https://fbinter.stadt-berlin.de', 'FIS-Broker'],
	['https://daten.odis-berlin.de', 'ODIS Berlin'],
	['https://daten.berlin.de', 'ODIS Berlin'],
	['https://opendata.dwd.de', 'DWD'],
	['https://overpass-api.de', 'OpenStreetMap']
];

export function shortenSource(url: string): string {
	for (const [prefix, short] of SOURCE_SHORT_BY_PREFIX) {
		if (url.startsWith(prefix)) return short;
	}
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}

const LICENSE_SHORT: Record<License, string> = {
	'dl-de/zero-2-0': 'dl-de/zero',
	'dl-de/by-2-0': 'dl-de/by',
	'CC BY 4.0': 'CC BY',
	'ODbL 1.0': 'ODbL',
	Geodatenzugangsgesetz: 'GeoZG'
};

export function shortenLicense(license: License): string {
	return LICENSE_SHORT[license] ?? license;
}

const TWO_YEARS_MS = 1000 * 60 * 60 * 24 * 365 * 2;

export function isOutdated(updatedAt: string, now: Date = new Date()): boolean {
	const updated = new Date(updatedAt).getTime();
	if (Number.isNaN(updated)) return false;
	return now.getTime() - updated > TWO_YEARS_MS;
}

export function formatYearMonth(updatedAt: string): string {
	const d = new Date(updatedAt);
	if (Number.isNaN(d.getTime())) return updatedAt;
	const year = d.getUTCFullYear();
	const month = String(d.getUTCMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}
