import { describe, expect, it } from 'vitest';
import { mergeWaermeOrte, withOsmPublicHolidayOff } from './merge.js';
import type { OsmPlace, WaermeEnrichment } from './types.js';

function place(over: Partial<OsmPlace> & Pick<OsmPlace, 'id'>): OsmPlace {
	return {
		name: 'Bibliothek X',
		lat: 52.5,
		lon: 13.4,
		addr: 'Teststr 1',
		plz: '10117',
		oh: 'Mo-Fr 10:00-18:00',
		wheelchair: 'yes',
		website: 'https://osm.example/',
		tags: { amenity: 'library' },
		...over
	};
}

function enrich(over: Partial<WaermeEnrichment> & Pick<WaermeEnrichment, 'id'>): WaermeEnrichment {
	return {
		name: 'Bibliothek X',
		cat: 'Bibliothek',
		suitable: true,
		suitable_reason: 'Öffentlich, beheizt belegt.',
		winter_open: 'yes',
		opening_hours_note: '',
		stay_without_purchase: 'yes',
		is_free: 'free',
		website: '',
		source_url: 'https://betreiber.example/',
		checked_at: '2026-10-16',
		still_exists: 'yes',
		notes: '',
		...over
	};
}

describe('withOsmPublicHolidayOff', () => {
	it('hängt PH off an, wenn OSM es nennt und die Recherche keine PH-Regel hat', () => {
		expect(withOsmPublicHolidayOff('Mo-Fr 10:00-18:00', 'Mo-Fr 10:00-18:00; PH off')).toBe(
			'Mo-Fr 10:00-18:00; PH off'
		);
	});
	it('lässt Recherche-Werte mit PH-Regel, ohne OSM-PH off, leer und unklar unverändert', () => {
		expect(withOsmPublicHolidayOff('Mo-Fr 10:00-18:00; PH 11:00-14:00', 'PH off')).toBe(
			'Mo-Fr 10:00-18:00; PH 11:00-14:00'
		);
		expect(withOsmPublicHolidayOff('Mo-Fr 10:00-18:00', 'Mo-Fr 10:00-18:00')).toBe(
			'Mo-Fr 10:00-18:00'
		);
		expect(withOsmPublicHolidayOff('', 'PH off')).toBe('');
		expect(withOsmPublicHolidayOff('unklar', 'PH off')).toBe('unklar');
	});
});

describe('mergeWaermeOrte oh_recherche', () => {
	it('ergänzt PH off aus OSM im GeoJSON', () => {
		const res = mergeWaermeOrte(
			[
				enrich({
					id: 'node/1',
					opening_hours_note: 'Mo-Fr 10-18',
					oh_recherche: 'Mo-Fr 10:00-18:00'
				})
			],
			[place({ id: 'node/1', oh: 'Mo-Fr 10:00-18:00; PH off' })]
		);
		expect(res.collection.features[0].properties.oh_recherche).toBe('Mo-Fr 10:00-18:00; PH off');
	});

	it('reicht oh_recherche durch, leer wenn nicht gesetzt', () => {
		const res = mergeWaermeOrte(
			[
				enrich({ id: 'node/1', oh_recherche: 'Sa 11:00-13:00' }),
				enrich({ id: 'node/2', name: 'Andere Bibliothek' })
			],
			[place({ id: 'node/1' }), place({ id: 'node/2', lat: 52.6, name: 'Andere Bibliothek' })]
		);
		const byId = Object.fromEntries(res.collection.features.map((f) => [f.properties.id, f]));
		expect(byId['node/1'].properties.oh_recherche).toBe('Sa 11:00-13:00');
		expect(byId['node/2'].properties.oh_recherche).toBe('');
	});
});

