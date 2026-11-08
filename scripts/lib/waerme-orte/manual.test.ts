import { describe, expect, it } from 'vitest';
import { validateEnrichment } from './enrichment.js';
import { manualCandidateIds, validateManualPlaces } from './manual.js';
import { mergeWaermeOrte } from './merge.js';
import type { ManualPlace, OsmPlace, WaermeEnrichment } from './types.js';

function manual(over: Partial<ManualPlace> = {}): ManualPlace {
	return {
		id: 'manual/waermestube-test',
		name: 'Wärmestube Test',
		cat: 'Wärmestube',
		lat: 52.5,
		lon: 13.4,
		addr: 'Teststraße 1',
		plz: '10117',
		website: 'https://traeger.example/',
		coord_source: 'Nominatim-Abfrage der Adresse am 2026-11-08, Hausnummer-Treffer',
		...over
	};
}

function osm(id: string): OsmPlace {
	return {
		id,
		name: 'Bibliothek X',
		lat: 52.51,
		lon: 13.41,
		addr: 'Teststr 2',
		plz: '10117',
		oh: '',
		wheelchair: '',
		website: '',
		tags: { amenity: 'library' }
	};
}

function enrich(over: Partial<WaermeEnrichment> & Pick<WaermeEnrichment, 'id'>): WaermeEnrichment {
	return {
		name: 'Wärmestube Test',
		cat: 'Wärmestube',
		suitable: true,
		suitable_reason: 'Träger nennt Wärmestube für die Saison 2026/27.',
		winter_open: 'yes',
		opening_hours_note: 'Mo bis Fr 9 bis 15 Uhr',
		oh_recherche: 'Mo-Fr 09:00-15:00',
		stay_without_purchase: 'yes',
		is_free: 'free',
		website: '',
		source_url: 'https://traeger.example/waermestube',
		checked_at: '2026-11-08',
		still_exists: 'yes',
		notes: '',
		...over
	};
}

describe('validateEnrichment mit manuellen Orten', () => {
	it('akzeptiert ids der Form manual/<slug>', () => {
		expect(validateEnrichment(enrich({ id: 'manual/waermestube-test' }))).toEqual([]);
	});
	it('lehnt leere oder unsaubere Slugs ab', () => {
		expect(validateEnrichment(enrich({ id: 'manual/' }))).not.toEqual([]);
		expect(validateEnrichment(enrich({ id: 'manual/Wärme Stube' }))).not.toEqual([]);
	});
});

describe('validateManualPlaces', () => {
	it('akzeptiert einen vollständigen Eintrag', () => {
		expect(validateManualPlaces([manual()])).toEqual([]);
	});
	it('verlangt manual/-id, Name, Kategorie, Adresse, fünfstellige PLZ und Koordinaten-Quelle', () => {
		const errors = validateManualPlaces([
			manual({ id: 'node/1', name: ' ', cat: '', addr: '', plz: '101', coord_source: '' })
		]);
		expect(errors.join('\n')).toMatch(/id/);
		expect(errors.join('\n')).toMatch(/name/);
		expect(errors.join('\n')).toMatch(/cat/);
		expect(errors.join('\n')).toMatch(/addr/);
		expect(errors.join('\n')).toMatch(/plz/);
		expect(errors.join('\n')).toMatch(/coord_source/);
	});
	it('lehnt Koordinaten außerhalb von Berlin und nicht-numerische Werte ab', () => {
		expect(validateManualPlaces([manual({ lat: 48.1, lon: 11.5 })])).not.toEqual([]);
		expect(validateManualPlaces([manual({ lat: Number.NaN })])).not.toEqual([]);
	});
	it('meldet doppelte ids', () => {
		expect(validateManualPlaces([manual(), manual()]).join('\n')).toMatch(/doppelt/);
	});
	it('lehnt eine Website ohne http(s) ab', () => {
		expect(validateManualPlaces([manual({ website: 'ftp://x' })])).not.toEqual([]);
	});
});

describe('manualCandidateIds', () => {
	it('liefert die ids aller manuellen Orte', () => {
		expect(manualCandidateIds([manual(), manual({ id: 'manual/zwei' })])).toEqual([
			'manual/waermestube-test',
			'manual/zwei'
		]);
	});
});

describe('mergeWaermeOrte mit manuellen Orten', () => {
	it('nimmt einen manuellen Ort mit Enrichment ins GeoJSON, ohne OSM-Filter', () => {
		const res = mergeWaermeOrte([enrich({ id: 'manual/waermestube-test' })], [], [manual()]);
		expect(res.collection.features).toHaveLength(1);
		const f = res.collection.features[0];
		expect(f.geometry.coordinates).toEqual([13.4, 52.5]);
		expect(f.properties.cat).toBe('Wärmestube');
		expect(f.properties.addr).toBe('Teststraße 1');
		expect(f.properties.website).toBe('https://traeger.example/');
		expect(f.properties.oh).toBe('');
		expect(f.properties.oh_recherche).toBe('Mo-Fr 09:00-15:00');
	});
	it('meldet manuelle Orte ohne Enrichment', () => {
		const res = mergeWaermeOrte([], [], [manual()]);
		expect(res.missingEnrichment).toEqual(['manual/waermestube-test']);
		expect(res.collection.features).toHaveLength(0);
	});
	it('wertet Enrichment für manuelle ids ohne manuellen Ort als Waise', () => {
		expect(() => mergeWaermeOrte([enrich({ id: 'manual/fehlt' })], [], [])).toThrow(/Waisen/);
	});
	it('bricht ab, wenn ein manueller Ort keine manual/-id trägt', () => {
		expect(() => mergeWaermeOrte([], [osm('node/1')], [manual({ id: 'node/1' })])).toThrow(
			/manual/
		);
	});
	it('ohne manuelle Orte bleibt das Verhalten gleich', () => {
		const res = mergeWaermeOrte([], [osm('node/1')]);
		expect(res.missingEnrichment).toEqual(['node/1']);
	});
});
