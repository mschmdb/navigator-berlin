import { gridIdToCenter } from './grid-id.js';
import type { Bbox3035 } from './parse-miete-csv.js';

export interface AltbauCell {
	/** Zellmittelpunkt EPSG:3035. */
	readonly x: number;
	readonly y: number;
	readonly wohnungen: number;
	/** Wohnungen in Gebaeuden mit Baujahr vor 1949 (vor_1919 + a1919_bis_1948). */
	readonly altbau: number;
}

/** Zaehler fuer Zellen, die das Cell-Key-Rauschen inkonsistent macht. */
export interface AltbauParseStats {
	/** Altbau > Gesamtwohnungen: Altbau auf die Zellsumme gekappt. */
	clamped: number;
	/** Gesamtwohnungen 0, aber Altbau > 0: Zelle verworfen. */
	dropped: number;
}

const COL = {
	id: 'GITTER_ID_100m',
	wohnungen: 'Insgesamt_Wohnungen',
	vor1919: 'vor_1919',
	bis1948: 'a1919_bis_1948'
} as const;

function requireColumn(header: readonly string[], name: string): number {
	const idx = header.indexOf(name);
	if (idx === -1) throw new Error(`Zensus-Altbau-CSV: Spalte ${name} fehlt`);
	return idx;
}

/** Destatis schreibt "–" (en dash) fuer 0. */
function parseCount(raw: string | undefined, column: string, line: number): number {
	const text = (raw ?? '').trim();
	if (text === '–' || text === '-') return 0;
	const n = Number(text);
	if (text === '' || !Number.isInteger(n) || n < 0) {
		throw new Error(`Zensus-Altbau-CSV: Spalte ${column} Zeile ${line} nicht lesbar: "${text}"`);
	}
	return n;
}

/**
 * Parst die Destatis-Baujahres-CSV (UTF-8, Semikolon). Mit `bbox` fallen Zellen ausserhalb
 * frueh weg (bundesweit ~2,6 Mio. Zeilen).
 */
export function parseAltbauCsv(
	raw: Uint8Array,
	bbox?: Bbox3035,
	stats?: AltbauParseStats
): AltbauCell[] {
	const lines = new TextDecoder('utf-8').decode(raw).split(/\r?\n/);
	const header = (lines[0] ?? '')
		.replace(/^﻿/, '')
		.split(';')
		.map((h) => h.trim());
	const iId = requireColumn(header, COL.id);
	const iW = requireColumn(header, COL.wohnungen);
	const i1 = requireColumn(header, COL.vor1919);
	const i2 = requireColumn(header, COL.bis1948);

	const cells: AltbauCell[] = [];
	for (let li = 1; li < lines.length; li++) {
		const line = lines[li];
		if (line.trim() === '') continue;
		const parts = line.split(';');
		const { x, y } = gridIdToCenter(parts[iId] ?? '');
		if (bbox && (x < bbox.minX || x > bbox.maxX || y < bbox.minY || y > bbox.maxY)) continue;
		const wohnungen = parseCount(parts[iW], COL.wohnungen, li + 1);
		const altbau =
			parseCount(parts[i1], COL.vor1919, li + 1) + parseCount(parts[i2], COL.bis1948, li + 1);
		if (altbau > wohnungen) {
			if (wohnungen === 0) {
				if (stats) stats.dropped += 1;
				continue;
			}
			if (stats) stats.clamped += 1;
		}
		cells.push({ x, y, wohnungen, altbau: Math.min(altbau, wohnungen) });
	}
	return cells;
}