describe('mergeWaermeOrte', () => {
	it('joint per id, setzt [lon, lat] und hängt Navi-Links an', () => {
		const res = mergeWaermeOrte(
			[enrich({ id: 'node/1', website: 'https://betreiber.example/bib' })],
			[place({ id: 'node/1', lat: 52.1, lon: 13.2 })]
		);
		expect(res.collection.features).toHaveLength(1);
		const f = res.collection.features[0];
		expect(f.geometry.coordinates).toEqual([13.2, 52.1]);
		expect(f.properties.cat).toBe('Bibliothek');
		expect(f.properties.addr).toBe('Teststr 1');
		expect(f.properties.website).toBe('https://betreiber.example/bib');
		expect(f.properties.googleMapsUrl).toContain('destination=52.1,13.2');
		expect(f.properties.appleMapsUrl).toContain('daddr=52.1,13.2');
	});

	it('nimmt die OSM-Website, wenn das Enrichment keine nennt', () => {
		const res = mergeWaermeOrte([enrich({ id: 'node/1' })], [place({ id: 'node/1' })]);
		expect(res.collection.features[0].properties.website).toBe('https://osm.example/');
	});

	it('trägt unbelegte Winter-Angaben als unknown ins GeoJSON', () => {
		const res = mergeWaermeOrte(
			[
				enrich({
					id: 'node/1',
					winter_open: 'unknown',
					stay_without_purchase: 'unknown',
					is_free: 'unknown',
					source_url: ''
				})
			],
			[place({ id: 'node/1' })]
		);
		const p = res.collection.features[0].properties;
		expect(p.winter_open).toBe('unknown');
		expect(p.stay_without_purchase).toBe('unknown');
		expect(p.is_free).toBe('unknown');
	});

	it('zählt suitable=false und still_exists=no je Grund einmal', () => {
		const res = mergeWaermeOrte(
			[
				enrich({ id: 'node/1', suitable: false }),
				enrich({ id: 'node/2', still_exists: 'no' }),
				enrich({ id: 'node/3', suitable: false, still_exists: 'no' }),
				enrich({ id: 'node/4' })
			],
			[1, 2, 3, 4].map((n) => place({ id: `node/${n}` }))
		);
		expect(res.collection.features).toHaveLength(1);
		expect(res.dropped.suitableFalse).toBe(2);
		expect(res.dropped.stillExistsNo).toBe(1);
	});

	it('verwirft Kandidaten ohne gültige Koordinate und zählt sie', () => {
		const res = mergeWaermeOrte(
			[enrich({ id: 'node/1' })],
			[place({ id: 'node/1', lat: Number.NaN })]
		);
		expect(res.collection.features).toHaveLength(0);
		expect(res.dropped.missingGeometry).toBe(1);
	});

	it('zählt OSM-Ausschlüsse je Grund und lässt sie aus dem GeoJSON', () => {
		const res = mergeWaermeOrte(
			[enrich({ id: 'node/1' })],
			[
				place({ id: 'node/1' }),
				place({ id: 'node/2', tags: { amenity: 'library', access: 'private' } }),
				place({ id: 'node/3', tags: { tourism: 'museum', fee: 'yes' } }),
				place({ id: 'node/4', tags: { tourism: 'museum', fee: 'yes' } })
			]
		);
		expect(res.collection.features).toHaveLength(1);
		expect(res.dropped.osmFiltered).toEqual({ access_restricted: 1, museum_fee: 2 });
	});

	it('meldet Kandidaten ohne Enrichment, ohne sie ins GeoJSON zu nehmen', () => {
		const res = mergeWaermeOrte(
			[enrich({ id: 'node/1' })],
			[place({ id: 'node/1' }), place({ id: 'node/2' })]
		);
		expect(res.collection.features).toHaveLength(1);
		expect(res.missingEnrichment).toEqual(['node/2']);
	});

	it('bricht bei Waisen in enrichment.json ab', () => {
		expect(() => mergeWaermeOrte([enrich({ id: 'node/99' })], [place({ id: 'node/1' })])).toThrow(
			/node\/99/
		);
	});

	it('wertet Enrichment für einen ausgefilterten OSM-Ort als Waise', () => {
		expect(() =>
			mergeWaermeOrte(
				[enrich({ id: 'node/1' })],
				[place({ id: 'node/1', tags: { amenity: 'library', access: 'private' } })]
			)
		).toThrow(/node\/1/);
	});

	it('liefert deterministisch nach id sortiert, unabhängig von der Eingabe-Reihenfolge', () => {
		const e = [enrich({ id: 'node/2', name: 'B' }), enrich({ id: 'node/1', name: 'A' })];
		const p = [place({ id: 'node/1' }), place({ id: 'node/2' })];
		const a = mergeWaermeOrte(e, p);
		const b = mergeWaermeOrte([...e].reverse(), [...p].reverse());
		expect(JSON.stringify(a.collection)).toBe(JSON.stringify(b.collection));
		expect(a.collection.features.map((f) => f.properties.id)).toEqual(['node/1', 'node/2']);
	});

	it('gibt notes nicht ins öffentliche GeoJSON', () => {
		const res = mergeWaermeOrte(
			[enrich({ id: 'node/1', notes: 'Drittquelle: 10-19 Uhr' })],
			[place({ id: 'node/1' })]
		);
		expect(res.collection.features[0].properties).not.toHaveProperty('notes');
	});

	describe('Dubletten', () => {
		it('behält bei gleichem Namen unter 75 m nur einen Eintrag und zählt den Rest', () => {
			const res = mergeWaermeOrte(
				[
					enrich({ id: 'node/1', name: 'Spree Center ' }),
					enrich({ id: 'way/2', name: 'spree center' })
				],
				[place({ id: 'node/1' }), place({ id: 'way/2', lat: 52.5003 })]
			);
			expect(res.collection.features.map((f) => f.properties.id)).toEqual(['node/1']);
			expect(res.dropped.duplicates).toBe(1);
		});

		it('bevorzugt den Eintrag mit belegter winter_open, sonst die kleinste id', () => {
			const res = mergeWaermeOrte(
				[
					enrich({ id: 'node/1', name: 'X', winter_open: 'unknown' }),
					enrich({ id: 'way/2', name: 'X', winter_open: 'yes' }),
					enrich({ id: 'way/3', name: 'X', winter_open: 'yes' })
				],
				[place({ id: 'node/1' }), place({ id: 'way/2' }), place({ id: 'way/3' })]
			);
			expect(res.collection.features.map((f) => f.properties.id)).toEqual(['way/2']);
			expect(res.dropped.duplicates).toBe(2);
		});

		it('behält gleichnamige Orte ab 75 m Abstand', () => {
			const res = mergeWaermeOrte(
				[enrich({ id: 'node/1', name: 'X' }), enrich({ id: 'node/2', name: 'X' })],
				[place({ id: 'node/1' }), place({ id: 'node/2', lat: 52.501 })]
			);
			expect(res.collection.features).toHaveLength(2);
			expect(res.dropped.duplicates).toBe(0);
		});

		it('behält verschiedene Namen auf demselben Punkt', () => {
			const res = mergeWaermeOrte(
				[enrich({ id: 'node/1', name: 'A' }), enrich({ id: 'node/2', name: 'B' })],
				[place({ id: 'node/1' }), place({ id: 'node/2' })]
			);
			expect(res.collection.features).toHaveLength(2);
		});
	});
});
