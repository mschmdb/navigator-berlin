import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Feature, Point } from 'geojson';
import {
	_resetWaermeOrteIndexForTests,
	featureToWaermeOrt,
	getWaermeOrteIndex,
	type WaermeOrtProps
} from './get-waerme-orte-index.js';

function feature(over: Partial<WaermeOrtProps> = {}): Feature<Point, WaermeOrtProps> {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [13.4, 52.5] },
		properties: {
			id: 'node/1',
			name: 'Bibliothek Mitte',
			cat: 'Bibliothek',
			winter_open: 'yes',
			opening_hours_note: 'Mo bis Fr 10 bis 19 Uhr',
			stay_without_purchase: 'unknown',
			is_free: 'free',
			website: 'https://example.org',
			source_url: 'https://example.org/zeiten',
			checked_at: '2026-10-16',
			addr: 'Teststr. 1',
			plz: '10115',
			oh: 'Mo-Fr 10:00-19:00',
			googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=52.5,13.4',
			appleMapsUrl: 'https://maps.apple.com/?daddr=52.5,13.4',
			...over
		} as WaermeOrtProps
	};
}

describe('featureToWaermeOrt hoursSource', () => {
	it('nimmt Recherche-Zeiten vor OSM', () => {
		const ort = featureToWaermeOrt(
			feature({ oh: 'Mo-Fr 10:00-19:00', oh_recherche: 'Sa 11:00-13:00' })
		);
		expect(ort.openingHours).toBe('Sa 11:00-13:00');
		expect(ort.hoursSource).toBe('recherche');
	});

	it('fällt ohne Recherche auf OSM zurück', () => {
		const ort = featureToWaermeOrt(feature({ oh_recherche: '' }));
		expect(ort.openingHours).toBe('Mo-Fr 10:00-19:00');
		expect(ort.hoursSource).toBe('osm');
	});

	it('zeigt bei "unklar" keine Zeiten, auch wenn OSM welche hat', () => {
		const ort = featureToWaermeOrt(feature({ oh_recherche: 'unklar' }));
		expect(ort.openingHours).toBe('');
		expect(ort.hoursSource).toBe('unklar');
	});

	it('liefert null ohne Recherche und ohne OSM-Zeiten', () => {
		const ort = featureToWaermeOrt(feature({ oh: '', oh_recherche: undefined }));
		expect(ort.hoursSource).toBeNull();
	});
});

describe('featureToWaermeOrt', () => {
	it('mappt Koordinaten und Winter-Felder', () => {
		const ort = featureToWaermeOrt(feature());
		expect(ort).toMatchObject({
			id: 'node/1',
			lat: 52.5,
			lng: 13.4,
			winterOpen: 'yes',
			stayWithoutPurchase: 'unknown',
			isFree: 'free',
			sourceUrl: 'https://example.org/zeiten',
			checkedAt: '2026-10-16',
			openingHours: 'Mo-Fr 10:00-19:00',
			openingHoursNote: 'Mo bis Fr 10 bis 19 Uhr',
			address: 'Teststr. 1',
			plz: '10115'
		});
	});

	it('setzt fehlende Felder auf leere Strings bzw. unknown', () => {
		const ort = featureToWaermeOrt(
			feature({ oh: undefined, addr: undefined, plz: undefined, winter_open: undefined })
		);
		expect(ort.openingHours).toBe('');
		expect(ort.address).toBe('');
		expect(ort.plz).toBe('');
		expect(ort.winterOpen).toBe('unknown');
	});

	it('wertet unbekannte Enum-Werte nie als Ja', () => {
		const ort = featureToWaermeOrt(feature({ stay_without_purchase: 'maybe' }));
		expect(ort.stayWithoutPurchase).toBe('unknown');
	});
});

describe('getWaermeOrteIndex', () => {
	beforeEach(() => _resetWaermeOrteIndexForTests());

	const respond = (body: unknown) =>
		vi.fn(
			async () => new Response(JSON.stringify(body), { status: 200 })
		) as unknown as typeof fetch;

	it('zwei parallele Aufrufe lösen genau einen fetch aus', async () => {
		const f = respond({ type: 'FeatureCollection', features: [feature()] });
		const [a, b] = await Promise.all([getWaermeOrteIndex(f), getWaermeOrteIndex(f)]);
		expect(a).toBe(b);
		expect(f).toHaveBeenCalledTimes(1);
	});

	it('überspringt ungültige Features statt alles zu verwerfen', async () => {
		const bad = [
			{
				type: 'Feature',
				geometry: { type: 'Polygon', coordinates: [] },
				properties: feature().properties
			},
			{ type: 'Feature', geometry: { type: 'Point', coordinates: [13.4, 52.5] } },
			null
		];
		const f = respond({ type: 'FeatureCollection', features: [feature(), ...bad] });
		const index = await getWaermeOrteIndex(f);
		expect(index.map((o) => o.id)).toEqual(['node/1']);
	});

	it('wirft, wenn das features-Array fehlt', async () => {
		await expect(getWaermeOrteIndex(respond({ type: 'FeatureCollection' }))).rejects.toThrow(
			'features'
		);
	});

	it('wirft bei HTTP-Fehler, cached nicht und lädt danach neu', async () => {
		const failing = vi.fn(async () => new Response('x', { status: 404 }));
		await expect(getWaermeOrteIndex(failing as unknown as typeof fetch)).rejects.toThrow('404');
		const ok = vi.fn(
			async () =>
				new Response(JSON.stringify({ type: 'FeatureCollection', features: [feature()] }), {
					status: 200
				})
		);
		const first = await getWaermeOrteIndex(ok as unknown as typeof fetch);
		const second = await getWaermeOrteIndex(ok as unknown as typeof fetch);
		expect(first).toHaveLength(1);
		expect(second).toBe(first);
		expect(ok).toHaveBeenCalledTimes(1);
		expect(ok).toHaveBeenCalledWith('/data/waerme-orte.geojson', {
			signal: expect.any(AbortSignal)
		});
	});
});
