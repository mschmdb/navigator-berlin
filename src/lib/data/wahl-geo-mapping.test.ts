import { describe, it, expect } from 'vitest';
import {
	WAHL_TO_GEO,
	wahlSlugFromTypJahr,
	geoSlugForWahl,
	hasGeometry,
	geoSlugForYear,
	pickUwb3,
	dbUwbIdFromGeo,
	candidateDbUwbIds,
	wahlenForGeo,
	gruppeIdFromGeo,
	UWB_FORMAT_HINT
} from './wahl-geo-mapping.js';

// Die folgenden 14 Cases spiegeln 1:1 scripts/wahlen/lib/kiez-mapper.test.ts
// (Kontrakt laut Story 1 "Geo-Mapping auf eine Quelle konsolidieren").
describe('dbUwbIdFromGeo (Kontrakt-Parität zu kiez-mapper.test.ts)', () => {
	describe('BTW 21/25 modern format', () => {
		it('matched BTW25 DB-Format aus BT25-Geo', () => {
			const id = dbUwbIdFromGeo({ BWK: '83', BEZ: '09', UWB3: '101', UWB: '09101' }, 'btw25');
			expect(id).toBe('083-09-101-0');
		});

		it('matched BTW21 DB-Format aus AH21-Geo', () => {
			const id = dbUwbIdFromGeo({ BWK: '75', BEZ: '01', UWB3: '100' }, 'btw21');
			expect(id).toBe('075-01-100-0');
		});
	});

	describe('BTW 17 alt-Format', () => {
		it('fügt BEZ+W ein im wahlbezirk-Slot', () => {
			const id = dbUwbIdFromGeo({ BWK: '078', BEZ: '05', UWB3: '221', UWB: '05221' }, 'btw17');
			expect(id).toBe('078-05-05W221-0');
		});
	});

	describe('AGH/BVV 16/21/23 alle gleiches Format ohne suffix', () => {
		it('AGH21 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'agh21');
			expect(id).toBe('01W100');
		});

		it('BVV23 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'bvv23');
			expect(id).toBe('01W100');
		});

		it('AGH16 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB: '100' }, 'agh16');
			expect(id).toBe('01W100');
		});

		it('BVV16 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB: '100' }, 'bvv16');
			expect(id).toBe('01W100');
		});

		it('AGH26 ohne suffix (generisch, kein Code-Update pro Jahrgang nötig)', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'agh26');
			expect(id).toBe('01W100');
		});

		it('BVV26 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'bvv26');
			expect(id).toBe('01W100');
		});
	});

	describe('UWB3-Detection-Fallback', () => {
		it('extrahiert UWB3 aus 5-stelliger UWB wenn UWB3 fehlt', () => {
			const id = dbUwbIdFromGeo({ BWK: '75', BEZ: '01', UWB: '01100' }, 'btw21');
			expect(id).toBe('075-01-100-0');
		});

		it('liest WB-Spalte (AH23 Wahllokale-Format)', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', WB: '100' }, 'agh23');
			expect(id).toBe('01W100');
		});
	});

	describe('Edge cases', () => {
		it('returns null bei fehlendem BEZ', () => {
			expect(dbUwbIdFromGeo({ UWB3: '100', BWK: '75' }, 'btw25')).toBeNull();
		});

		it('returns null bei BTW ohne BWK', () => {
			expect(dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'btw25')).toBeNull();
		});

		it('returns null bei unbekanntem wahlSlug', () => {
			expect(dbUwbIdFromGeo({ BEZ: '01', UWB3: '100', BWK: '75' }, 'btw13')).toBeNull();
			expect(dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'agh11')).toBeNull();
			expect(dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'bvv11')).toBeNull();
		});
	});
});

describe('pickUwb3', () => {
	it('bevorzugt UWB3 wenn vorhanden', () => {
		expect(pickUwb3({ UWB3: '101', UWB: '09101' })).toBe('101');
	});

	it('slict 5-stellige UWB auf die letzten 3 Stellen', () => {
		expect(pickUwb3({ UWB: '01100' })).toBe('100');
	});

	it('gibt kürzere UWB unverändert zurück', () => {
		expect(pickUwb3({ UWB: '100' })).toBe('100');
	});

	it('fällt auf WB zurück wenn UWB3/UWB fehlen', () => {
		expect(pickUwb3({ WB: '100' })).toBe('100');
	});

	it('gibt null zurück wenn nichts vorhanden ist', () => {
		expect(pickUwb3({})).toBeNull();
	});
});

