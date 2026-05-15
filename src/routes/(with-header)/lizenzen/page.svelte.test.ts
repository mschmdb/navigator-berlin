import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import type { Manifest, LayerMetadata } from '$lib/data';

function meta(slug: string, license: LayerMetadata['license']): LayerMetadata {
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
		featureCount: 100
	};
}

const sampleManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-13T10:00:00.000Z',
	layers: [
		meta('laerm-2023', 'dl-de/zero-2-0'),
		meta('wohnlagen-2024', 'dl-de/by-2-0'),
		meta('stolpersteine', 'ODbL 1.0')
	]
};

const SECTION_IDS = [
	'daten-lizenzen',
	'software',
	'schriften',
	'osm-namensnennung'
];

describe('lizenzen +page.svelte', () => {
	it('rendert h1 „Lizenzen"', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const h1 = (await page.getByTestId('lizenzen-page-title').element()) as HTMLElement;
		expect(h1.tagName).toBe('H1');
		expect(h1.textContent).toMatch(/Lizenzen/);
	});

	it('rendert Inhaltsverzeichnis-Nav', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		await expect.element(page.getByRole('navigation', { name: /Inhalt/i })).toBeInTheDocument();
	});

	it('rendert alle Sections per id', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		for (const id of SECTION_IDS) {
			const sec = document.getElementById(id);
			expect(sec, `Section #${id} fehlt`).not.toBeNull();
			expect(sec?.tagName).toBe('SECTION');
		}
	});

	it('Daten-Lizenzen-Section gruppiert Layer pro Lizenz', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const sec = document.getElementById('daten-lizenzen');
		expect(sec?.textContent).toMatch(/dl-de\/zero/);
		expect(sec?.textContent).toMatch(/dl-de\/by/);
		expect(sec?.textContent).toMatch(/ODbL/);
		expect(sec?.querySelector('a[href="/layer/laerm-2023"]')).not.toBeNull();
		expect(sec?.querySelector('a[href="/layer/wohnlagen-2024"]')).not.toBeNull();
		expect(sec?.querySelector('a[href="/layer/stolpersteine"]')).not.toBeNull();
	});

	it('Daten-Lizenzen verlinkt Lizenz-Volltexte', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const sec = document.getElementById('daten-lizenzen');
		const links = sec?.querySelectorAll('a[href^="https"]');
		expect(links?.length).toBeGreaterThanOrEqual(3);
	});

	it('Software-Section nennt SvelteKit, Svelte, MapLibre, IBM Plex', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const sw = document.getElementById('software');
		const text = sw?.textContent ?? '';
		expect(text).toMatch(/SvelteKit/);
		expect(text).toMatch(/MapLibre/);
		const fonts = document.getElementById('schriften');
		expect(fonts?.textContent).toMatch(/IBM Plex/);
	});

	it('OSM-Namensnennung-Section weist auf OpenStreetMap-Contributors hin', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const osm = document.getElementById('osm-namensnennung');
		expect(osm?.textContent).toMatch(/OpenStreetMap/);
		expect(osm?.textContent).toMatch(/ODbL/);
	});

	it('Layer-Slugs verlinken auf /layer/{slug}', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const link = document.querySelector('section#daten-lizenzen a[href="/layer/laerm-2023"]');
		expect(link).not.toBeNull();
	});
});
