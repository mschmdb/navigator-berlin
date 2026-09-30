import { m } from '$lib/paraglide/messages.js';
import { describe, expect, it } from 'vitest';
import { buildPlace } from './jsonld-place.js';

describe('buildPlace', () => {
	it('hat @context + @type Place + name', () => {
		const out = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Kreuzkölln',
			centroid: [13.42, 52.49]
		});
		expect(out['@context']).toBe('https://schema.org');
		expect(out['@type']).toBe('Place');
		expect(out.name).toBe('Kreuzkölln');
	});

	it('mappt centroid [lng, lat] auf GeoCoordinates {latitude, longitude}', () => {
		const out = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Bezirk X',
			centroid: [13.42, 52.49]
		});
		expect(out.geo['@type']).toBe('GeoCoordinates');
		expect(out.geo.latitude).toBe(52.49);
		expect(out.geo.longitude).toBe(13.42);
	});

	it('containedInPlace optional', () => {
		const without = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Berlin',
			centroid: [13.4, 52.5]
		});
		expect(without.containedInPlace).toBeUndefined();

		const withParent = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Kreuzberg',
			centroid: [13.4, 52.5],
			containedInPlaceName: 'Berlin'
		});
		const parent = withParent.containedInPlace;
		expect(parent?.['@type']).toBe('Place');
		expect(parent?.name).toBe('Berlin');
	});

	it('additionalProperty: einwohner + flaecheHa als PropertyValue', () => {
		const out = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Bezirk Y',
			centroid: [13.4, 52.5],
			einwohner: 250_000,
			flaecheHa: 1234.5
		});
		const props = out.additionalProperty;
		expect(Array.isArray(props)).toBe(true);
		expect(props).toHaveLength(2);
		expect(props?.some((p) => p.name === 'einwohner' && p.value === 250_000)).toBe(true);
		expect(props?.some((p) => p.name === 'flaecheHa' && p.value === 1234.5)).toBe(true);
	});

	it('url wird aus origin + slug gebaut wenn beide gesetzt', () => {
		const out = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Kreuzkölln',
			centroid: [13.42, 52.49],
			slug: 'kreuzkoelln',
			urlBasePath: '/kiez'
		});
		expect(out.url).toBe('https://navigator.berlin/kiez/kreuzkoelln');
	});

	it('i18n Block D1: locale=en präfigiert die url mit /en', () => {
		const out = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Kreuzkölln',
			centroid: [13.42, 52.49],
			slug: 'kreuzkoelln',
			urlBasePath: '/kiez',
			locale: 'en'
		});
		expect(out.url).toBe('https://navigator.berlin/en/kiez/kreuzkoelln');
	});

	it('i18n Block D1: locale=de lässt die url unpräfigiert', () => {
		const out = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Kreuzkölln',
			centroid: [13.42, 52.49],
			slug: 'kreuzkoelln',
			urlBasePath: '/kiez',
			locale: 'de'
		});
		expect(out.url).toBe('https://navigator.berlin/kiez/kreuzkoelln');
	});

	it('i18n Block D1: propertyNames ersetzen die additionalProperty-Namen', () => {
		const out = buildPlace({
			origin: 'https://navigator.berlin',
			name: 'Kreuzkölln',
			centroid: [13.42, 52.49],
			einwohner: 10,
			flaecheHa: 20,
			propertyNames: { einwohner: 'Population', flaecheHa: 'Area (ha)' }
		});
		expect(out.additionalProperty?.map((p) => p.name)).toEqual(['Population', 'Area (ha)']);
	});

	it('i18n Block D1: Messages für additionalProperty-Namen sind Klartext in DE und EN', () => {
		expect(m.jsonld_property_einwohner(undefined, { locale: 'de' })).toBe('Einwohner');
		expect(m.jsonld_property_flaeche_ha(undefined, { locale: 'de' })).toBe('Fläche (ha)');
		expect(m.jsonld_property_einwohner(undefined, { locale: 'en' })).toBe('Population');
		expect(m.jsonld_property_flaeche_ha(undefined, { locale: 'en' })).toBe('Area (ha)');
	});
});
