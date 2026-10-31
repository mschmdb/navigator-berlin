import { gridIdToCenter } from '../zensus/grid-id.js';
import type { Bbox3035 } from '../zensus/parse-miete-csv.js';

export interface BevoelkerungCell {
	/** Zellmittelpunkt EPSG:3035. */
	readonly x: number;
	readonly y: number;
	readonly einwohner: number;
}

const COL = { id: 'GITTER_ID_100m', einwohner: 'Einwohner' } as const;

function requireColumn(header: readonly string[], name: string): number {
	const idx = header.indexOf(name);
	if (idx === -1) throw new Error(`Zensus-Bevoelkerung-CSV: Spalte ${name} fehlt`);
	return idx;
}

function parseCount(raw: string | undefined, line: number): number {
	const text = (raw ?? '').trim();
	if (text === '–' || text === '-') return 0;
	const n = Number(text);
	if (text === '' || !Number.isInteger(n) || n < 0) {
		throw new Error(
			`Zensus-Bevoelkerung-CSV: Spalte Einwohner Zeile ${line} nicht lesbar: "${text}"`
		);
	}
	return n;
}

/** Parst das Destatis-Bevoelkerungsgitter (UTF-8, Semikolon). `bbox` verwirft fremde Zellen frueh. */
export function parseBevoelkerungCsv(raw: Uint8Array, bbox?: Bbox3035): BevoelkerungCell[] {
	const lines = new TextDecoder('utf-8').decode(raw).split(/\r?\n/);
	const header = (lines[0] ?? '')
		.replace(/^﻿/, '')
		.split(';')
		.map((h) => h.trim());
	const iId = requireColumn(header, COL.id);
	const iE = requireColumn(header, COL.einwohner);

	const cells: BevoelkerungCell[] = [];
	for (let li = 1; li < lines.length; li++) {
		const line = lines[li];
		if (line.trim() === '') continue;
		const parts = line.split(';');
		const { x, y } = gridIdToCenter(parts[iId] ?? '');
		if (bbox && (x < bbox.minX || x > bbox.maxX || y < bbox.minY || y > bbox.maxY)) continue;
		cells.push({ x, y, einwohner: parseCount(parts[iE], li + 1) });
	}
	return cells;
}
