import { describe, expect, it } from 'vitest';
import { buildLayerMeta, layerBenefit, themeLabel, type LayerMetaInput } from './layer-meta.js';
import type { Bundle } from '$lib/data/types.js';

const kino: LayerMetaInput = {
	layerName: 'Kino',
	lead: 'Kino',
	bundle: 'J: Kultur',
	authority: 'OpenStreetMap',
	sourceUpdatedAt: '2026-01-01T00:00:00.000Z',
	benefit: 'map',
	locale: 'de'
};

const BUNDLES: readonly Bundle[] = [
	'A: Boundaries',
	'B: Wohn-Daten',
	'C: Umwelt',
	'D: Memorial',
	'E: Soziale Infrastruktur',
	'F: Mobilität',
	'G: Kiez-Score',
	'H: Wahldaten',
	'I: Demografie',
	'J: Kultur'
];

describe('themeLabel', () => {
	it('liefert DE-Themen ohne englisches Rohlabel', () => {
		expect(themeLabel('A: Boundaries', 'de')).toBe('Verwaltungsgrenzen');
		expect(themeLabel('D: Memorial', 'de')).toBe('Gedenken');
		expect(themeLabel('J: Kultur', 'de')).toBe('Kultur');
	});

	it('liefert EN-Themen', () => {
		expect(themeLabel('J: Kultur', 'en')).toBe('Culture');
		expect(themeLabel('A: Boundaries', 'en')).toBe('Administrative boundaries');
	});

	it('kennt alle Bundles ohne Buchstaben-Präfix', () => {
		for (const bundle of BUNDLES) {
			for (const locale of ['de', 'en'] as const) {
				expect(themeLabel(bundle, locale)).not.toMatch(/^[A-J][:·]/);
			}
		}
	});
});

describe('layerBenefit', () => {
	const polygon = {
		geometryType: 'Polygon',
		inspectorRelevant: undefined,
		bundleGroup: 'C: Umwelt'
	} as const;

	it('Fläche mit Kiez-Aggregat gilt je Adresse und Kiez', () => {
		expect(layerBenefit(polygon, true)).toBe('address-kiez');
		expect(
			layerBenefit({ ...polygon, geometryType: 'MultiPolygon', inspectorRelevant: true }, true)
		).toBe('address-kiez');
	});

	it('Fläche ohne Kiez-Aggregat gilt nur je Adresse', () => {
		expect(layerBenefit(polygon, false)).toBe('address');
	});

	it('Layer ohne Inspector-Treffer, Punkte, Linien und Grenzen sind neutral', () => {
		expect(layerBenefit({ ...polygon, inspectorRelevant: false }, true)).toBe('map');
		expect(layerBenefit({ ...polygon, geometryType: 'Point' }, true)).toBe('map');
		expect(layerBenefit({ ...polygon, geometryType: 'LineString' }, true)).toBe('map');
		expect(layerBenefit({ ...polygon, bundleGroup: 'A: Boundaries' }, true)).toBe('map');
	});
});

describe('buildLayerMeta Titel', () => {
	it('Layer-Name mit Marke', () => {
		expect(buildLayerMeta(kino).title).toBe('Kino | navigator.berlin');
	});

	it('lässt die Marke bei langem Namen weg', () => {
		const layerName = 'Städtebauliche Erhaltungsverordnung (Stadtbildschutz) Berlin';
		expect(buildLayerMeta({ ...kino, layerName }).title).toBe(layerName);
	});
});

