import { describe, expect, it } from 'vitest';
import {
	filterKuehleOrte,
	findNearestKuehleOrte,
	nearestFilteredKuehleOrte,
	EMPTY_FILTERS
} from './nearest-kuehle-orte.js';
import type { KuehleOrt } from '$lib/data/get-kuehle-orte-index.js';

function ort(over: Partial<KuehleOrt> & Pick<KuehleOrt, 'id' | 'name'>): KuehleOrt {
	return {
		cat: 'Kino',
		lat: 52.5,
		lng: 13.4,
		coolScore: 4,
		acStatus: 'unknown',
		isFree: 'ticket',
		summerAvailable: 'yes',
		address: 'Teststr 1, 10117 Berlin',
		website: '',
		googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=52.5,13.4',
		appleMapsUrl: 'https://maps.apple.com/?daddr=52.5,13.4',
		openingHoursNote: '',
		openingHours: '',
		...over
	};
}

describe('filterKuehleOrte', () => {
	const places = [
		ort({ id: 'a', name: 'AC-Yes', acStatus: 'yes', isFree: 'ticket', summerAvailable: 'yes' }),
		ort({ id: 'b', name: 'AC-Likely', acStatus: 'likely', isFree: 'free', summerAvailable: 'no' }),
		ort({ id: 'c', name: 'AC-No', acStatus: 'no', isFree: 'free', summerAvailable: 'yes' }),
		ort({ id: 'd', name: 'AC-Unknown', acStatus: 'unknown', isFree: 'consumption', summerAvailable: 'limited' })
	];

	it('ohne Filter alle', () => {
		expect(filterKuehleOrte(places, EMPTY_FILTERS)).toHaveLength(4);
	});

	it('mitKlimaanlage: yes und likely, nicht no/unknown', () => {
		const r = filterKuehleOrte(places, { ...EMPTY_FILTERS, mitKlimaanlage: true });
		expect(r.map((p) => p.id).sort()).toEqual(['a', 'b']);
	});

	it('kostenlos: nur free', () => {
		const r = filterKuehleOrte(places, { ...EMPTY_FILTERS, kostenlos: true });
		expect(r.map((p) => p.id).sort()).toEqual(['b', 'c']);
	});

	it('imSommerNutzbar: nur summer_available=yes', () => {
		const r = filterKuehleOrte(places, { ...EMPTY_FILTERS, imSommerNutzbar: true });
		expect(r.map((p) => p.id).sort()).toEqual(['a', 'c']);
	});

	it('jetztOffen: nur belegt offene Orte, unbekannte Zeiten raus (Story 15.4)', () => {
		const now = new Date(2026, 6, 1, 12, 0, 0);
		const orte = [
			ort({ id: 'offen', name: 'Offen', openingHours: 'Mo-Su 10:00-18:00' }),
			ort({ id: 'zu', name: 'Zu', openingHours: 'Mo-Su 20:00-23:00' }),
			ort({ id: 'unbekannt', name: 'Unbekannt', openingHours: '' })
		];
		const r = filterKuehleOrte(orte, { ...EMPTY_FILTERS, jetztOffen: true }, now);
		expect(r.map((p) => p.id)).toEqual(['offen']);
	});

	it('kombiniert (UND): kostenlos + im Sommer nutzbar', () => {
		const r = filterKuehleOrte(places, {
			...EMPTY_FILTERS,
			kostenlos: true,
			imSommerNutzbar: true
		});
		expect(r.map((p) => p.id)).toEqual(['c']);
	});
});

describe('findNearestKuehleOrte', () => {
	const from = { lat: 52.52, lng: 13.405 };
	const places = [
		ort({ id: 'far', name: 'Far', lat: 52.6, lng: 13.5 }),
		ort({ id: 'near', name: 'Near', lat: 52.521, lng: 13.406 }),
		ort({ id: 'mid', name: 'Mid', lat: 52.54, lng: 13.42 })
	];

	it('sortiert nach Distanz aufsteigend, limitiert', () => {
		const r = findNearestKuehleOrte(from, places, 2);
		expect(r.map((p) => p.id)).toEqual(['near', 'mid']);
		expect(r[0].distanceM).toBeLessThan(r[1].distanceM);
		expect(r[0].distanceM).toBeGreaterThan(0);
	});

	it('limit größer als Menge gibt alle', () => {
		expect(findNearestKuehleOrte(from, places, 10)).toHaveLength(3);
	});

	it('leere Liste gibt leeres Ergebnis, kein Crash', () => {
		expect(findNearestKuehleOrte(from, [], 5)).toEqual([]);
	});
});

describe('nearestFilteredKuehleOrte', () => {
	it('filtert erst, dann nächste', () => {
		const from = { lat: 52.52, lng: 13.405 };
		const places = [
			ort({ id: 'near-paid', name: 'NearPaid', lat: 52.521, lng: 13.406, isFree: 'ticket' }),
			ort({ id: 'far-free', name: 'FarFree', lat: 52.6, lng: 13.5, isFree: 'free' })
		];
		const r = nearestFilteredKuehleOrte(from, places, { ...EMPTY_FILTERS, kostenlos: true }, 5);
		expect(r.map((p) => p.id)).toEqual(['far-free']);
	});
});
