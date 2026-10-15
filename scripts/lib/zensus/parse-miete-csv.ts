export interface MieteCell {
	/** Zellmittelpunkt EPSG:3035. */
	readonly x: number;
	readonly y: number;
	/** Durchschnittliche Nettokaltmiete EUR/m2. */
	readonly mieteQm: number;
	readonly wohnungen: number;
	/** Destatis-Flag: relativer Fehler > 15 %. Geht ins Gebietsmittel ein, nie als Einzelwert. */
	readonly klammern: boolean;
}

export interface Bbox3035 {
	readonly minX: number;
	readonly maxX: number;
	readonly minY: number;
	readonly maxY: number;
}

const COL = {
	x: 'x_mp_100m',
	y: 'y_mp_100m',
	miete: 'durchschnMieteQM',
	wohnungen: 'AnzahlWohnungen',
	zeichen: 'werterlaeuternde_Zeichen'
} as const;

function requireColumn(header: readonly string[], name: string): number {
	const idx = header.indexOf(name);
	if (idx === -1) throw new Error(`Zensus-Miete-CSV: Spalte ${name} fehlt`);
	return idx;
}

function parseNumber(raw: string | undefined, column: string, line: number): number {
	const text = (raw ?? '').trim().replace(',', '.');
	const n = Number(text);
	if (text === '' || !Number.isFinite(n)) {
		throw new Error(
			`Zensus-Miete-CSV: Spalte ${column} Zeile ${line} nicht lesbar: "${raw ?? ''}"`
		);
	}
	return n;
}

/**
 * Parst die Destatis-100m-CSV (Windows-1252, Semikolon, Dezimalkomma).
 * Mit `bbox` werden Zellen ausserhalb frueh verworfen (Speicher: ~1,2 Mio. Zeilen bundesweit).
 */
export function parseMieteCsv(raw: Uint8Array, bbox?: Bbox3035): MieteCell[] {
	const text = new TextDecoder('windows-1252').decode(raw);
	const lines = text.split(/\r?\n/);
	const header = (lines[0] ?? '').split(';').map((h) => h.trim());
	const ix = requireColumn(header, COL.x);
	const iy = requireColumn(header, COL.y);
	const im = requireColumn(header, COL.miete);
	const iw = requireColumn(header, COL.wohnungen);
	const iz = requireColumn(header, COL.zeichen);

	const cells: MieteCell[] = [];
	for (let li = 1; li < lines.length; li++) {
		const line = lines[li];
		if (line.trim() === '') continue;
		const parts = line.split(';');
		const x = parseNumber(parts[ix], COL.x, li + 1);
		const y = parseNumber(parts[iy], COL.y, li + 1);
		if (bbox && (x < bbox.minX || x > bbox.maxX || y < bbox.minY || y > bbox.maxY)) continue;
		cells.push({
			x,
			y,
			mieteQm: parseNumber(parts[im], COL.miete, li + 1),
			wohnungen: parseNumber(parts[iw], COL.wohnungen, li + 1),
			klammern: (parts[iz] ?? '').trim() === 'KLAMMERN'
		});
	}
	return cells;
}
