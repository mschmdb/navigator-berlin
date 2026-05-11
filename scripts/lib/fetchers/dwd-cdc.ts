import AdmZip from 'adm-zip';
import { defaultHeaders } from '../user-agent.js';
import { assertAllowed } from '../allowlist.js';
import { withRetry } from '../retry.js';

const DWD_BASE =
	'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl';

export function buildDwdDirUrl(kind: 'historical' | 'recent'): string {
	return `${DWD_BASE}/${kind}/`;
}

export function buildDwdZipUrlSimple(stationId: string, kind: 'historical' | 'recent'): string {
	const padded = stationId.padStart(5, '0');
	return `${DWD_BASE}/${kind}/tageswerte_KL_${padded}_${kind === 'historical' ? 'hist' : 'akt'}.zip`;
}

// Historical-DWD-ZIPs haben Date-Range im Filename, also via Directory-Listing matchen.
// Recent-ZIPs nutzen festen `_akt`-Suffix.
export async function resolveDwdZipUrl(
	stationId: string,
	kind: 'historical' | 'recent'
): Promise<string> {
	if (kind === 'recent') return buildDwdZipUrlSimple(stationId, kind);
	const padded = stationId.padStart(5, '0');
	const dirUrl = buildDwdDirUrl(kind);
	assertAllowed(dirUrl);
	const res = await fetch(dirUrl, { headers: defaultHeaders() });
	if (!res.ok) throw new Error(`DWD dir-listing ${kind} HTTP ${res.status}`);
	const html = await res.text();
	const regex = new RegExp(`tageswerte_KL_${padded}_\\d+_\\d+_hist\\.zip`);
	const match = html.match(regex);
	if (!match) throw new Error(`DWD historical ZIP for station ${padded} not found`);
	return `${dirUrl}${match[0]}`;
}

export async function fetchDwdZip(
	stationId: string,
	kind: 'historical' | 'recent'
): Promise<Buffer> {
	const url = await resolveDwdZipUrl(stationId, kind);
	assertAllowed(url);
	return withRetry(async () => {
		const res = await fetch(url, { headers: defaultHeaders() });
		if (!res.ok) throw new Error(`DWD ${stationId} ${kind} HTTP ${res.status}`);
		const arrBuf = await res.arrayBuffer();
		return Buffer.from(arrBuf);
	});
}

export function extractProduktTageswerteCsv(zip: Buffer): string {
	const archive = new AdmZip(zip);
	const entry = archive.getEntries().find((e) => e.entryName.startsWith('produkt_klima_tag_'));
	if (!entry) throw new Error('produkt_klima_tag_*.txt not found in DWD ZIP');
	return entry.getData().toString('utf-8');
}
