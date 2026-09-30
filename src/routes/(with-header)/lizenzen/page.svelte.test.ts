import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import {
	ariaLabels,
	internalHrefs,
	normalizedText,
	textLines
} from '../methodik/methodik-test-utils.js';
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

const sampleData = {
	manifest: sampleManifest,
	catalogDatasets: [
		{
			name: 'Lärm 2023',
			description: 'Umgebungslärm 2022 in Berlin.',
			urlPath: '/layer/laerm-2023',
			license: 'dl-de/zero-2-0' as const,
			creatorName: 'SenMVKU'
		}
	]
};

const SECTION_IDS = ['daten-lizenzen', 'software', 'schriften', 'osm-namensnennung'];

describe('lizenzen +page.svelte', () => {
	it('rendert h1 „Lizenzen"', async () => {
		render(Page, { data: sampleData });
		const h1 = (await page.getByTestId('lizenzen-page-title').element()) as HTMLElement;
		expect(h1.tagName).toBe('H1');
		expect(h1.textContent).toMatch(/Lizenzen/);
	});

	it('rendert Inhaltsverzeichnis-Nav', async () => {
		render(Page, { data: sampleData });
		await expect.element(page.getByRole('navigation', { name: /Inhalt/i })).toBeInTheDocument();
	});

	it('rendert alle Sections per id', async () => {
		render(Page, { data: sampleData });
		for (const id of SECTION_IDS) {
			const sec = document.getElementById(id);
			expect(sec, `Section #${id} fehlt`).not.toBeNull();
			expect(sec?.tagName).toBe('SECTION');
		}
	});

	it('Daten-Lizenzen-Section gruppiert Layer pro Lizenz', async () => {
		render(Page, { data: sampleData });
		const sec = document.getElementById('daten-lizenzen');
		expect(sec?.textContent).toMatch(/dl-de\/zero/);
		expect(sec?.textContent).toMatch(/dl-de\/by/);
		expect(sec?.textContent).toMatch(/ODbL/);
		expect(sec?.querySelector('a[href="/layer/laerm-2023"]')).not.toBeNull();
		expect(sec?.querySelector('a[href="/layer/wohnlagen-2024"]')).not.toBeNull();
		expect(sec?.querySelector('a[href="/layer/stolpersteine"]')).not.toBeNull();
	});

	it('Daten-Lizenzen verlinkt Lizenz-Volltexte', async () => {
		render(Page, { data: sampleData });
		const sec = document.getElementById('daten-lizenzen');
		const links = sec?.querySelectorAll('a[href^="https"]');
		expect(links?.length).toBeGreaterThanOrEqual(3);
	});

	it('Software-Section nennt SvelteKit, Svelte, MapLibre, IBM Plex', async () => {
		render(Page, { data: sampleData });
		const sw = document.getElementById('software');
		const text = sw?.textContent ?? '';
		expect(text).toMatch(/SvelteKit/);
		expect(text).toMatch(/MapLibre/);
		const fonts = document.getElementById('schriften');
		expect(fonts?.textContent).toMatch(/IBM Plex/);
	});

	it('OSM-Namensnennung-Section weist auf OpenStreetMap-Contributors hin', async () => {
		render(Page, { data: sampleData });
		const osm = document.getElementById('osm-namensnennung');
		expect(osm?.textContent).toMatch(/OpenStreetMap/);
		expect(osm?.textContent).toMatch(/ODbL/);
	});

	it('Layer-Slugs verlinken auf /layer/{slug}', async () => {
		render(Page, { data: sampleData });
		const link = document.querySelector('section#daten-lizenzen a[href="/layer/laerm-2023"]');
		expect(link).not.toBeNull();
	});
});

describe('lizenzen · DE-Parität (i18n C4c)', () => {
	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand', async () => {
		render(Page, { data: sampleData });
		const root = document.querySelector('[data-testid="lizenzen-page"]')!;
		await expect(textLines(root)).toMatchFileSnapshot('./__snapshots__/lizenzen-de-lines.txt');
		await expect(normalizedText(root)).toMatchFileSnapshot('./__snapshots__/lizenzen-de-text.txt');
		await expect(ariaLabels(root)).toMatchFileSnapshot('./__snapshots__/lizenzen-de-aria.txt');
		await expect(internalHrefs(root).join('\n') + '\n').toMatchFileSnapshot(
			'./__snapshots__/lizenzen-de-hrefs.txt'
		);
	});

	it('Meta-Title bleibt der Baseline-Titel', async () => {
		render(Page, { data: sampleData });
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Lizenzen - Berlin in Daten - navigator.berlin');
	});
});