describe('geoSlugForWahl / hasGeometry', () => {
	const wahlenMitGeometrie = [
		'btw17',
		'btw21',
		'btw25',
		'agh16',
		'agh21',
		'agh23',
		'bvv16',
		'bvv21',
		'bvv23',
		'agh26',
		'bvv26'
	];
	const wahlenOhneGeometrie = ['btw13', 'agh11', 'bvv11'];

	it.each(wahlenMitGeometrie)('%s hat Geometrie laut WAHL_TO_GEO', (slug) => {
		expect(hasGeometry(slug)).toBe(true);
		expect(geoSlugForWahl(slug)).toBe(WAHL_TO_GEO.get(slug));
	});

	it.each(wahlenOhneGeometrie)('%s hat keine Geometrie', (slug) => {
		expect(hasGeometry(slug)).toBe(false);
		expect(geoSlugForWahl(slug)).toBeNull();
	});

	it('WAHL_TO_GEO hat genau 11 Einträge (Bestand + agh26/bvv26)', () => {
		expect(WAHL_TO_GEO.size).toBe(11);
	});
});

describe('geoSlugForYear (Parität zu WAHL_TO_GEO)', () => {
	it.each([
		[2026, 'ah26'],
		[2025, 'bt25'],
		[2023, 'ah21'],
		[2021, 'ah21'],
		[2017, 'btw17'],
		[2016, 'ah16']
	])('Jahr %i → %s', (year, expected) => {
		expect(geoSlugForYear(year)).toBe(expected);
	});

	it('unbekanntes Jahr gibt null zurück', () => {
		expect(geoSlugForYear(2013)).toBeNull();
		expect(geoSlugForYear(2011)).toBeNull();
		expect(geoSlugForYear(1999)).toBeNull();
	});

	it('Out-of-Range-Jahre mit passendem Suffix geben null zurück (Alt-Verhalten)', () => {
		expect(geoSlugForYear(1925)).toBeNull();
		expect(geoSlugForYear(2125)).toBeNull();
		expect(geoSlugForYear(-2025)).toBeNull();
		expect(geoSlugForYear(1921)).toBeNull();
	});
});

describe('candidateDbUwbIds (Reverse-Lookup)', () => {
	it('BTW-Format liefert beide BWK-Varianten', () => {
		const candidates = candidateDbUwbIds({ BWK: '75', BEZ: '01', UWB3: '100' });
		expect(candidates).toContain('075-01-100-0');
		expect(candidates).toContain('075-01-01W100-0');
	});

	it('AGH/BVV-Format liefert beide Suffix-Varianten', () => {
		const candidates = candidateDbUwbIds({ BEZ: '01', UWB3: '100' });
		expect(candidates).toContain('01W100-W');
		expect(candidates).toContain('01W100');
	});

	it('gibt leere Liste bei fehlenden Props zurück', () => {
		expect(candidateDbUwbIds({})).toEqual([]);
		expect(candidateDbUwbIds({ UWB3: '100' })).toEqual([]);
	});
});

describe('wahlenForGeo', () => {
	it('liefert alle Wahl-Slugs für einen Geo-Slug (Umkehrung von WAHL_TO_GEO)', () => {
		expect(wahlenForGeo('ah21').sort()).toEqual(
			['btw21', 'agh21', 'agh23', 'bvv21', 'bvv23'].sort()
		);
		expect(wahlenForGeo('bt25')).toEqual(['btw25']);
		expect(wahlenForGeo('btw17')).toEqual(['btw17']);
	});

	it('gibt leere Liste für unbekannten Geo-Slug zurück', () => {
		expect(wahlenForGeo('nicht-vorhanden')).toEqual([]);
	});
});

describe('wahlSlugFromTypJahr', () => {
	it('baut den kurzen Wahl-Slug aus Typ + Jahr', () => {
		expect(wahlSlugFromTypJahr('btw', 2025)).toBe('btw25');
		expect(wahlSlugFromTypJahr('agh', 2021)).toBe('agh21');
		expect(wahlSlugFromTypJahr('bvv', 2016)).toBe('bvv16');
	});
});

