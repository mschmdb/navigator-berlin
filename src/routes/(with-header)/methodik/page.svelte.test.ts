import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import type { Manifest, LayerMetadata } from '$lib/data';

function meta(slug: string, bundle: LayerMetadata['bundleGroup']): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://gdi.berlin.de/wfs/x',
		fetchedAt: '2026-05-12T00:00:00.000Z',
		sourceUpdatedAt: '2024-06-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: bundle,
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: 100
	};
}

const sampleManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-13T10:00:00.000Z',
	layers: [
		meta('bezirke', 'A: Boundaries'),
		meta('laerm-2023', 'C: Umwelt'),
		meta('wohnlagen-2024', 'B: Wohn-Daten')
	]
};

const EXPECTED_SECTION_IDS = [
	'mission',
	'datenarchitektur',
	'aggregations-ebenen',
	'cross-layer',
	'coverage-strategie',
	'omissions',
	'editorial',
	'daten-stand',
	'lizenzen',
	'feedback'
];

describe('methodik +page.svelte', () => {
	it('rendert h1 „Methodik"', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const h1 = (await page.getByTestId('methodik-page-title').element()) as HTMLElement;
		expect(h1.tagName).toBe('H1');
		expect(h1.textContent).toMatch(/Methodik/);
	});

	it('rendert Inhaltsverzeichnis als nav mit aria-label', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		await expect.element(page.getByRole('navigation', { name: /Inhalt/i })).toBeInTheDocument();
	});

	it('TOC enthält Anker-Link für jede Section', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const toc = document.querySelector('[data-testid="methodik-toc"]');
		expect(toc).not.toBeNull();
		for (const id of EXPECTED_SECTION_IDS) {
			const link = toc?.querySelector(`a[href="#${id}"]`);
			expect(link, `TOC fehlt Anker zu #${id}`).not.toBeNull();
		}
	});

	it('rendert alle 10 Pflicht-Sections mit id', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		for (const id of EXPECTED_SECTION_IDS) {
			const sec = document.getElementById(id);
			expect(sec, `Section #${id} fehlt`).not.toBeNull();
			expect(sec?.tagName).toBe('SECTION');
		}
	});

	it('jede Section hat aria-labelledby zu eigenem h2', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		for (const id of EXPECTED_SECTION_IDS) {
			const sec = document.getElementById(id);
			const headerId = sec?.getAttribute('aria-labelledby');
			expect(headerId, `Section #${id} ohne aria-labelledby`).toBeTruthy();
			const h2 = headerId ? document.getElementById(headerId) : null;
			expect(h2?.tagName, `h2 zu Section #${id} fehlt`).toBe('H2');
		}
	});

	it('rendert Daten-Stand-Tabelle mit allen Manifest-Layern', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const rows = document.querySelectorAll('[data-testid="methodik-daten-table"] tbody tr');
		expect(rows.length).toBe(3);
	});

	it('rendert Pipeline-Diagram', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		await expect
			.element(page.getByTestId('methodik-pipeline-diagram'))
			.toBeInTheDocument();
	});

	it('rendert JSON-LD-Schema TechArticle', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="methodik-jsonld"]'
		);
		expect(script).not.toBeNull();
		const parsed = JSON.parse(script?.textContent ?? '{}');
		expect(parsed['@type']).toBe('TechArticle');
		expect(parsed.headline).toMatch(/Methodik/);
	});

	it('Editorial-Section erwähnt Stolperstein-Würde und Anti-Composite', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const editorial = document.getElementById('editorial');
		const text = editorial?.textContent ?? '';
		expect(text).toMatch(/Stolperstein/);
		expect(text).toMatch(/Composite|Single-Score|Berlin-Score/i);
	});

	it('Omissions-Section erwähnt Cookies, Tracker, kommerzielle Mietpreise', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const omissions = document.getElementById('omissions');
		const text = omissions?.textContent ?? '';
		expect(text).toMatch(/Cookie/i);
		expect(text).toMatch(/Tracker|Tracking/i);
		expect(text).toMatch(/Miet/i);
	});

	it('Feedback-Section hat mailto-Link', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const feedback = document.getElementById('feedback');
		const mailto = feedback?.querySelector('a[href^="mailto:"]');
		expect(mailto).not.toBeNull();
	});
});
