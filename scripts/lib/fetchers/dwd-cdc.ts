import AdmZip from 'adm-zip';
import { defaultHeaders } from '../user-agent.js';
import { assertAllowed } from '../allowlist.js';
import { withRetry } from '../retry.js';

const DWD_BASE =
	'https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/daily/kl';

export function buildDwdZipUrl(stationId: string, kind: 'historical' | 'recent'): string {
	const padded = stationId.padStart(5, '0');
	return `${DWD_BASE}/${kind}/tageswerte_KL_${padded}_${kind === 'historical' ? 'hist' : 'akt'}.zip`;
}

export async function fetchDwdZip(stationId: string, kind: 'historical' | 'recent'): Promise<Buffer> {
	const url = buildDwdZipUrl(stationId, kind);
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
