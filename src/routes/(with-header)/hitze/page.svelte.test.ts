import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { readDatasetJsonLd } from '$lib/seo/dataset-jsonld-test-utils.js';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { page as appPage } from '$app/state';
import { canonicalOrigin } from '$lib/seo/canonical.js';
import { getLayerMethodology } from '$lib/data/layer-methodology.js';
import Page from './+page.svelte';
import {
	ariaLabels,
	internalHrefs,
	normalizedText,
	textLines
} from '../methodik/methodik-test-utils.js';

const DATASET_SOURCE = {
	slug: 'kuehle-orte',
	format: 'geojson' as const,
	dateModified: '2026-08-08T10:55:22.829Z',
	sourceUrl: 'https://www.openstreetmap.org/copyright'
};

describe('Hitze-Home (Spin-off-Route)', () => {
	it('hat genau ein h1 mit dem Hitze-Titel', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Hitze-Navigator Berlin');
	});

	it('CTA führt auf den Kühle-Orte-Explorer-Deep-Link', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		await expect
			.element(page.getByTestId('hitze-cta'))
			.toHaveAttribute('href', '/explore?layers=kuehle-orte&mode=hitze');
	});

	it('gerenderter Text enthält keine em-dashes (U+2014)', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		const text = (await page.getByTestId('hitze-landing').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});

	// i18n Block B2 Review-Fund: die Hitze-Subdomain rerouted `/` intern auf
	// diese Seite, ohne die URL zu ändern (`page.url.pathname` bleibt `/`).
	// SeoHead muss hier den LOGISCHEN Pfad `/hitze` verwenden, sonst würde diese
	// Seite die Home-Registrierung von `/` übernehmen. Seit C4c ist `/hitze`
	// selbst registriert: der en-Alternate zeigt auf `/en/hitze`, nie auf `/en`.
	it('hreflang-en-Alternate zeigt auf /en/hitze und nicht auf die Startseite', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		await new Promise((r) => setTimeout(r, 20));
		const en = document.head.querySelector('link[rel="alternate"][hreflang="en"]');
		expect(en?.getAttribute('href')).toMatch(/\/en\/hitze$/);
	});
});

describe('hitze · hreflang und Canonical teilen die Origin (i18n C4c)', () => {
	it('Alternates zeigen auf dieselbe Origin wie der Canonical', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		await new Promise((r) => setTimeout(r, 20));
		const originOf = (href: string | null): string => (href ?? '').replace(/\/(en\/)?hitze$/, '');
		const canonicalOrigin = originOf(
			document.head.querySelector('link[rel="canonical"]')!.getAttribute('href')
		);
		const alternates = [...document.head.querySelectorAll('link[rel="alternate"][hreflang]')];
		expect(alternates.length).toBeGreaterThan(0);
		for (const link of alternates) {
			expect(originOf(link.getAttribute('href'))).toBe(canonicalOrigin);
		}
	});
});

describe('hitze · DE-Parität (i18n C4c)', () => {
	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		const root = document.querySelector('[data-testid="hitze-landing"]')!;
		await expect(textLines(root)).toMatchFileSnapshot('./__snapshots__/hitze-de-lines.txt');
		await expect(normalizedText(root)).toMatchFileSnapshot('./__snapshots__/hitze-de-text.txt');
		await expect(ariaLabels(root)).toMatchFileSnapshot('./__snapshots__/hitze-de-aria.txt');
	});
});