describe('buildLayerMeta Beschreibung', () => {
	it('DE: Kurztext, Thema, Quelle, Jahr und Nutzensatz', () => {
		expect(buildLayerMeta(kino).description).toBe(
			'Kino. Kultur. Quelle: OpenStreetMap, Stand 2026. Als Kartenebene im Daten-Atlas von navigator.berlin, mit Quelle und Lizenz.'
		);
	});

	it('DE: Nutzensatz je Adresse und Kiez', () => {
		const { description } = buildLayerMeta({ ...kino, benefit: 'address-kiez' });
		expect(description.endsWith('Auf der Karte je Adresse und Kiez.')).toBe(true);
	});

	it('DE: Nutzensatz je Adresse', () => {
		const { description } = buildLayerMeta({ ...kino, benefit: 'address' });
		expect(description.endsWith('Auf der Karte je Adresse, mit Quelle und Lizenz.')).toBe(true);
	});

	it('EN: übersetzt die Rahmensätze', () => {
		const { description } = buildLayerMeta({ ...kino, bundle: 'J: Kultur', locale: 'en' });
		expect(description).toBe(
			'Kino. Culture. Source: OpenStreetMap, as of 2026. As a map layer in the navigator.berlin data atlas, with source and licence.'
		);
	});

	it('DE: enthält kein englisches Rohlabel für Gruppe A', () => {
		const { description } = buildLayerMeta({ ...kino, bundle: 'A: Boundaries' });
		expect(description).toContain('Verwaltungsgrenzen');
		expect(description).not.toContain('Boundaries');
	});

	it('ohne Herausgeber und Jahr bleiben mindestens 70 Zeichen (DE/EN, alle Nutzensätze)', () => {
		for (const locale of ['de', 'en'] as const) {
			const { description } = buildLayerMeta({
				...kino,
				authority: undefined,
				sourceUpdatedAt: undefined,
				benefit: 'map',
				locale
			});
			expect(description.length).toBeGreaterThanOrEqual(70);
		}
	});

	it('Fallback-Herausgeber navigator.berlin entfällt', () => {
		const { description } = buildLayerMeta({ ...kino, authority: 'navigator.berlin' });
		expect(description).not.toContain('Quelle:');
	});

	it('wiederholt das Jahr nicht, wenn der Kurztext es schon nennt', () => {
		const { description } = buildLayerMeta({
			...kino,
			lead: 'Durchschnittlicher Grundstückspreis pro Quadratmeter (Stand 2026)'
		});
		expect(description.match(/2026/g)).toHaveLength(1);
	});

	it('erkennt das Jahr nur an der Wortgrenze', () => {
		const { description } = buildLayerMeta({ ...kino, lead: 'Zensus 120261 Wohnungen' });
		expect(description).toContain('Stand 2026');
	});

	it('bestimmt das Jahr in der Zeitzone Berlin', () => {
		const { description } = buildLayerMeta({
			...kino,
			sourceUpdatedAt: '2024-12-31T23:30:00.000Z'
		});
		expect(description).toContain('Stand 2025');
	});

	it('kürzt auf höchstens 160 Zeichen und behält den Nutzensatz', () => {
		const { description } = buildLayerMeta({
			...kino,
			lead: 'Strukturelle soziale Lage je Planungsraum (MSS 2025, SenStadt Berlin) mit langer Erklärung',
			authority: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt Berlin (SenMVKU)'
		});
		expect(description.length).toBeLessThanOrEqual(160);
		expect(description.endsWith('mit Quelle und Lizenz.')).toBe(true);
	});

	it('behält bei sehr langem Kurztext Nutzensatz und kürzt an der Wortgrenze mit Auslassung', () => {
		const lead = 'Wort '.repeat(60).trim();
		for (const benefit of ['map', 'address', 'address-kiez'] as const) {
			const { description } = buildLayerMeta({ ...kino, lead, benefit });
			expect(description.length).toBeLessThanOrEqual(160);
			expect(description).toContain('… ');
			expect(description).not.toMatch(/Wor… /);
			expect(description).toMatch(/Wort… /);
		}
	});

	it('hängt keinen zweiten Punkt an einen Kurztext mit Satzende an', () => {
		expect(buildLayerMeta({ ...kino, lead: 'Kino.' }).description.startsWith('Kino. Kultur')).toBe(
			true
		);
		expect(buildLayerMeta({ ...kino, lead: 'Kino?' }).description.startsWith('Kino? Kultur')).toBe(
			true
		);
		expect(buildLayerMeta({ ...kino, lead: 'Kino…' }).description.startsWith('Kino… Kultur')).toBe(
			true
		);
	});

	it('Fallback ohne Kurztext nutzt den Layer-Namen', () => {
		expect(
			buildLayerMeta({ ...kino, lead: undefined }).description.startsWith('Kino. Kultur')
		).toBe(true);
		expect(buildLayerMeta({ ...kino, lead: '  ' }).description.startsWith('Kino. Kultur')).toBe(
			true
		);
	});
});