// gruppeIdFromGeo: Ground-Truth per SQL-Sample gegen echte stimmbezirk-Rows
// verifiziert (Story: Briefwahl-Gruppen als kleinste Kartenebene).
describe('gruppeIdFromGeo', () => {
	describe('BTW 21/25 (Suffix aus BWB3)', () => {
		it('baut die Gruppen-ID für BTW25', () => {
			const id = gruppeIdFromGeo({ BWK: '74', BEZ: '01', BWB3: '1C' }, 'btw25');
			expect(id).toBe('074-01-1C-5');
		});

		it('baut die Gruppen-ID für BTW21', () => {
			const id = gruppeIdFromGeo({ BWK: '75', BEZ: '01', BWB3: '1A' }, 'btw21');
			expect(id).toBe('075-01-1A-5');
		});
	});

	describe('BTW 17 (Suffix aus BWB2, BEZ+B-Infix)', () => {
		it('baut die Gruppen-ID für BTW17', () => {
			const id = gruppeIdFromGeo({ BWK: '75', BEZ: '01', BWB2: '1A' }, 'btw17');
			expect(id).toBe('075-01-01B1A-5');
		});
	});

	describe('AGH/BVV 21/23/26 (Suffix aus BWB3, kein Anhang)', () => {
		it('AGH21', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB3: '1A' }, 'agh21')).toBe('01B1A');
		});
		it('AGH23 (nutzt den ah21-Layer)', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB3: '1A' }, 'agh23')).toBe('01B1A');
		});
		it('BVV21', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB3: '1A' }, 'bvv21')).toBe('01B1A');
		});
		it('AGH26 (Beispiel aus Spec: Gruppe 7P)', () => {
			expect(gruppeIdFromGeo({ BEZ: '09', BWB3: '7P' }, 'agh26')).toBe('09B7P');
		});
		it('BVV26', () => {
			expect(gruppeIdFromGeo({ BEZ: '10', BWB3: '5A' }, 'bvv26')).toBe('10B5A');
		});
	});

	describe('AGH/BVV 16 (Suffix aus BWB, BEZ-Präfix entfernen)', () => {
		it('AGH16', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB: '011A' }, 'agh16')).toBe('01B1A');
		});
		it('BVV16', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB: '011A' }, 'bvv16')).toBe('01B1A');
		});

		it('normalisiert kleingeschriebenen Suffix auf Großbuchstaben (Bezirk 08/Neukölln liefert "081a" statt "011A", Ground-Truth-Fund gegen echte stimmbezirk-Rows)', () => {
			expect(gruppeIdFromGeo({ BEZ: '08', BWB: '081a' }, 'agh16')).toBe('08B1A');
		});
	});

	describe('Edge cases', () => {
		it('returns null bei fehlendem BEZ', () => {
			expect(gruppeIdFromGeo({ BWB3: '1A', BWK: '75' }, 'btw25')).toBeNull();
		});

		it('returns null bei BTW ohne BWK', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB3: '1A' }, 'btw25')).toBeNull();
		});

		it('returns null bei fehlendem Suffix-Feld', () => {
			expect(gruppeIdFromGeo({ BEZ: '01' }, 'agh21')).toBeNull();
			expect(gruppeIdFromGeo({ BEZ: '01' }, 'agh16')).toBeNull();
		});

		it('returns null wenn BWB (agh16) nicht mit BEZ beginnt', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB: '021A' }, 'agh16')).toBeNull();
		});

		it('returns null bei unbekanntem wahlSlug', () => {
			expect(gruppeIdFromGeo({ BEZ: '01', BWB3: '1A', BWK: '75' }, 'btw13')).toBeNull();
			expect(gruppeIdFromGeo({ BEZ: '01', BWB3: '1A' }, 'agh11')).toBeNull();
			expect(gruppeIdFromGeo({ BEZ: '01', BWB3: '1A' }, 'bvv11')).toBeNull();
		});
	});
});

describe('UWB_FORMAT_HINT', () => {
	it('ist ein nicht-leerer Hinweis-String mit allen Format-Beispielen', () => {
		expect(UWB_FORMAT_HINT).toContain('075-01-100-0');
		expect(UWB_FORMAT_HINT).toContain('078-05-05W221-0');
		expect(UWB_FORMAT_HINT).toContain('01W100-W');
		expect(UWB_FORMAT_HINT).toContain('01W100');
	});

	it('klärt, dass keine Briefwahl-Gruppen-ID gemeint ist, und nennt is_gruppe (Review-Fund)', () => {
		expect(UWB_FORMAT_HINT).toContain('gebiet_slug');
		expect(UWB_FORMAT_HINT).toContain('is_gruppe');
	});
});