describe('hitze · DE-Wortlaut Meta und Links (i18n C4c)', () => {
	it('Meta-Title und Methodik-Link bleiben unverändert', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Hitze-Navigator Berlin - kühle Orte bei Hitze finden');
		const root = document.querySelector('[data-testid="hitze-landing"]')!;
		expect(internalHrefs(root)).toContain('/layer/kuehle-orte');
		expect(internalHrefs(root).filter((h) => h.startsWith('/en'))).toEqual([]);
	});

	it('Dataset- und Breadcrumb-JSON-LD bleiben deutsch', async () => {
		render(Page, { data: { warning: null, datasetSource: DATASET_SOURCE } });
		const dataset = JSON.parse(
			document.querySelector('[data-testid="hitze-dataset-jsonld"]')!.textContent!
		);
		expect(dataset.name).toBe('Kühle Orte in Berlin');
		expect(getLayerMethodology('kuehle-orte')?.authority).toBeTruthy();
		expect(dataset.creator).toEqual({
			'@type': 'Organization',
			name: getLayerMethodology('kuehle-orte')?.authority,
			url: 'https://www.openstreetmap.org'
		});
		expect(dataset.keywords).toBe(
			'Kühle Orte, Hitze, Berlin, Abkühlung, Klimaanlage, Trinkbrunnen'
		);
		const crumbs = JSON.parse(
			document.querySelector('[data-testid="hitze-breadcrumb-jsonld"]')!.textContent!
		);
		expect(crumbs.itemListElement.map((i: { name: string }) => i.name)).toEqual([
			'Start',
			'Kühle Orte bei Hitze'
		]);
	});

	it('FAQ ist deutsch und trägt kein lang-Attribut', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		const faq = document.querySelector('[data-testid="faq-section"]')!;
		expect(faq.querySelector('[lang]')).toBeNull();
		expect(faq.textContent).toContain('Wo finde ich in Berlin kühle Orte bei Hitze?');
	});
});

describe('hitze · Canonical (Indexierungs-Hygiene S1)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	async function canonicalAndOgUrl(): Promise<[string | null, string | null]> {
		await new Promise((r) => setTimeout(r, 20));
		return [
			document.head.querySelector('link[rel="canonical"]')!.getAttribute('href'),
			document.head.querySelector('meta[property="og:url"]')!.getAttribute('content')
		];
	}

	it('DE: absolutes Canonical und og:url ohne Punkt-Artefakt', async () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		const [canonical, ogUrl] = await canonicalAndOgUrl();
		expect(canonical).toBe(`${canonicalOrigin(appPage.url.origin)}/hitze`);
		expect(canonical).not.toContain('./');
		expect(ogUrl).toBe(canonical);
	});

	it('EN: Canonical auf /en/hitze', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { warning: null, datasetSource: null } });
		const [canonical, ogUrl] = await canonicalAndOgUrl();
		expect(canonical).toBe(`${canonicalOrigin(appPage.url.origin)}/en/hitze`);
		expect(ogUrl).toBe(canonical);
	});
});