function tocLabels(root: ParentNode): string {
	const nav = root.querySelector('nav')!;
	const parts = [nav.querySelector('p'), ...nav.querySelectorAll('li')];
	return parts.map((el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()).join(' | ');
}

describe('lizenzen · DE-Wortlaut (i18n C4c)', () => {
	const flat = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

	it('Abnahme-Korrekturen: 14 Wahlen, drei Anbieter, Lizenz-Anzahl aus den Daten', () => {
		render(Page, { data: sampleData });
		const wahl = document.getElementById('wahldaten')!;
		expect(flat(wahl.querySelector('p'))).toContain('aus 14 Berliner Wahlen seit 2011');
		expect(flat(wahl.querySelector('p'))).toContain('Quellen und Lizenz der drei Datenanbieter:');
		expect(wahl.querySelectorAll('dl > div')).toHaveLength(3);
		expect(flat(wahl)).toContain('Landeswahlleiterin Berlin');
		const daten = document.getElementById('daten-lizenzen')!;
		expect(flat(daten.querySelector('p'))).toBe(
			'Die 3 aktiven Geo-Layer stehen unter 3 verschiedenen Lizenzen. Sie sind nach Lizenz gruppiert, mit Link auf den jeweiligen Volltext.'
		);
	});

	it('Lizenz-Anzahl folgt den Daten, nicht einer festen Zahl', () => {
		render(Page, {
			data: {
				...sampleData,
				manifest: { ...sampleManifest, layers: [meta('laerm-2023', 'dl-de/zero-2-0')] }
			}
		});
		const daten = document.getElementById('daten-lizenzen')!;
		expect(flat(daten.querySelector('p'))).toBe(
			'Der aktive Geo-Layer steht unter einer Lizenz, mit Link auf den Volltext.'
		);
	});

	it('mehrere Layer unter einer Lizenz: Singular bei der Lizenz, Plural bei den Layern', () => {
		render(Page, {
			data: {
				...sampleData,
				manifest: {
					...sampleManifest,
					layers: [meta('laerm-2023', 'dl-de/zero-2-0'), meta('wohnlagen-2024', 'dl-de/zero-2-0')]
				}
			}
		});
		const daten = document.getElementById('daten-lizenzen')!;
		expect(flat(daten.querySelector('p'))).toBe(
			'Die 2 aktiven Geo-Layer stehen unter einer Lizenz. Sie sind nach Lizenz gruppiert, mit Link auf den Volltext.'
		);
	});

	it('Software-Tabelle, Abschnittsüberschriften und Links behalten den Baseline-Wortlaut', () => {
		render(Page, { data: sampleData });
		const heads = [...document.querySelectorAll('article h2')].map((h) => flat(h));
		expect(heads).toEqual([
			'Daten-Lizenzen',
			'Wahldaten',
			'Demografie',
			'Kriminalitätsatlas',
			'Klimadaten (DWD)',
			'Entitäts-Verweise',
			'Software',
			'Schriften',
			'OpenStreetMap-Namensnennung'
		]);
		const ths = [...document.querySelectorAll('#software th')].map((h) => flat(h));
		expect(ths).toEqual(['Bibliothek', 'Lizenz']);
		expect(flat(document.querySelector('#software table'))).toContain(
			'Satori + @resvg/resvg-js (OG-Image-Generator)'
		);
		expect(tocLabels(document)).toBe(
			'Inhalt | Daten-Lizenzen | Wahldaten | Demografie | Kriminalitätsatlas | Klimadaten (DWD) | Entitäts-Verweise | Software | Schriften | OpenStreetMap-Namensnennung'
		);
	});
});

describe('lizenzen · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	const flat = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

	function renderEn(): Element {
		overwriteGetLocale(() => 'en');
		render(Page, { data: sampleData });
		return document.querySelector('[data-testid="lizenzen-page"]')!;
	}

	it('H1, Intro, Inhaltsverzeichnis und Abschnitte englisch', () => {
		const root = renderEn();
		expect(root.querySelector('h1')?.textContent).toBe('Licences');
		expect(tocLabels(root)).toBe(
			'Contents | Data licences | Election data | Demographics | Crime atlas | Climate data (German Weather Service, DWD) | Entity references | Software | Fonts | OpenStreetMap attribution'
		);
		expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Contents');
		expect(flat(root.querySelector('#daten-lizenzen p'))).toBe(
			'The 3 active geo layers fall under 3 different licences. They are grouped by licence, with a link to the full text of each.'
		);
		expect(flat(root.querySelector('#wahldaten p'))).toContain('14 Berlin elections since 2011');
		expect(root.querySelectorAll('#wahldaten dl > div')).toHaveLength(3);
		expect(flat(root.querySelector('#software'))).toContain('Licence');
	});

	it('Lizenz-Labels englisch, Kennungen und Software-Namen unverändert', () => {
		const root = renderEn();
		const groups = flat(root.querySelector('#daten-lizenzen'));
		expect(groups).toContain('Data licence Germany, zero, version 2.0');
		expect(groups).toContain('Data licence Germany, attribution, version 2.0');
		expect(groups).toContain('dl-de/zero-2-0');
		expect(groups).toContain('dl-de/by-2-0');
		expect(groups).toContain('ODbL 1.0');
		expect(groups).toContain('Attribution “© OpenStreetMap contributors” plus share-alike');
		expect(flat(root.querySelector('#software'))).toContain(
			'Satori + @resvg/resvg-js (OG image generator)'
		);
		expect(root.querySelector('#software code')?.textContent).toBe('package.json');
	});

	it('Seitenlinks liegen unter /en, externe Links unverändert', () => {
		const root = renderEn();
		const hrefs = internalHrefs(root);
		expect(hrefs).toContain('/en/layer/laerm-2023');
		expect(hrefs).toContain('/en/methodik/wahldaten');
		expect(hrefs).toContain('/en/methodik/kiez-score');
		expect(hrefs.filter((h) => !h.startsWith('/en'))).toEqual([]);
		expect(root.querySelector('a[href="https://www.govdata.de/dl-de/by-2-0"]')).not.toBeNull();
		expect(root.querySelector('a[href="https://www.wahlen-berlin.de"]')).not.toBeNull();
	});

	it('enthält keinen deutschen Resttext außerhalb von Eigennamen', () => {
		const text = flat(renderEn());
		for (const word of [
			'Welche Lizenz',
			'Namensnennung 2.0',
			'Wahl-Ergebnisse',
			'Einwohner',
			'Zusätzlich',
			'Tageswerte',
			'Schriften',
			'Inhalt '
		]) {
			expect(text).not.toContain(word);
		}
	});

	it('Breadcrumb-JSON-LD englisch, DataCatalog-JSON-LD bleibt deutsch', () => {
		renderEn();
		const crumbs = JSON.parse(
			document.querySelector('[data-testid="lizenzen-breadcrumb-jsonld"]')!.textContent!
		);
		const items = crumbs.itemListElement as { name: string; item: string }[];
		expect(items.map((i) => i.name)).toEqual(['Berlin', 'Licences']);
		expect(items[1]?.item.endsWith('/en/lizenzen')).toBe(true);
		const catalog = JSON.parse(
			document.querySelector('[data-testid="lizenzen-datacatalog-jsonld"]')!.textContent!
		);
		expect(catalog.name).toBe('navigator.berlin Daten-Katalog');
		expect(catalog.description).toContain('Lizenzen aller Berliner Geo-Daten');
	});

	it('Meta-Title englisch', async () => {
		renderEn();
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Licences - Berlin in data - navigator.berlin');
	});
});

