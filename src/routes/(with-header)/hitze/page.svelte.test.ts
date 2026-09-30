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

describe('Hitze-Home (Spin-off-Route)', () => {
	it('hat genau ein h1 mit dem Hitze-Titel', async () => {
		render(Page, { data: { warning: null } });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Hitze-Navigator Berlin');
	});

	it('CTA führt auf den Kühle-Orte-Explorer-Deep-Link', async () => {
		render(Page, { data: { warning: null } });
		await expect
			.element(page.getByTestId('hitze-cta'))
			.toHaveAttribute('href', '/explore?layers=kuehle-orte&mode=hitze');
	});

	it('gerenderter Text enthält keine em-dashes (U+2014)', async () => {
		render(Page, { data: { warning: null } });
		const text = (await page.getByTestId('hitze-landing').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});

	// i18n Block B2 Review-Fund: die Hitze-Subdomain rerouted `/` intern auf
	// diese Seite, ohne die URL zu ändern (`page.url.pathname` bleibt `/`).
	// SeoHead muss hier den LOGISCHEN Pfad `/hitze` verwenden, sonst würde diese
	// Seite die Home-Registrierung von `/` übernehmen. Seit C4c ist `/hitze`
	// selbst registriert: der en-Alternate zeigt auf `/en/hitze`, nie auf `/en`.
	it('hreflang-en-Alternate zeigt auf /en/hitze und nicht auf die Startseite', async () => {
		render(Page, { data: { warning: null } });
		await new Promise((r) => setTimeout(r, 20));
		const en = document.head.querySelector('link[rel="alternate"][hreflang="en"]');
		expect(en?.getAttribute('href')).toMatch(/\/en\/hitze$/);
	});
});

describe('hitze · hreflang und Canonical teilen die Origin (i18n C4c)', () => {
	it('Alternates zeigen auf dieselbe Origin wie der Canonical', async () => {
		render(Page, { data: { warning: null } });
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
		render(Page, { data: { warning: null } });
		const root = document.querySelector('[data-testid="hitze-landing"]')!;
		await expect(textLines(root)).toMatchFileSnapshot('./__snapshots__/hitze-de-lines.txt');
		await expect(normalizedText(root)).toMatchFileSnapshot('./__snapshots__/hitze-de-text.txt');
		await expect(ariaLabels(root)).toMatchFileSnapshot('./__snapshots__/hitze-de-aria.txt');
	});
});

describe('hitze · DE-Wortlaut Meta und Links (i18n C4c)', () => {
	it('Meta-Title und Methodik-Link bleiben unverändert', async () => {
		render(Page, { data: { warning: null } });
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Hitze-Navigator Berlin - kühle Orte bei Hitze finden');
		const root = document.querySelector('[data-testid="hitze-landing"]')!;
		expect(internalHrefs(root)).toContain('/layer/kuehle-orte');
		expect(internalHrefs(root).filter((h) => h.startsWith('/en'))).toEqual([]);
	});

	it('Dataset- und Breadcrumb-JSON-LD bleiben deutsch', async () => {
		render(Page, { data: { warning: null } });
		const dataset = JSON.parse(
			document.querySelector('[data-testid="hitze-dataset-jsonld"]')!.textContent!
		);
		expect(dataset.name).toBe('Kühle Orte in Berlin');
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
		render(Page, { data: { warning: null } });
		const faq = document.querySelector('[data-testid="faq-section"]')!;
		expect(faq.querySelector('[lang]')).toBeNull();
		expect(faq.textContent).toContain('Wo finde ich in Berlin kühle Orte bei Hitze?');
	});
});

describe('hitze · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	function renderEn(warning: null | object = null): Element {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { warning } as never });
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
