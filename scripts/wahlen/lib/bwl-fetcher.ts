import AdmZip from 'adm-zip';
import { defaultHeaders } from '../../lib/user-agent.js';
import { assertAllowed } from '../../lib/allowlist.js';
import { withRetry } from '../../lib/retry.js';

export const BWL_BTW25_WBZ_CSV_NAME = 'btw25_wbz_ergebnisse.csv';

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

export function detectEncoding(buf: Buffer): 'utf-8' | 'latin1' {
	if (buf.length >= 3 && buf.subarray(0, 3).equals(UTF8_BOM)) return 'utf-8';
	const sample = buf.subarray(0, Math.min(buf.length, 4096));
	let invalid = 0;
	let i = 0;
	while (i < sample.length) {
		const b = sample[i];
		if (b < 0x80) {
			i++;
			continue;
		}
		let len = 0;
		if ((b & 0xe0) === 0xc0) len = 2;
		else if ((b & 0xf0) === 0xe0) len = 3;
		else if ((b & 0xf8) === 0xf0) len = 4;
		else {
			invalid++;
			i++;
			continue;
		}
		let ok = true;
		for (let k = 1; k < len; k++) {
			if (i + k >= sample.length || (sample[i + k] & 0xc0) !== 0x80) {
				ok = false;
				break;
			}
		}
		if (!ok) invalid++;
		i += len;
	}
	return invalid > 2 ? 'latin1' : 'utf-8';
}

export function decodeBuffer(buf: Buffer): string {
	const enc = detectEncoding(buf);
	return buf.toString(enc);
}

export function findBwlWbzCsvEntry(zip: Buffer): string {
	const archive = new AdmZip(zip);
	const entry = archive.getEntries().find((e) => /_wbz_ergebnisse\.csv$/i.test(e.entryName));
	if (!entry) {
		throw new Error('Bundeswahlleiterin-ZIP: ergebnisse.csv entry not found');
	}
	return entry.entryName;
}

export function extractBwlWbzCsv(zip: Buffer): string {
	const archive = new AdmZip(zip);
	const entry = archive.getEntries().find((e) => /_wbz_ergebnisse\.csv$/i.test(e.entryName));
	if (!entry) {
		throw new Error('Bundeswahlleiterin-ZIP: ergebnisse.csv entry not found');
	}
	return decodeBuffer(entry.getData());
}

export type BwlExtracted =
	| { mode: 'combined'; csv: string }
	| { mode: 'split'; erst: string; zweit: string };

const PATTERN_COMBINED = /_wbz_ergebnisse\.csv$/i;
const PATTERN_ERST = /(_wbz_erststimmen\.csv|_erststimmen_wahlbezirke\.csv)$/i;
const PATTERN_ZWEIT = /(_wbz_zweitstimmen\.csv|_zweitstimmen_wahlbezirke\.csv)$/i;

export function extractBwlCsvs(zip: Buffer): BwlExtracted {
	const archive = new AdmZip(zip);
	const entries = archive.getEntries();

	const combined = entries.find((e) => PATTERN_COMBINED.test(e.entryName));
	if (combined) {
		return { mode: 'combined', csv: decodeBuffer(combined.getData()) };
	}

	const erst = entries.find((e) => PATTERN_ERST.test(e.entryName));
	const zweit = entries.find((e) => PATTERN_ZWEIT.test(e.entryName));
	if (erst && zweit) {
		return {
			mode: 'split',
			erst: decodeBuffer(erst.getData()),
			zweit: decodeBuffer(zweit.getData())
		};
	}

	throw new Error(
		'Bundeswahlleiterin-ZIP: neither combined ergebnisse.csv nor erst+zweit split CSVs found'
	);
}

export async function fetchBwlZip(url: string): Promise<Buffer> {
	assertAllowed(url);
	return withRetry(async () => {
		const res = await fetch(url, { headers: defaultHeaders() });
		if (!res.ok) throw new Error(`Bundeswahlleiterin ${url} HTTP ${res.status}`);
		const arrBuf = await res.arrayBuffer();
		return Buffer.from(arrBuf);
	});
}
