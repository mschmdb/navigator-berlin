import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { WaermeOrt } from '$lib/data/get-waerme-orte-index.js';
import {
	checkedText,
	counterText,
	feeText,
	reportHref,
	stayText,
	statusClass,
	statusSourceOf,
	statusText,
	winterText
} from './waerme-ort-labels.js';

afterEach(() => overwriteGetLocale(() => 'de'));

const ORT: WaermeOrt = {
	id: 'a',
	name: 'Zentralbibliothek',
	cat: 'Bibliothek',
	lat: 52.52,
	lng: 13.4,
	winterOpen: 'yes',
	openingHoursNote: '',
	stayWithoutPurchase: 'yes',
	isFree: 'free',
	website: '',
	sourceUrl: 'https://example.org/bib',
	checkedAt: '2026-10-16',
	address: 'Beispielstraße 1',
	plz: '10115',
	openingHours: '',
	hoursSource: null,
	googleMapsUrl: '',
	appleMapsUrl: ''
};

describe('statusSourceOf', () => {
	it('mappt hoursSource auf die Label-Quelle', () => {
		expect(statusSourceOf({ hoursSource: 'recherche' })).toBe('recherche');
		expect(statusSourceOf({ hoursSource: 'osm' })).toBe('osm');
		expect(statusSourceOf({ hoursSource: 'unklar' })).toBe('osm');
		expect(statusSourceOf({ hoursSource: null })).toBe('osm');
	});
});

describe('statusText', () => {
	it('benennt alle Status „laut OSM“', () => {
		expect(statusText('open', 'osm', 'de')).toBe('laut OSM jetzt offen');
		expect(statusText('closing-soon', 'osm', 'de')).toBe('laut OSM schließt bald');
		expect(statusText('closed', 'osm', 'de')).toBe('laut OSM geschlossen');
	});
	it('benennt alle Status „laut Recherche“', () => {
		expect(statusText('open', 'recherche', 'de')).toBe('laut Recherche jetzt offen');
		expect(statusText('closing-soon', 'recherche', 'de')).toBe('laut Recherche schließt bald');
		expect(statusText('closed', 'recherche', 'de')).toBe('laut Recherche geschlossen');
	});
	it('übersetzt nach EN', () => {
		expect(statusText('open', 'osm', 'en')).not.toBe(statusText('open', 'osm', 'de'));
		expect(statusText('open', 'recherche', 'en')).toBe('open now per research');
	});
});

describe('statusClass', () => {
	it('liefert je Status eine eigene Farbklasse', () => {
		expect(statusClass('open')).toContain('success');
		expect(statusClass('closing-soon')).toContain('warning');
		expect(statusClass('closed')).toContain('ink-muted');
	});
});

describe('winterText / stayText / feeText', () => {
	it('unknown bleibt „nicht geprüft“', () => {
		expect(winterText('unknown', 'de')).toContain('nicht geprüft');
		expect(stayText('unknown', 'de')).toContain('nicht geprüft');
		expect(feeText('unknown', 'de')).toContain('nicht geprüft');
	});
	it('kennt alle Werte', () => {
		expect(winterText('yes', 'de')).toBe('Im Winter geöffnet');
		expect(winterText('limited', 'de')).toBe('Im Winter eingeschränkt geöffnet');
		expect(winterText('no', 'de')).toBe('Im Winter geschlossen');
		expect(stayText('yes', 'de')).toBe('Aufenthalt ohne Konsum: ja');
		expect(stayText('no', 'de')).toBe('Aufenthalt ohne Konsum: nein');
		expect(feeText('free', 'de')).toBe('Eintritt frei');
		expect(feeText('ticket', 'de')).toBe('Eintritt kostet');
	});
	it('folgt dem übergebenen Locale', () => {
		overwriteGetLocale(() => 'de');
		expect(winterText('yes', 'en')).toMatch(/winter/i);
		expect(winterText('yes', 'en')).not.toContain('Im Winter');
	});
});

describe('checkedText', () => {
	it('formatiert das Prüfdatum lang im Locale', () => {
		expect(checkedText('2026-10-16', 'de')).toBe('geprüft am 16. Oktober 2026');
		expect(checkedText('2026-10-16', 'en')).toContain('October');
	});
	it('fällt bei unlesbarem Datum auf den Rohwert zurück', () => {
		expect(checkedText('kaputt', 'de')).toContain('kaputt');
	});
});

describe('counterText', () => {
	it('nennt Anzahl und Gesamt', () => {
		expect(counterText(5, 12, 'de')).toBe('5 von 12 Orten, nächste zuerst');
	});
});

describe('reportHref', () => {
	it('baut eine Mail mit ID, Adresse und Kategorie-Label', () => {
		const href = decodeURIComponent(reportHref(ORT, 'de'));
		expect(href.startsWith('mailto:')).toBe(true);
		expect(href).toContain('Zentralbibliothek (a)');
		expect(href).toContain('Beispielstraße 1, 10115');
		expect(href).toContain('Kategorie: Bibliothek');
		expect(href).toContain('Layer: waerme-orte');
	});
	it('nutzt das Kategorie-Label des Locale', () => {
		expect(decodeURIComponent(reportHref(ORT, 'en'))).toContain('Kategorie: Library');
	});
	it('lässt fehlende Quelle und Prüfdatum weg', () => {
		const href = decodeURIComponent(reportHref({ ...ORT, sourceUrl: '', checkedAt: '' }, 'de'));
		expect(href).not.toContain('Quelle:');
		expect(href).not.toContain('Geprüft am:');
	});
});