describe('lizenzen · EN Grammatik, Layer-Namen, Links (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));
	const flat = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

	it('EN: Layer-Namen englisch, CC-BY-Link auf deed.en, Tabellenkopf Library', () => {
		overwriteGetLocale(() => 'en');
		render(Page, {
			data: {
				...sampleData,
				manifest: {
					...sampleManifest,
					layers: [...sampleManifest.layers, meta('klima-pet', 'CC BY 4.0')]
				}
			}
		});
		const sec = document.getElementById('daten-lizenzen')!;
		expect(sec.textContent).toContain('Noise pollution 2023');
		expect(sec.textContent).not.toContain('Lärmbelastung');
		expect(
			sec.querySelector('a[href="https://creativecommons.org/licenses/by/4.0/deed.en"]')
		).not.toBeNull();
		expect([...document.querySelectorAll('#software th')].map((h) => flat(h))).toEqual([
			'Library',
			'Licence'
		]);
	});

	it('EN: eine Lizenz und ein Layer ergeben die singulare Grammatik', () => {
		overwriteGetLocale(() => 'en');
		render(Page, {
			data: {
				...sampleData,
				manifest: { ...sampleManifest, layers: [meta('laerm-2023', 'dl-de/zero-2-0')] }
			}
		});
		expect(flat(document.querySelector('#daten-lizenzen p'))).toBe(
			'The active geo layer falls under one licence, with a link to the full text.'
		);
	});

	it('DE: CC-BY-Link bleibt auf deed.de', () => {
		render(Page, {
			data: {
				...sampleData,
				manifest: { ...sampleManifest, layers: [meta('klima-pet', 'CC BY 4.0')] }
			}
		});
		expect(
			document.querySelector('a[href="https://creativecommons.org/licenses/by/4.0/deed.de"]')
		).not.toBeNull();
	});
});
