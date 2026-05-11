export const BUILD_TIME_ALLOWLIST = [
	'fbinter.stadt-berlin.de',
	'gdi.berlin.de',
	'daten.odis-berlin.de',
	'daten.berlin.de',
	'opendata.dwd.de',
	'overpass-api.de',
	'overpass.kumi.systems'
] as const;

export function isAllowed(url: string): boolean {
	let host: string;
	try {
		host = new URL(url).hostname;
	} catch {
		return false;
	}
	return BUILD_TIME_ALLOWLIST.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export function assertAllowed(url: string): void {
	if (!isAllowed(url)) {
		throw new Error(`URL not on build-time allowlist: ${url}`);
	}
}
