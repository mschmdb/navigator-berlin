import type { EinwohnerRow } from './einwohner.js';

/**
 * Parst die EWR-Matrix-CSV (Amt für Statistik). Semikolon-getrennt, UTF-8 BOM,
 * CRLF. Header case-insensitiv. RAUMID = 8-stelliger Join-Key, E_E = gesamt,
 * alle E_E*-Spalten landen als Altersdaten in `ages`. Story 10.0.
 */
export function parseEinwohnerCsv(raw: string): EinwohnerRow[] {
	const text = raw.replace(/^﻿/, '');
	const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
	if (lines.length < 2) return [];

	const header = lines[0].split(';').map((h) => h.trim().toUpperCase());
	const idxRaumid = header.indexOf('RAUMID');
	const idxGesamt = header.indexOf('E_E');
	if (idxRaumid === -1 || idxGesamt === -1) {
		throw new Error('parseEinwohnerCsv: RAUMID oder E_E Spalte fehlt');
	}
	const ageCols = header
		.map((name, i) => ({ name, i }))
		.filter((c) => c.name.startsWith('E_E') && c.name !== 'E_E');

	const rows: EinwohnerRow[] = [];
	for (let li = 1; li < lines.length; li++) {
		const cells = lines[li].split(';');
		const lorId = (cells[idxRaumid] ?? '').trim();
		if (!/^\d{8}$/.test(lorId)) continue;
		const ages: Record<string, number> = {};
		for (const col of ageCols) ages[col.name] = toInt(cells[col.i]);
		rows.push({ lorId, gesamt: toInt(cells[idxGesamt]), ages });
	}
	return rows;
}

function toInt(cell: string | undefined): number {
	if (cell === undefined) return 0;
	const trimmed = cell.trim();
	if (trimmed === '') return 0;
	const n = Number.parseInt(trimmed, 10);
	return Number.isFinite(n) ? n : 0;
}
