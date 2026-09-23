/**
 * Parent-Wahl-Lookup für Wiederholungswahlen (Story: Ingest AGH/BVV 2026,
 * Bugfix `parent_election_id`).
 *
 * Der bisherige Lookup in `aggregate-wahl-data.ts` filterte nur nach
 * `jahr`+`typ`, nicht nach `stimmtyp`, und lief einmal pro Quelle statt
 * einmal pro Stimmtyp. Bei AGH (2 Stimmtypen je Quelle) traf `LIMIT 1` damit
 * nicht-deterministisch eine der beiden Eltern-Rows -- die AGH-Zweitstimme
 * 2023 zeigte dadurch teils auf die Erststimme-Row von AGH 2021 statt auf
 * deren eigene Zweitstimme-Row.
 */
import { eq, and } from 'drizzle-orm';
import type { Db } from '../../../src/lib/server/db/index.js';
import { wahl as wahlTable } from '../../../src/lib/server/db/schema/index.js';
import type { StimmtypKey } from './row-transformer.js';

export type ParsedParentSlug = { readonly typ: 'btw' | 'agh' | 'bvv'; readonly jahr: number };

export function parseParentSlug(parentSlug: string): ParsedParentSlug | null {
	const m = parentSlug.match(/^(btw|agh|bvv)(\d{2})$/);
	if (!m) return null;
	return { typ: m[1] as 'btw' | 'agh' | 'bvv', jahr: 2000 + Number.parseInt(m[2], 10) };
}

/** Kandidaten-Row-Shape für `selectParentWahlId` -- Subset der `wahl`-Spalten. */
export type ParentCandidateRow = {
	readonly id: number;
	readonly jahr: number;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: StimmtypKey | 'einstimme';
};

/**
 * Pure Auswahl-Funktion (kein DB-Zugriff, direkt testbar): wählt aus einer
 * Liste von Kandidaten-Rows für dieselbe Eltern-Jahr+Typ-Kombination die Row
 * mit PASSENDEM `stimmtyp`. Das ist der eigentliche Bugfix -- die alte
 * Implementierung filterte nur nach `jahr`+`typ` und nahm per `LIMIT 1`
 * nicht-deterministisch die erste Row, unabhängig vom `stimmtyp` (agh23
 * Zweitstimme zeigte dadurch teils auf agh21 Erststimme).
 */
export function selectParentWahlId(
	candidates: readonly ParentCandidateRow[],
	parentSlug: string,
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: StimmtypKey | 'einstimme'
): number | undefined {
	const parsed = parseParentSlug(parentSlug);
	if (!parsed || parsed.typ !== typ) return undefined;
	const match = candidates.find(
		(c) => c.jahr === parsed.jahr && c.typ === typ && c.stimmtyp === stimmtyp
	);
	return match?.id;
}

/**
 * Findet die `wahl.id` der Eltern-Wahl für einen gegebenen `stimmtyp`.
 * Muss pro Stimmtyp separat aufgerufen werden (nicht einmal pro Quelle),
 * sonst matcht die Auswahl nicht-deterministisch die falsche Stimmtyp-Row
 * der Eltern-Wahl. Die SQL-Query filtert bewusst nur nach `jahr`+`typ`
 * (typischerweise 2-3 Rows), die eigentliche `stimmtyp`-Auswahl passiert in
 * der pure-testbaren `selectParentWahlId`.
 */
export async function lookupParentWahlId(
	db: Db,
	parentSlug: string,
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: StimmtypKey | 'einstimme'
): Promise<number | undefined> {
	const parsed = parseParentSlug(parentSlug);
	if (!parsed || parsed.typ !== typ) return undefined;
	const rows = await db
		.select({
			id: wahlTable.id,
			jahr: wahlTable.jahr,
			typ: wahlTable.typ,
			stimmtyp: wahlTable.stimmtyp
		})
		.from(wahlTable)
		.where(and(eq(wahlTable.jahr, parsed.jahr), eq(wahlTable.typ, typ)));
	return selectParentWahlId(rows, parentSlug, typ, stimmtyp);
}
