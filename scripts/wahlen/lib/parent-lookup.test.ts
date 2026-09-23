import { describe, it, expect } from 'vitest';
import { parseParentSlug, selectParentWahlId, type ParentCandidateRow } from './parent-lookup.js';

describe('parseParentSlug', () => {
	it('parst typ+jahr aus einem 2-stelligen Wahl-Slug', () => {
		expect(parseParentSlug('agh21')).toEqual({ typ: 'agh', jahr: 2021 });
		expect(parseParentSlug('bvv21')).toEqual({ typ: 'bvv', jahr: 2021 });
		expect(parseParentSlug('btw17')).toEqual({ typ: 'btw', jahr: 2017 });
	});

	it('liefert null bei unbekanntem Format', () => {
		expect(parseParentSlug('foo')).toBeNull();
		expect(parseParentSlug('agh2021')).toBeNull();
		expect(parseParentSlug('')).toBeNull();
	});
});

/**
 * Simuliert das ALTE, fehlerhafte Auswahl-Verhalten (vor dem Bugfix): nur
 * nach `jahr`+`typ` filtern, dann die erste Row nehmen (entspricht
 * `LIMIT 1` ohne `stimmtyp`-Bedingung in der SQL-Query). Dient als
 * Rot-Beleg: `matrixAgh23Kandidaten` unten ist so aufgebaut, dass die
 * Erststimme-Row zuerst kommt -- exakt der reale Bug (agh23-Zweitstimme
 * zeigte auf agh21-Erststimme).
 */
function selectParentWahlIdOhneStimmtypFilter(
	candidates: readonly ParentCandidateRow[],
	parentSlug: string,
	typ: 'btw' | 'agh' | 'bvv'
): number | undefined {
	const parsed = parseParentSlug(parentSlug);
	if (!parsed || parsed.typ !== typ) return undefined;
	const match = candidates.find((c) => c.jahr === parsed.jahr && c.typ === typ);
	return match?.id;
}

describe('selectParentWahlId (Bugfix-Regression: parent_election_id pro stimmtyp)', () => {
	// Reale Konstellation 20.09.-Live-Fund: agh21 hat zwei wahl-Rows (Erst-
	// UND Zweitstimme), die Erststimme-Row kam in der DB-Antwort zuerst.
	const agh21Kandidaten: ParentCandidateRow[] = [
		{ id: 12, jahr: 2021, typ: 'agh', stimmtyp: 'erststimme' },
		{ id: 13, jahr: 2021, typ: 'agh', stimmtyp: 'zweitstimme' }
	];

	it('wählt die Zweitstimme-Row, wenn stimmtyp=zweitstimme angefragt wird', () => {
		const id = selectParentWahlId(agh21Kandidaten, 'agh21', 'agh', 'zweitstimme');
		expect(id).toBe(13);
	});

	it('wählt die Erststimme-Row, wenn stimmtyp=erststimme angefragt wird', () => {
		const id = selectParentWahlId(agh21Kandidaten, 'agh21', 'agh', 'erststimme');
		expect(id).toBe(12);
	});

	it('Reihenfolge der Kandidaten spielt keine Rolle (deterministisch über stimmtyp, nicht Row-Order)', () => {
		const umgekehrt = [...agh21Kandidaten].reverse();
		expect(selectParentWahlId(umgekehrt, 'agh21', 'agh', 'zweitstimme')).toBe(13);
		expect(selectParentWahlId(umgekehrt, 'agh21', 'agh', 'erststimme')).toBe(12);
	});

	it('liefert undefined ohne passenden stimmtyp', () => {
		const nurErststimme: ParentCandidateRow[] = [
			{ id: 12, jahr: 2021, typ: 'agh', stimmtyp: 'erststimme' }
		];
		expect(selectParentWahlId(nurErststimme, 'agh21', 'agh', 'zweitstimme')).toBeUndefined();
	});

	it('liefert undefined bei Typ-Mismatch zwischen parentSlug und typ', () => {
		expect(selectParentWahlId(agh21Kandidaten, 'agh21', 'bvv', 'zweitstimme')).toBeUndefined();
	});

	it('ROT-Beleg: das alte Verhalten ohne stimmtyp-Filter liefert die FALSCHE Row (agh23-Zweitstimme -> agh21-Erststimme statt -zweitstimme)', () => {
		const altesVerhalten = selectParentWahlIdOhneStimmtypFilter(agh21Kandidaten, 'agh21', 'agh');
		// Bug reproduziert: die alte Auswahl liefert die Erststimme-Row (12),
		// obwohl für die Zweitstimme-Kette eigentlich 13 richtig wäre.
		expect(altesVerhalten).toBe(12);
		expect(altesVerhalten).not.toBe(13);

		// Der Fix behebt genau das:
		expect(selectParentWahlId(agh21Kandidaten, 'agh21', 'agh', 'zweitstimme')).toBe(13);
	});
});
