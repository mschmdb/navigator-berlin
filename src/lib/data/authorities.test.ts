import { describe, expect, it } from 'vitest';
import {
	AUTHORITIES,
	AUTHORITY_KEYS,
	AUTHORITY_SUFFIX_OSM_ODBL,
	resolveAuthority,
	type AuthorityKey,
	type AuthorityMeta
} from './authorities.js';

describe('AUTHORITIES · Schema + Coverage', () => {
	it('jeder Authority-Eintrag hat mindestens DE-String', () => {
		for (const key of AUTHORITY_KEYS) {
			const meta = AUTHORITIES[key];
			expect(meta, `Key ${key}`).toBeDefined();
			expect(meta.de, `DE-String ${key}`).toBeTruthy();
			expect(typeof meta.de === 'string').toBe(true);
			expect(meta.de.length).toBeGreaterThan(2);
		}
	});

	it('alle Keys in AUTHORITY_KEYS sind Keys in AUTHORITIES', () => {
		for (const key of AUTHORITY_KEYS) {
			expect(Object.prototype.hasOwnProperty.call(AUTHORITIES, key)).toBe(true);
		}
	});

	it('AUTHORITIES enthält keine zusätzlichen Keys ausserhalb von AUTHORITY_KEYS', () => {
		const extraKeys = Object.keys(AUTHORITIES).filter(
			(k) => !AUTHORITY_KEYS.includes(k as AuthorityKey)
		);
		expect(extraKeys).toEqual([]);
	});
});

describe('resolveAuthority', () => {
	it('liefert DE-String per Default', () => {
		const result = resolveAuthority('odis');
		expect(result).toMatch(/ODIS/);
	});

	it('liefert DE-String wenn locale="de"', () => {
		const result = resolveAuthority('senatsvw-umwelt', 'de');
		expect(result).toMatch(/Senatsverwaltung/);
	});

	// i18n Block C2: alle 25 Einträge sind jetzt EN-befüllt (Abnahme
	// c2-uebersetzung-review.md, Matze 27.09. 10:59) -- der DE-Fallback greift
	// für `en` nicht mehr.
	it('liefert echten EN-String, nicht den DE-Fallback', () => {
		const de = resolveAuthority('odis', 'de');
		const en = resolveAuthority('odis', 'en');
		expect(en).not.toBe(de);
		expect(en).toMatch(/Open Data Information Office/);
	});

	it('liefert den offiziellen englischen Senatsverwaltungs-Namen laut berlin.de', () => {
		const en = resolveAuthority('senatsvw-umwelt', 'en');
		expect(en).toMatch(
			/Senate Department for Urban Mobility, Transport, Climate Action and the Environment/
		);
	});

	it('alle Keys lassen sich auflösen ohne Fehler (DE + EN)', () => {
		for (const key of AUTHORITY_KEYS) {
			const de = resolveAuthority(key, 'de');
			const en = resolveAuthority(key, 'en');
			expect(de, `Key ${key} DE`).toBeTruthy();
			expect(en, `Key ${key} EN`).toBeTruthy();
		}
	});
});

describe('Authority-EN-Vollständigkeit (i18n Block C2)', () => {
	it('Schema verlangt DE- und EN-String pro Eintrag (beide Pflichtfelder)', () => {
		const sample: AuthorityMeta = AUTHORITIES.odis;
		expect(sample.de).toBeTruthy();
		expect(typeof sample.en).toBe('string');
	});

	it('jeder Authority-Eintrag hat einen nicht-leeren EN-String', () => {
		for (const key of AUTHORITY_KEYS) {
			const meta = AUTHORITIES[key] as AuthorityMeta;
			expect(meta.en, `EN-String ${key}`).toBeTruthy();
			expect(meta.en!.length).toBeGreaterThan(1);
		}
	});

	it('EN-String unterscheidet sich vom DE-String (echte Übersetzung, kein Copy-Paste)', () => {
		// Ausnahmen: Eigennamen/Kurzformen, die auf EN identisch bleiben
		// (Abnahme c2-uebersetzung-review.md).
		const identicalAllowed = new Set(['senatsvw-mvku-short', 'wasser-betriebe']);
		for (const key of AUTHORITY_KEYS) {
			if (identicalAllowed.has(key)) continue;
			const meta = AUTHORITIES[key] as AuthorityMeta;
			expect(meta.en, `EN-String ${key}`).not.toBe(meta.de);
		}
	});
});

// i18n Block C2: der OSM-Suffix war vormals ein fixer, als "sprachneutral"
// behandelter String und schrieb auf EN fälschlich die DE-Bindestrich-Form
// "OpenStreetMap-Contributors". Jetzt ein Locale-Textbaustein.
describe('AUTHORITY_SUFFIX_OSM_ODBL · locale-fähig', () => {
	it('DE bleibt unverändert (Bindestrich-Schreibweise)', () => {
		expect(AUTHORITY_SUFFIX_OSM_ODBL.de).toBe('· OpenStreetMap-Contributors (ODbL 1.0)');
	});

	it('EN schreibt "OpenStreetMap contributors" mit Leerzeichen, nicht Bindestrich', () => {
		expect(AUTHORITY_SUFFIX_OSM_ODBL.en).toBe('· OpenStreetMap contributors (ODbL 1.0)');
		expect(AUTHORITY_SUFFIX_OSM_ODBL.en).not.toMatch(/OpenStreetMap-Contributors/);
	});
});
