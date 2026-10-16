import { describe, expect, it } from 'vitest';
import type { WaermeOrt } from '$lib/data/get-waerme-orte-index.js';
import { nearestWaermeOrte, openingStatusOf, waermeKategorien } from './nearest-waerme-orte.js';

function ort(over: Partial<WaermeOrt> & Pick<WaermeOrt, 'id'>): WaermeOrt {
	return {
		name: over.id,
		cat: 'Bibliothek',
		lat: 52.52,
		lng: 13.405,
		winterOpen: 'yes',
		openingHoursNote: '',
		stayWithoutPurchase: 'unknown',
		isFree: 'unknown',
		website: '',
		sourceUrl: '',
		checkedAt: '2026-10-16',
		address: '',
		plz: '',
		openingHours: '',
		googleMapsUrl: '',
		appleMapsUrl: '',
		...over
	};
}

const FROM = { lat: 52.52, lng: 13.405 };
const NOW = new Date(2026, 9, 21, 12, 0, 0); // Mittwoch

describe('nearestWaermeOrte', () => {
	const orte = [
		ort({ id: 'weit', lat: 52.6 }),
		ort({ id: 'nah', lat: 52.521 }),
		ort({ id: 'mittel', lat: 52.54, cat: 'Museum' })
	];

	it('sortiert nach Distanz und begrenzt', () => {
		const r = nearestWaermeOrte(FROM, orte, { limit: 2, now: NOW });
		expect(r.items.map((o) => o.id)).toEqual(['nah', 'mittel']);
		expect(r.items[0].distanceM).toBeGreaterThan(0);
		expect(r.total).toBe(3);
	});

	it('filtert nach Kategorie, Zähler bezieht sich auf die Auswahl', () => {
		const r = nearestWaermeOrte(FROM, orte, { category: 'Museum', limit: 5, now: NOW });
		expect(r.items.map((o) => o.id)).toEqual(['mittel']);
		expect(r.total).toBe(1);
	});

	it('liefert leere Liste für Kategorie ohne Treffer', () => {
		const r = nearestWaermeOrte(FROM, orte, { category: 'Kirche', limit: 5, now: NOW });
		expect(r.items).toEqual([]);
		expect(r.total).toBe(0);
	});

	it('ohne Position-Treffer (leerer Index) bleibt leer', () => {
		expect(nearestWaermeOrte(FROM, [], { limit: 5, now: NOW }).items).toEqual([]);
	});

	it('hängt den Öffnungsstatus nur an, wenn oh vorhanden ist', () => {
		const r = nearestWaermeOrte(
			FROM,
			[
				ort({ id: 'a', openingHours: 'Mo-Su 00:00-24:00' }),
				ort({ id: 'b', openingHours: '', openingHoursNote: 'Mo 10 bis 12 Uhr' })
			],
			{ limit: 5, now: NOW }
		);
		const byId = Object.fromEntries(r.items.map((o) => [o.id, o.status]));
		expect(byId.a).toBe('open');
		expect(byId.b).toBeNull();
	});
});

describe('openingStatusOf', () => {
	it('liefert null ohne oh oder bei unparsbarem oh', () => {
		expect(openingStatusOf('', NOW)).toBeNull();
		expect(openingStatusOf('nach Absprache irgendwie', NOW)).toBeNull();
	});

	it('liefert closed außerhalb der Zeiten', () => {
		expect(openingStatusOf('Mo-Su 03:00-04:00', NOW)).toBe('closed');
	});
});

describe('waermeKategorien', () => {
	it('liefert vorhandene Kategorien in fester Reihenfolge', () => {
		const orte = [
			ort({ id: '1', cat: 'Museum' }),
			ort({ id: '2', cat: 'Bibliothek' }),
			ort({ id: '3', cat: 'Gotteshaus' }),
			ort({ id: '4', cat: 'Sonstiges' })
		];
		expect(waermeKategorien(orte)).toEqual(['Bibliothek', 'Museum', 'Gotteshaus', 'Sonstiges']);
	});
});
