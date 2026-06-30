import { describe, expect, it } from 'vitest';
import { mergeKuehleOrte, type EnrichmentItem, type PlaceItem } from './merge.js';

function enrich(over: Partial<EnrichmentItem> & Pick<EnrichmentItem, 'id'>): EnrichmentItem {
	return {
		name: 'Test',
		cat: 'Kino',
		suitable: true,
		suitable_reason: 'r',
		cool_score: 4,
		ac_status: 'unknown',
		is_free: 'free',
		summer_available: 'yes',
		opening_hours_note: '',
		address_verified: 'Teststr 1, 10117 Berlin',
		website: '',
		still_exists: 'yes',
		notes: '',
		...over
	};
}

function place(over: Partial<PlaceItem> & Pick<PlaceItem, 'id'>): PlaceItem {
	return { lat: 52.5, lon: 13.4, addr: 'Teststr 1', plz: '10117', oh: '', wheelchair: '', ...over };
}

describe('mergeKuehleOrte', () => {
	it('Treffer-Join setzt [lon, lat] und mappt Properties + Navi-Links', () => {
		const res = mergeKuehleOrte(
			[enrich({ id: 'node/1', name: 'Kino X', cool_score: 5 })],
			[place({ id: 'node/1', lat: 52.1, lon: 13.2, oh: 'Mo-Fr 10:00-22:00', wheelchair: 'yes', plz: '10999' })]
		);
		expect(res.collection.features).toHaveLength(1);
		const f = res.collection.features[0];
		expect(f.geometry.coordinates).toEqual([13.2, 52.1]);
		expect(f.properties.name).toBe('Kino X');
		expect(f.properties.cool_score).toBe(5);
		expect(f.properties.oh).toBe('Mo-Fr 10:00-22:00');
		expect(f.properties.wheelchair).toBe('yes');
		expect(f.properties.plz).toBe('10999');
		expect(f.properties.googleMapsUrl).toContain('destination=52.1,13.2');
		expect(f.properties.appleMapsUrl).toContain('daddr=52.1,13.2');
		expect(res.dropped).toEqual({ suitableFalse: 0, stillExistsNo: 0, missingGeometry: 0 });
	});

	it('filtert suitable=false und zählt es', () => {
		const res = mergeKuehleOrte([enrich({ id: 'node/1', suitable: false })], [place({ id: 'node/1' })]);
		expect(res.collection.features).toHaveLength(0);
		expect(res.dropped.suitableFalse).toBe(1);
		expect(res.dropped.stillExistsNo).toBe(0);
	});

	it('filtert still_exists=no (bei suitable=true) und zählt es', () => {
		const res = mergeKuehleOrte(
			[enrich({ id: 'node/1', suitable: true, still_exists: 'no' })],
			[place({ id: 'node/1' })]
		);
		expect(res.collection.features).toHaveLength(0);
		expect(res.dropped.stillExistsNo).toBe(1);
	});

	it('zählt einen Ort mit beiden Flags nur einmal (Überschneidung, kein Doppelabzug)', () => {
		const res = mergeKuehleOrte(
			[enrich({ id: 'node/1', suitable: false, still_exists: 'no' })],
			[place({ id: 'node/1' })]
		);
		expect(res.dropped.suitableFalse).toBe(1);
		expect(res.dropped.stillExistsNo).toBe(0);
	});

	it('überspringt id ohne Place-Match und zählt missingGeometry', () => {
		const res = mergeKuehleOrte([enrich({ id: 'node/999' })], [place({ id: 'node/1' })]);
		expect(res.collection.features).toHaveLength(0);
		expect(res.dropped.missingGeometry).toBe(1);
	});

	it('überspringt Place ohne numerische Koordinaten und zählt missingGeometry', () => {
		const res = mergeKuehleOrte(
			[enrich({ id: 'node/1' })],
			[place({ id: 'node/1', lat: Number.NaN, lon: 13.4 })]
		);
		expect(res.collection.features).toHaveLength(0);
		expect(res.dropped.missingGeometry).toBe(1);
	});

	it('liefert bei leerem Enrichment eine leere FeatureCollection, kein Crash', () => {
		const res = mergeKuehleOrte([], []);
		expect(res.collection.type).toBe('FeatureCollection');
		expect(res.collection.features).toHaveLength(0);
		expect(res.dropped).toEqual({ suitableFalse: 0, stillExistsNo: 0, missingGeometry: 0 });
	});

	it('erhält die Reihenfolge des Enrichment-Arrays (Determinismus)', () => {
		const res = mergeKuehleOrte(
			[enrich({ id: 'node/1', name: 'A' }), enrich({ id: 'node/2', name: 'B' })],
			[place({ id: 'node/2' }), place({ id: 'node/1' })]
		);
		expect(res.collection.features.map((f) => f.properties.name)).toEqual(['A', 'B']);
	});
});
