import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import { internalHrefs, textLines } from './methodik-test-utils.js';
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
	'karten-darstellung',
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
		await expect.element(page.getByTestId('methodik-pipeline-diagram')).toBeInTheDocument();
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

	it('Kühle-Orte-Section erklärt Score, Anreicherung, AC-Ehrlichkeit + Lizenz-Link (Story 15.6)', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const sec = document.getElementById('kuehle-orte');
		expect(sec).not.toBeNull();
		expect(sec?.textContent).toMatch(/Kühle-Score/);
		expect(sec?.textContent).toMatch(/29 von 659/);
		expect(sec?.textContent).toMatch(/OpenStreetMap/);
		await expect.element(page.getByTestId('methodik-kuehle-orte-link')).toBeInTheDocument();
	});
});

describe('methodik +page.svelte · DE unverändert (i18n C4a)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand vor C4a', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const article = document.querySelector('[data-testid="methodik-page"]')!;
		await expect(textLines(article)).toMatchFileSnapshot('./__snapshots__/methodik-de.txt');
	});

	it('DE-Links bleiben ohne Locale-Präfix', async () => {
		render(Page, { data: { manifest: sampleManifest } });
		const article = document.querySelector('[data-testid="methodik-page"]')!;
		const hrefs = internalHrefs(article);
		expect(hrefs).toContain('/methodik/kiez-score');
		expect(hrefs).toContain('/methodik/wahldaten');
		expect(hrefs).toContain('/berlin-wahlen#alle-wahlen');
		expect(hrefs).toContain('/lizenzen');
		expect(hrefs.some((h) => h.startsWith('/en'))).toBe(false);
	});
});

describe('methodik +page.svelte · EN (i18n C4a)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('rendert Titel, Inhaltsverzeichnis und Sektionsüberschriften auf Englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { manifest: sampleManifest } });
		const h1 = document.querySelector('[data-testid="methodik-page-title"]');
		expect(h1?.textContent?.trim()).toBe('Methodology');
		await expect.element(page.getByRole('navigation', { name: 'Contents' })).toBeInTheDocument();
		const tocLabels = [...document.querySelectorAll('[data-testid="methodik-toc"] li a')].map((a) =>
			a.textContent?.trim()
		);
		expect(tocLabels).toContain('Aggregation levels');
		expect(tocLabels).toContain('What “Kiez” means here');
		expect(tocLabels).toContain('Sources and licences');
	});

	it('setzt die Layer-Anzahl als Parameter in den Lead-Absatz', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { manifest: sampleManifest } });
		expect(document.querySelector('#mission p')?.textContent).toContain(
			'collects 3 public Berlin geodata sets'
		);
	});

	it('alle internen Links liegen unter /en, inklusive Wahldaten', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { manifest: sampleManifest } });
		const article = document.querySelector('[data-testid="methodik-page"]')!;
		const hrefs = internalHrefs(article);
		expect(hrefs.length).toBeGreaterThan(5);
		expect(hrefs.filter((h) => !h.startsWith('/en/'))).toEqual([]);
		expect(hrefs).toContain('/en/methodik/wahldaten');
		expect(hrefs).toContain('/en/methodik/kiez-score');
		expect(hrefs).toContain('/en/berlin-wahlen#alle-wahlen');
		expect(hrefs).toContain('/en/lizenzen');
	});

	it('trägt kein lang="de" und keinen deutschen Resttext', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { manifest: sampleManifest } });
		const article = document.querySelector('[data-testid="methodik-page"]')!;
		expect(article.querySelector('[lang="de"]')).toBeNull();
		const text = article.textContent ?? '';
		for (const german of ['Worum es geht', 'Datenarchitektur', 'Kühle', 'Lärm', 'Daten-Stand']) {
			expect(text, german).not.toContain(german);
		}
	});

	it('Feedback-Mail trägt den englischen Betreff', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { manifest: sampleManifest } });
		const mailto = document.querySelector('#feedback a[href^="mailto:"]');
		expect(mailto?.getAttribute('href')).toContain('subject=Methodology%20feedback');
	});

	it('JSON-LD folgt der Locale: Headline, Beschreibung, Sprache, Breadcrumb', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { manifest: sampleManifest } });
		const tech = JSON.parse(
			document.querySelector('script[data-testid="methodik-jsonld"]')?.textContent ?? '{}'
		);
		expect(tech.headline).toBe('Data methodology');
		expect(tech.description).toMatch(/^Methodology of the Berlin data atlas/);
		expect(tech.inLanguage).toBe('en-US');
		const crumbs = JSON.parse(
			document.querySelector('script[data-testid="methodik-breadcrumb-jsonld"]')?.textContent ??
				'{}'
		);
		expect(crumbs.itemListElement[0].item).toMatch(/\/en\/$/);
		expect(crumbs.itemListElement[1].name).toBe('Methodology');
		expect(crumbs.itemListElement[1].item).toMatch(/\/en\/methodik$/);
	});
});
