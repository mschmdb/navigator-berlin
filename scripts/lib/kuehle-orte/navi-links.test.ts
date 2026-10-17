import { describe, expect, it } from 'vitest';
import { buildNaviLinks } from './navi-links.js';

describe('buildNaviLinks', () => {
	it('Google: Textziel mit Name, Straße und PLZ; Apple: place?coordinate mit Name', () => {
		const links = buildNaviLinks(52.5234, 13.3312, {
			name: 'Heilandskirche',
			street: 'Thusnelda-Allee 1',
			plz: '10555'
		});
		expect(links.googleMapsUrl).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=Heilandskirche%2C%20Thusnelda-Allee%201%2C%2010555%20Berlin'
		);
		expect(links.appleMapsUrl).toBe(
			'https://maps.apple.com/place?coordinate=52.5234,13.3312&name=Heilandskirche'
		);
	});

	it('ohne Straße: Name, PLZ Berlin', () => {
		const links = buildNaviLinks(52.5, 13.4, { name: 'Kino X', plz: '10999' });
		expect(links.googleMapsUrl).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=Kino%20X%2C%2010999%20Berlin'
		);
	});

	it('ohne PLZ: Google nutzt Koordinaten, Apple Koordinaten plus Name', () => {
		const links = buildNaviLinks(52.5, 13.4, { name: 'Kino X', street: 'Teststr 1' });
		expect(links.googleMapsUrl).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=52.5,13.4'
		);
		expect(links.appleMapsUrl).toBe(
			'https://maps.apple.com/place?coordinate=52.5,13.4&name=Kino%20X'
		);
	});

	it('leere oder Leerzeichen-PLZ zählt als keine PLZ', () => {
		for (const plz of ['', '   ']) {
			expect(buildNaviLinks(52.5, 13.4, { name: 'Kino X', plz }).googleMapsUrl).toContain(
				'destination=52.5,13.4'
			);
		}
	});

	it('Straße ohne Buchstaben (nur Hausnummer) entfällt', () => {
		const links = buildNaviLinks(52.5, 13.4, { name: 'Galeria', street: '9', plz: '10178' });
		expect(links.googleMapsUrl).toContain('destination=Galeria%2C%2010178%20Berlin');
	});

	it('leere oder Leerzeichen-Straße entfällt', () => {
		for (const street of ['', '   ']) {
			expect(
				buildNaviLinks(52.5, 13.4, { name: 'Kino X', street, plz: '10999' }).googleMapsUrl
			).toContain('destination=Kino%20X%2C%2010999%20Berlin');
		}
	});

	it('ersetzt Kommas in Name und Straße durch Leerzeichen', () => {
		const links = buildNaviLinks(52.5, 13.4, {
			name: 'A, B',
			street: 'Fasanenstraße 86,87,88',
			plz: '10623'
		});
		expect(links.googleMapsUrl).toBe(
			`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('A B, Fasanenstraße 86 87 88, 10623 Berlin')}`
		);
		expect(links.appleMapsUrl).toContain('&name=A%20B');
	});

	it('kodiert Sonderzeichen und Umlaute', () => {
		const links = buildNaviLinks(52.5, 13.4, {
			name: 'Café & Bar Müller',
			street: 'Straße #1',
			plz: '10115'
		});
		expect(links.googleMapsUrl).toContain(
			'destination=Caf%C3%A9%20%26%20Bar%20M%C3%BCller%2C%20Stra%C3%9Fe%20%231%2C%2010115%20Berlin'
		);
		expect(links.appleMapsUrl).toContain('&name=Caf%C3%A9%20%26%20Bar%20M%C3%BCller');
	});

	it('hält Koordinaten unverändert in lat,lon-Reihenfolge', () => {
		const links = buildNaviLinks(-0.5, 13.100001, { name: 'X' });
		expect(links.appleMapsUrl).toContain('coordinate=-0.5,13.100001');
	});

	it('Fallback ohne Name: Koordinaten', () => {
		const links = buildNaviLinks(52.5343784, 13.3596231);
		expect(links.googleMapsUrl).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=52.5343784,13.3596231'
		);
		expect(links.appleMapsUrl).toBe(
			'https://maps.apple.com/place?coordinate=52.5343784,13.3596231'
		);
	});

	it('leerer oder Leerzeichen-Name zählt als kein Name', () => {
		expect(buildNaviLinks(52.5, 13.4, { name: '  ' }).googleMapsUrl).toContain(
			'destination=52.5,13.4'
		);
	});
});