describe('hitze · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	function renderEn(warning: null | object = null): Element {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { warning, datasetSource: DATASET_SOURCE } as never });
		return document.querySelector('[data-testid="hitze-landing"]')!;
	}

	it('H1, Intro, Kategorien und Schritte sind englisch', () => {
		const root = renderEn();
		expect(root.querySelector('h1')?.textContent).toBe('Heat Navigator Berlin');
		const text = root.textContent ?? '';
		expect(text).toContain('Enter your location.');
		expect(text).toContain('Malls and department stores');
		expect(text).toContain('To a cool place in three steps');
		expect(text).toContain('Official services of the City of Berlin');
		expect(text).not.toContain('Kühle Orte bei Hitze');
	});

	it('FAQ ist englisch, ohne lang="de", FAQPage-JSON-LD folgt', () => {
		const root = renderEn();
		const faq = root.querySelector('[data-testid="faq-section"]')!;
		expect(faq.querySelector('[lang]')).toBeNull();
		expect(faq.textContent).toContain('Where can I find cool places in Berlin in hot weather?');
		const ld = JSON.parse(document.querySelector('[data-testid="faq-jsonld"]')!.textContent!);
		expect(ld.mainEntity[0].name).toBe('Where can I find cool places in Berlin in hot weather?');
	});

	it('Seitenlinks liegen unter /en, externe Links unverändert', () => {
		const root = renderEn();
		const hrefs = internalHrefs(root);
		expect(hrefs).toContain('/en/layer/kuehle-orte');
		expect(hrefs).toContain('/en/explore?layers=kuehle-orte&mode=hitze');
		expect(hrefs).toContain('/en/lizenzen');
		expect(hrefs.filter((h) => !h.startsWith('/en'))).toEqual([]);
		expect(root.querySelector('a[href="https://www.berlin.de/hitzeschutz/"]')).not.toBeNull();
	});

	it('JSON-LD in Englisch, Breadcrumb-Wurzel lokalisiert', () => {
		renderEn();
		const dataset = JSON.parse(
			document.querySelector('[data-testid="hitze-dataset-jsonld"]')!.textContent!
		);
		expect(dataset.name).toBe('Cool places in Berlin');
		expect(dataset.keywords).toBe(
			'Cool places, heat, Berlin, cooling down, air conditioning, drinking fountains'
		);
		const crumbs = JSON.parse(
			document.querySelector('[data-testid="hitze-breadcrumb-jsonld"]')!.textContent!
		);
		const items = crumbs.itemListElement as { name: string; item: string }[];
		expect(items.map((i) => i.name)).toEqual(['Home', 'Cool places in hot weather']);
		expect(items[0]?.item).toMatch(/\/en\/?$/);
		expect(items[1]?.item.endsWith('/en/hitze')).toBe(true);
	});

	it('DWD-Warnung: Rahmen englisch, Warntext unverändert', () => {
		const root = renderEn({
			level: 'extrem',
			label: 'Extreme Hitze',
			headline: 'Amtliche WARNUNG vor extremer Hitze',
			source: 'Deutscher Wetterdienst (DWD)',
			sourceUrl: 'https://www.dwd.de/warnungen'
		});
		const banner = root.querySelector('[data-testid="dwd-hitzewarn-banner"]')!;
		expect(banner.textContent).toContain('Extreme heat');
		expect(banner.textContent).toContain('Amtliche WARNUNG vor extremer Hitze');
		expect(banner.textContent).toContain('German Weather Service (DWD)');
	});

	it('enthält keinen deutschen Resttext', () => {
		const root = renderEn();
		const text = root.textContent ?? '';
		for (const word of [
			'Standort',
			'Abkühlung',
			'Schwimmhallen',
			'Quellen',
			'Transparenz',
			'Lizenzen-Seite'
		]) {
			expect(text).not.toContain(word);
		}
	});
});

describe('Hitze-Home · Dataset-JSON-LD', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	const datasetSource = DATASET_SOURCE;

	it('nutzt Download-URL, MANIFEST-Datum, Quell-Origin und Bounding Box', () => {
		render(Page, { data: { warning: null, datasetSource } });
		const ld = readDatasetJsonLd();
		expect(ld.url).toMatch(/\/hitze$/);
		expect(ld.distribution.contentUrl).toMatch(/\/daten\/kuehle-orte\.geojson$/);
		expect(ld.dateModified).toBe('2026-08-08T10:55:22.829Z');
		expect(ld.creator.url).toBe('https://www.openstreetmap.org');
		expect(ld.spatialCoverage.geo.box).toMatch(/^52\.\d+ 13\.\d+ 52\.\d+ 13\.\d+$/);
	});

	it('EN: url mit /en-Präfix', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { warning: null, datasetSource } });
		expect(readDatasetJsonLd().url).toMatch(/\/en\/hitze$/);
	});

	it('ohne MANIFEST-Daten entfällt das Dataset-JSON-LD', () => {
		render(Page, { data: { warning: null, datasetSource: null } });
		const types = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
			(s) => JSON.parse(s.textContent ?? '{}')['@type']
		);
		expect(types).not.toContain('Dataset');
	});
});
