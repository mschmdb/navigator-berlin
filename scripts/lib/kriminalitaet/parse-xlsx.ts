/**
 * Story 14.0 · Kriminalitätsatlas-XLSX-Parse.
 *
 * Parst die HZ-Sheets (Häufigkeitszahl pro 100.000 Einwohner) des
 * Kriminalitätsatlas Berlin (Polizei Berlin, dl-de-by-2.0). Der Header steht
 * nicht zeilenfix (in der Quelldatei Zeile 5), darum wird er dynamisch über die
 * erste Spalte „LOR-Schlüssel (Bezirksregion)" gesucht. Delikt-Spalten tragen
 * Silbentrennungs-Artefakte (z.B. `Fahrrad- diebstahl`), darum matcht der Parser
 * über eine kanonisierte Form statt über Exakt-Strings.
 *
 * Quelle: docs/kriminalitaetsdaten-methodik.md, ADR-019.
 */

/** Eine Roh-Zelle aus `XLSX.utils.sheet_to_json({ header: 1 })`. */
export type SheetCell = string | number | null;
export type SheetRow = SheetCell[];

export interface DeliktSpec {
	/** Stabiler Schlüssel im Output (ascii, snake-frei). */
	readonly key: string;
	/** Kanonisierte Header-Form für den Spalten-Match. */
	readonly canonical: string;
	/** Lesbare Bezeichnung (Inspector/Doku). */
	readonly label: string;
}

export interface BrHzRow {
	/** 6-stelliger LOR-Schlüssel der Bezirksregion. */
	readonly bzrId: string;
	readonly name: string;
	/** HZ je Delikt-Key; `null` = unterdrückt/nicht vorhanden. */
	readonly hz: Record<string, number | null>;
}

/**
 * Kanonisiert einen Header für robustes Matching: Kleinschreibung, dann alle
 * Whitespaces, Bindestriche, Kommata und Slashes entfernt. Das eliminiert die
 * Silbentrennung der Quelle, hält aber `-insgesamt-` von `durch Graffiti`
 * unterscheidbar (Wort-Stamm bleibt erhalten).
 */
export function canonicalizeDelikt(value: string): string {
	return value.toLowerCase().replace(/[\s\-,/]/g, '');
}

/**
 * Wohn-relevantes Default-Delikt-Set (ADR-019, Methodik-Empfehlung).
 * Die finalen Gewichte setzt Story 14.1; hier nur Spalten-Auswahl + Schlüssel.
 */
export const DEFAULT_DELIKTE: readonly DeliktSpec[] = [
	{ key: 'kieztaten', canonical: canonicalizeDelikt('Kieztaten'), label: 'Kieztaten' },
	{
		key: 'wohnraumeinbruch',
		canonical: canonicalizeDelikt('Wohnraumeinbruch'),
		label: 'Wohnraumeinbruch'
	},
	{
		key: 'sachbeschaedigung',
		canonical: canonicalizeDelikt('Sachbeschädigung -insgesamt-'),
		label: 'Sachbeschädigung insgesamt'
	},
	{
		key: 'strassenraub',
		canonical: canonicalizeDelikt('Straßenraub Handtaschenraub'),
		label: 'Straßenraub/Handtaschenraub'
	},
	{
		key: 'fahrraddiebstahl',
		canonical: canonicalizeDelikt('Fahrraddiebstahl'),
		label: 'Fahrraddiebstahl'
	}
] as const;

const HEADER_FIRST_CELL = canonicalizeDelikt('LOR-Schlüssel (Bezirksregion)');

/**
 * Echte Bezirksregion: 6-stelliger Schlüssel, der weder Bezirk (`XX0000`),
 * Bezirks-„nicht zuzuordnen" (`XX9900`) noch Berlin-Aggregat (`9999XX`) ist.
 */
export function isBezirksregionKey(key: string): boolean {
	if (!/^\d{6}$/.test(key)) return false;
	if (key.startsWith('9999')) return false; // 999900 / 999999
	const tail = key.slice(2); // BR-/Bezirks-Anteil
	if (tail === '0000') return false; // Bezirk
	if (tail === '9900') return false; // Bezirk nicht zuzuordnen
	return true;
}

export interface HzSheet {
	readonly name: string;
	readonly year: number;
}

/** Alle `HZ_YYYY`-Sheets mit geparstem Jahr, aufsteigend sortiert. */
export function listHzSheetNames(sheetNames: readonly string[]): HzSheet[] {
	const out: HzSheet[] = [];
	for (const name of sheetNames) {
		const m = /^HZ_(\d{4})$/.exec(name);
		if (m) out.push({ name, year: Number(m[1]) });
	}
	return out.sort((a, b) => a.year - b.year);
}

/** Die drei jüngsten HZ-Sheet-Namen (älteste zuerst). */
export function latestThreeHzSheetNames(sheetNames: readonly string[]): string[] {
	const hz = listHzSheetNames(sheetNames);
	if (hz.length < 3) {
		throw new Error(`Kriminalitätsatlas: weniger als drei HZ-Sheets gefunden (${hz.length}).`);
	}
	return hz.slice(-3).map((s) => s.name);
}

function findHeaderIndex(aoa: readonly SheetRow[]): number {
	return aoa.findIndex((row) => canonicalizeDelikt(String(row?.[0] ?? '')) === HEADER_FIRST_CELL);
}

function parseHzCell(cell: SheetCell): number | null {
	if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
	if (typeof cell === 'string') {
		const trimmed = cell.trim();
		if (trimmed === '' || trimmed === '-') return null;
		const n = Number(trimmed.replace(',', '.'));
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

/**
 * Parst ein HZ-Sheet (als array-of-arrays) zu Bezirksregions-Zeilen mit den
 * ausgewählten Delikt-HZ. Bezirks-, „nicht zuzuordnen"- und Berlin-Zeilen
 * werden ausgeschlossen, `-`-Zellen werden `null`.
 */
export function parseHzSheet(aoa: readonly SheetRow[], delikte: readonly DeliktSpec[]): BrHzRow[] {
	const headerIdx = findHeaderIndex(aoa);
	if (headerIdx === -1) {
		throw new Error('Kriminalitätsatlas: Header-Zeile („LOR-Schlüssel") nicht gefunden.');
	}
	const header = (aoa[headerIdx] ?? []).map((c) => canonicalizeDelikt(String(c ?? '')));

	// Delikt-Key -> Spalten-Index.
	const colByKey = new Map<string, number>();
	for (const spec of delikte) {
		const idx = header.findIndex((h) => h === spec.canonical);
		if (idx === -1) {
			throw new Error(`Kriminalitätsatlas: Delikt-Spalte "${spec.label}" nicht im Header gefunden.`);
		}
		colByKey.set(spec.key, idx);
	}

	const rows: BrHzRow[] = [];
	for (let i = headerIdx + 1; i < aoa.length; i++) {
		const row = aoa[i] ?? [];
		const bzrId = String(row[0] ?? '').trim();
		if (!isBezirksregionKey(bzrId)) continue;
		const name = String(row[1] ?? '').trim();
		const hz: Record<string, number | null> = {};
		for (const spec of delikte) {
			hz[spec.key] = parseHzCell(row[colByKey.get(spec.key) as number]);
		}
		rows.push({ bzrId, name, hz });
	}
	return rows;
}
