import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { LayerMetadata, License } from '$lib/data';
import {
	getLicenseInfo,
	getRuntimeSoftware,
	getSections,
	groupByLicense
} from './lizenzen-content.js';

function meta(slug: string, license: License): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://gdi.berlin.de/wfs/x',
		fetchedAt: '2026-05-12T00:00:00.000Z',
		sourceUpdatedAt: '2024-06-01T00:00:00.000Z',
		license,
		sha256: 'a'.repeat(64),
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: 1
	};
}

describe('lizenzen-content', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('kennt neun Abschnitte mit stabilen Anker-IDs', () => {
		expect(getSections().map((s) => s.id)).toEqual([
			'daten-lizenzen',
			'wahldaten',
			'demografie',
			'kriminalitaetsatlas',
			'klimadaten-dwd',
			'entitaets-verweise',
			'software',
			'schriften',
			'osm-namensnennung'
		]);
	});

	it('liefert Lizenz-Infos mit unveränderter Kennung und URL, Label je Locale', () => {
		expect(getLicenseInfo('dl-de/by-2-0')).toMatchObject({
			key: 'dl-de/by-2-0',
			label: 'Datenlizenz Deutschland Namensnennung 2.0',
			url: 'https://www.govdata.de/dl-de/by-2-0'
		});
		overwriteGetLocale(() => 'en');
		expect(getLicenseInfo('dl-de/by-2-0')).toMatchObject({
			key: 'dl-de/by-2-0',
			label: 'Data licence Germany, attribution, version 2.0',
			url: 'https://www.govdata.de/dl-de/by-2-0'
		});
	});

	it('CC-BY-Link zeigt auf deed.de in DE und deed.en in EN', () => {
		expect(getLicenseInfo('CC BY 4.0').url).toBe(
			'https://creativecommons.org/licenses/by/4.0/deed.de'
		);
		overwriteGetLocale(() => 'en');
		expect(getLicenseInfo('CC BY 4.0').url).toBe(
			'https://creativecommons.org/licenses/by/4.0/deed.en'
		);
	});

	it('Fallback für unbekannte Lizenz zeigt die Kennung und den Volltext-Hinweis', () => {
		const unknown = 'XYZ 9' as License;
		expect(getLicenseInfo(unknown)).toEqual({
			key: unknown,
			label: 'XYZ 9',
			summary: 'Lizenz-Volltext siehe Quelle.',
			url: '#'
		});
		overwriteGetLocale(() => 'en');
		expect(getLicenseInfo(unknown).summary).toBe('See the source for the full licence text.');
	});

	it('gruppiert nach Lizenz und sortiert innerhalb der Gruppe nach Anzeigename', () => {
		const groups = groupByLicense(
			[
				meta('wohnlagen-2024', 'CC BY 4.0'),
				meta('laerm-2023', 'CC BY 4.0'),
				meta('stolpersteine', 'ODbL 1.0')
			],
			'de'
		);
		expect([...groups.keys()]).toEqual(['CC BY 4.0', 'ODbL 1.0']);
		const names = groups.get('CC BY 4.0')!.map((l) => l.slug);
		expect(names).toEqual(['laerm-2023', 'wohnlagen-2024']);
	});

	it('leere Layer-Liste ergibt keine Gruppen', () => {
		expect(groupByLicense([], 'en').size).toBe(0);
	});

	it('Software-Tabelle übersetzt nur den OG-Generator-Eintrag', () => {
		const de = getRuntimeSoftware().map((s) => s.name);
		overwriteGetLocale(() => 'en');
		const en = getRuntimeSoftware().map((s) => s.name);
		const changed = de.filter((name, i) => name !== en[i]);
		expect(changed).toEqual(['Satori + @resvg/resvg-js (OG-Image-Generator)']);
		expect(en).toContain('Satori + @resvg/resvg-js (OG image generator)');
	});
});
