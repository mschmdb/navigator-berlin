import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import type { LayerDetail } from '$lib/data/get-layer-detail.js';
import type { LayerMetadata } from '$lib/data';
import type { LayerMethodology } from '$lib/data/layer-methodology.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

function makeMeta(slug: string, overrides: Partial<LayerMetadata> = {}): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://gdi.berlin.de/wfs/ua',
		fetchedAt: '2026-05-12T10:00:00.000Z',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: 542,
		...overrides
	};
}

function methodology(): LayerMethodology {
	return {
		calculation: 'Modellierte Lärm-Gesamtbelastung pro LOR-Planungsraum aus dem Umweltatlas 2023.',
		coverageGaps: ['Modellwerte, keine flächendeckenden Mess-Stationen.'],
		omissions: ['Keine Trennung nach Quelle (Straße, Schiene, Flug).'],
		relatedLayers: ['luft-2023'],
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre',
		authority: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt'
	};
}

function detail(slug = 'laerm-2023', overrides: Partial<LayerDetail> = {}): LayerDetail {
	return {
		slug,
		lang: 'de',
		layerName: 'Lärmbelastung (Umweltatlas 2023)',
		explain: {
			short: 'Lärmbelastung im Stadtteil',
			long: 'Kategorisierte Lärm-Gesamtbelastung pro Planungsraum aus dem Berliner Umweltatlas 2023.',
			valueScaleExplain: 'niedrig bis sehr hoch'
		},
		meta: makeMeta(slug),
		methodology: methodology(),
		...overrides
	};
}

describe('layer-detail +page.svelte', () => {
	it('rendert layerName als h1', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const h1 = (await page.getByTestId('layer-detail-name').element()) as HTMLElement;
		expect(h1.tagName).toBe('H1');
		expect(h1.textContent).toMatch(/Lärmbelastung/);
	});

	it('rendert long-Explain als Lead', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const lead = (await page.getByTestId('layer-detail-lead').element()) as HTMLElement;
		expect(lead.textContent).toMatch(/Lärm-Gesamtbelastung/);
	});

	it('rendert Source-Card mit Source-Link', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const link = (await page
			.getByTestId('layer-detail-source-link')
			.element()) as HTMLAnchorElement;
		expect(link.href).toBe('https://gdi.berlin.de/wfs/ua');
		expect(link.target).toBe('_blank');
	});

	it('rendert License-Label', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const lic = (await page.getByTestId('layer-detail-license').element()) as HTMLElement;
		expect(lic.textContent).toMatch(/dl-de\/zero/);
	});

	it('rendert Inspector-Link mit Layer-URL-State', async () => {
		render(Page, { data: { detail: detail('wohnlagen-2024'), faq: [] } });
		const link = (await page
			.getByTestId('layer-detail-inspector-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toMatch(/\/explore\?layers=wohnlagen-2024/);
	});

	it('rendert Scale-Section bei vorhandenem valueScaleExplain', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const scale = (await page.getByTestId('layer-detail-scale').element()) as HTMLElement;
		expect(scale.textContent).toMatch(/niedrig bis sehr hoch/);
	});

	it('rendert keine Scale-Section ohne valueScaleExplain + ohne unit', async () => {
		const d = { ...detail(), explain: { short: 'foo', long: 'bar' } };
		render(Page, { data: { detail: d, faq: [] } });
		await expect.element(page.getByTestId('layer-detail-scale')).not.toBeInTheDocument();
	});

	it('rendert Editorial-Disclaimer wenn editorial-Config gesetzt', async () => {
		const d: LayerDetail = {
			...detail('wohnlagen-2024'),
			editorial: {
				slug: 'wohnlagen-2024',
				disclaimerVariants: ['legal'],
				primarySourceUrl: 'https://mietspiegel.berlin.de/',
				feedbackMailto: true
			}
		};
		render(Page, { data: { detail: d, faq: [] } });
		await expect.element(page.getByTestId('layer-detail-editorial')).toBeInTheDocument();
		await expect.element(page.getByTestId('editorial-disclaimer')).toBeInTheDocument();
	});

	it('rendert keinen Disclaimer-Bereich ohne editorial-Config', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		await expect.element(page.getByTestId('layer-detail-editorial')).not.toBeInTheDocument();
	});

	it('rendert Bundle-Group roh oberhalb h1 (DE-Parität, Spec Change Log 27.09.)', async () => {
		// i18n Block B4b: DE zeigt weiter den rohen `meta.bundleGroup`-Wert aus
		// dem Manifest, byte-identisch zum Vor-B4b-Verhalten -- nur EN läuft
		// über `bundleLabel()`. Review-Fund #19 (Koordinator, Matze AFK).
		render(Page, { data: { detail: detail(), faq: [] } });
		const article = (await page.getByTestId('layer-detail-page').element()) as HTMLElement;
		expect(article.textContent).toMatch(/C: Umwelt/);
	});

	it('rendert Methodology-Section „Berechnung"', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page.getByTestId('layer-detail-methodology').element()) as HTMLElement;
		expect(sec.textContent).toMatch(/Berechnung/);
		expect(sec.textContent).not.toMatch(/Wie berechnet/);
		expect(sec.textContent).toMatch(/Modellierte Lärm-Gesamtbelastung/);
	});

	it('rendert Coverage-Gaps-Section nur wenn coverageGaps gefüllt', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page.getByTestId('layer-detail-coverage-gaps').element()) as HTMLElement;
		expect(sec.textContent).toMatch(/Modellwerte/);
	});

	it('rendert Omissions-Section nur wenn omissions gefüllt', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page.getByTestId('layer-detail-omissions').element()) as HTMLElement;
		expect(sec.textContent).toMatch(/Trennung nach Quelle/);
	});

	it('rendert Related-Layers-Section mit Auto-Link', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page.getByTestId('layer-detail-related').element()) as HTMLElement;
		const link = sec.querySelector('a[href="/layer/luft-2023"]');
		expect(link, 'Auto-Link zu /layer/luft-2023').not.toBeNull();
		expect(link?.textContent).toMatch(/Luft/);
	});

	it('rendert Methodik-Banner mit Link auf /methodik', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const banner = (await page.getByTestId('layer-detail-methodik-link').element()) as HTMLElement;
		const link = banner.querySelector('a');
		expect(link?.getAttribute('href')).toMatch(/^\/methodik/);
	});

	it('blendet Sections mit leerem Inhalt aus (kein Coverage-Gaps wenn fehlt)', async () => {
		const d = detail('laerm-2023', {
			methodology: { ...methodology(), coverageGaps: undefined, omissions: undefined }
		});
		render(Page, { data: { detail: d, faq: [] } });
		await expect.element(page.getByTestId('layer-detail-coverage-gaps')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('layer-detail-omissions')).not.toBeInTheDocument();
	});

	it('rendert Dataset-JSON-LD mit license-URL + creator + distribution.contentUrl', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]'
		);
		expect(script).not.toBeNull();
		const parsed = JSON.parse(script?.textContent ?? '{}');
		expect(parsed['@type']).toBe('Dataset');
		expect(parsed.name).toMatch(/Lärmbelastung/);
		expect(parsed.license).toBe('https://www.govdata.de/dl-de/zero-2-0');
		expect(parsed.creator?.['@type']).toBe('Organization');
		expect(parsed.creator?.name).toMatch(/Senatsverwaltung/);
		expect(parsed.distribution?.contentUrl).toMatch(/\/layers\/laerm-2023\.geojson$/);
		expect(parsed.inLanguage).toBe('de-DE');
	});

	it('Dataset-JSON-LD nutzt navigator.berlin als creator-Fallback wenn authority fehlt', async () => {
		const d = detail('laerm-2023', {
			methodology: { ...methodology(), authority: undefined }
		});
		render(Page, { data: { detail: d, faq: [] } });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]'
		);
		const parsed = JSON.parse(script?.textContent ?? '{}');
		expect(parsed.creator?.name).toBe('navigator.berlin');
	});

	it('zeigt „Methodik in Vorbereitung"-Banner wenn methodology null', async () => {
		const d = detail('laerm-2023', { methodology: null });
		render(Page, { data: { detail: d, faq: [] } });
		const banner = (await page
			.getByTestId('layer-detail-methodology-empty')
			.element()) as HTMLElement;
		expect(banner.textContent).toMatch(/Methodik in Vorbereitung/);
		expect(banner.querySelector('a[href*="methodik"]')).not.toBeNull();
		expect(banner.querySelector('[data-testid="error-feedback-mailto"]')).not.toBeNull();
	});

	it('Features-Zahl mit deutschem Tausendertrennzeichen (Punkt)', async () => {
		const d = detail('laerm-2023', { meta: makeMeta('laerm-2023', { featureCount: 12345 }) });
		render(Page, { data: { detail: d, faq: [] } });
		const sourceCard = (await page
			.getByTestId('layer-detail-source-card')
			.element()) as HTMLElement;
		expect(sourceCard.textContent).toMatch(/12\.345/);
	});

	it('DE-Seite: kein `lang`-Attribut an Lead, Editorial-Section, Skala, Berechnung, Aggregation, Pflege, Aktualisierung, Coverage-Lücken, Omissions', async () => {
		const d: LayerDetail = {
			...detail('wohnlagen-2024'),
			editorial: {
				slug: 'wohnlagen-2024',
				disclaimerVariants: ['legal'],
				primarySourceUrl: 'https://mietspiegel.berlin.de/',
				feedbackMailto: true
			}
		};
		render(Page, { data: { detail: d, faq: [] } });

		const lead = (await page.getByTestId('layer-detail-lead').element()) as HTMLElement;
		expect(lead.hasAttribute('lang')).toBe(false);

		const editorial = (await page.getByTestId('layer-detail-editorial').element()) as HTMLElement;
		expect(editorial.hasAttribute('lang')).toBe(false);

		const scale = (await page.getByTestId('layer-detail-scale').element()) as HTMLElement;
		expect(scale.querySelector('dd')?.hasAttribute('lang')).toBe(false);

		const methodologySec = (await page
			.getByTestId('layer-detail-methodology')
			.element()) as HTMLElement;
		expect(methodologySec.querySelector('p')?.hasAttribute('lang')).toBe(false);
		const dds = methodologySec.querySelectorAll('dd');
		for (const dd of dds) {
			expect(dd.hasAttribute('lang')).toBe(false);
		}

		const coverageGaps = (await page
			.getByTestId('layer-detail-coverage-gaps')
			.element()) as HTMLElement;
		expect(coverageGaps.querySelector('ul')?.hasAttribute('lang')).toBe(false);

		const omissions = (await page.getByTestId('layer-detail-omissions').element()) as HTMLElement;
		expect(omissions.querySelector('ul')?.hasAttribute('lang')).toBe(false);
	});

	// i18n Block B4b: Komponente liest die globale Locale über `getLocale()`,
	// nicht über einen `opts`-Prop -- `overwriteGetLocale` simuliert die
	// URL-Locale von `/en/…`.
	describe('EN locale (getLocale() = "en")', () => {
		it('Bundle-Eyebrow, Quelle-Karte-Labels, Werte/Berechnung-Heading und Features-Zahl englisch', async () => {
			overwriteGetLocale(() => 'en');
			const d = detail('laerm-2023', {
				meta: makeMeta('laerm-2023', { featureCount: 12345 })
			});
			render(Page, { data: { detail: d, faq: [] } });
			const article = (await page.getByTestId('layer-detail-page').element()) as HTMLElement;
			expect(article.textContent).toMatch(/C · Environment/);
			expect(article.textContent).toMatch(/Source/);
			expect(article.textContent).toMatch(/Provider/);
			expect(article.textContent).toMatch(/Licence/);
			expect(article.textContent).toMatch(/Data as of/);
			expect(article.textContent).toMatch(/Features/);
			expect(article.textContent).toMatch(/12,345/);
			expect(article.textContent).toMatch(/Values/);
			expect(article.textContent).toMatch(/Scale/);
			expect(article.textContent).toMatch(/Calculation/);
			expect(article.textContent).toMatch(/Aggregation/);
			expect(article.textContent).toMatch(/Maintenance/);
			expect(article.textContent).toMatch(/Update frequency/);
			expect(article.textContent).toMatch(/Coverage gaps/);
			expect(article.textContent).toMatch(/What we don't show/);
			expect(article.textContent).toMatch(/Related layers/);
			expect(article.textContent).toMatch(/View layer on the map/);
		});

		it('Roh-Fallback: unbekannter bundleGroup-Wert bleibt roh, auch auf EN', async () => {
			overwriteGetLocale(() => 'en');
			const d = detail('laerm-2023', {
				meta: makeMeta('laerm-2023', {
					bundleGroup: 'Z: Unbekannt' as unknown as LayerMetadata['bundleGroup']
				})
			});
			render(Page, { data: { detail: d, faq: [] } });
			const article = (await page.getByTestId('layer-detail-page').element()) as HTMLElement;
			expect(article.textContent).toMatch(/Z: Unbekannt/);
		});

		// i18n Block C1: `explain.*` (Lead, Skala) und alle EditorialDisclaimer-
		// Varianten sind jetzt selbst locale-fähig (Messages) -- die Loader-
		// Daten (`detail.explain`) sind schon in der richtigen Sprache, die
		// Komponente braucht also kein `lang="de"`-Override mehr dafür.
		// `layer-methodology.ts` bleibt DE-only (Boundary C1), Methodik-Block
		// behält `lang="de"`.
		it('Lead/Editorial/Skala bekommen KEIN lang="de" mehr (jetzt selbst lokalisiert), Methodik behält es', async () => {
			overwriteGetLocale(() => 'en');
			const d: LayerDetail = {
				...detail('wohnlagen-2024'),
				editorial: {
					slug: 'wohnlagen-2024',
					disclaimerVariants: ['legal'],
					primarySourceUrl: 'https://mietspiegel.berlin.de/',
					feedbackMailto: true
				}
			};
			render(Page, { data: { detail: d, faq: [] } });
			const lead = (await page.getByTestId('layer-detail-lead').element()) as HTMLElement;
			expect(lead.hasAttribute('lang')).toBe(false);
			const editorial = (await page.getByTestId('layer-detail-editorial').element()) as HTMLElement;
			expect(editorial.hasAttribute('lang')).toBe(false);
			const scale = (await page.getByTestId('layer-detail-scale').element()) as HTMLElement;
			expect(scale.querySelector('dd')?.hasAttribute('lang')).toBe(false);
			const methodology = (await page
				.getByTestId('layer-detail-methodology')
				.element()) as HTMLElement;
			expect(methodology.querySelector('p[lang="de"]')?.textContent).toMatch(
				/Modellierte Lärm-Gesamtbelastung/
			);
			// aggregationLevel, authority, updateFrequency -- alle drei `dd`s.
			const dds = methodology.querySelectorAll('dd');
			expect(dds.length).toBe(3);
			for (const dd of dds) {
				expect(dd.getAttribute('lang')).toBe('de');
			}
			const coverageGaps = (await page
				.getByTestId('layer-detail-coverage-gaps')
				.element()) as HTMLElement;
			expect(coverageGaps.querySelector('ul')?.getAttribute('lang')).toBe('de');
			const omissions = (await page.getByTestId('layer-detail-omissions').element()) as HTMLElement;
			expect(omissions.querySelector('ul')?.getAttribute('lang')).toBe('de');
		});

		it('Verwandter-Layer-Link zeigt englischen Namen mit /en-Href', async () => {
			overwriteGetLocale(() => 'en');
			render(Page, { data: { detail: detail(), faq: [] } });
			const sec = (await page.getByTestId('layer-detail-related').element()) as HTMLElement;
			const link = sec.querySelector('a[href="/en/layer/luft-2023"]');
			expect(link, 'Auto-Link zu /en/layer/luft-2023').not.toBeNull();
			expect(link?.textContent).toMatch(/Air pollution/i);
		});

		it('Inspector-Link + Methodik-Links zeigen auf /en/…, Query bleibt erhalten', async () => {
			overwriteGetLocale(() => 'en');
			render(Page, { data: { detail: detail('wohnlagen-2024'), faq: [] } });
			const inspectorLink = (await page
				.getByTestId('layer-detail-inspector-link')
				.element()) as HTMLAnchorElement;
			expect(inspectorLink.getAttribute('href')).toMatch(/^\/en\/explore\?layers=wohnlagen-2024/);
			const banner = (await page
				.getByTestId('layer-detail-methodik-link')
				.element()) as HTMLElement;
			expect(banner.querySelector('a')?.getAttribute('href')).toBe('/en/methodik');
		});

		it('Hitze-CTA zeigt englischen Text mit /en/hitze-Href', async () => {
			overwriteGetLocale(() => 'en');
			render(Page, { data: { detail: detail('kuehle-orte'), faq: [] } });
			const cta = (await page
				.getByTestId('layer-detail-hitze-link')
				.element()) as HTMLAnchorElement;
			expect(cta.getAttribute('href')).toBe('/en/hitze');
			expect(cta.textContent).toMatch(/Heat Navigator/);
		});

		it('Eigene-Berechnung-Zeile zeigt englischen Text mit /en/lizenzen-Link', async () => {
			overwriteGetLocale(() => 'en');
			const d = detail('oepnv-composite', {
				meta: makeMeta('oepnv-composite', {
					sourceUrl: 'https://navigator.berlin/derived/oepnv-composite'
				})
			});
			render(Page, { data: { detail: d, faq: [] } });
			const span = (await page.getByTestId('layer-detail-source-link').element()) as HTMLElement;
			expect(span.textContent).toMatch(/Own calculation from open sources/);
			expect(span.querySelector('a')?.getAttribute('href')).toBe('/en/lizenzen');
			expect(span.querySelector('a')?.textContent).toMatch(/Sources & licences/);
		});

		it('zeigt englisches Leerzustand-Banner + EN-Mailto-Label wenn methodology null, Mailto-Betreff bleibt deutsch', async () => {
			overwriteGetLocale(() => 'en');
			const d = detail('laerm-2023', { methodology: null });
			render(Page, { data: { detail: d, faq: [] } });
			const banner = (await page
				.getByTestId('layer-detail-methodology-empty')
				.element()) as HTMLElement;
			expect(banner.textContent).toMatch(/not fully documented yet/);
			expect(banner.querySelector('a')?.getAttribute('href')).toBe('/en/methodik');
			const mailto = banner.querySelector(
				'[data-testid="error-feedback-mailto"]'
			) as HTMLAnchorElement;
			expect(mailto.textContent).toMatch(/Error in this entry/);
			// Review-Fund #20: Mailto-Betreff/-Body laufen über den DE-Layer-Namen
			// (`deLayerName`), damit die Redaktions-Mail nicht gemischtsprachig
			// wird -- slug `laerm-2023` -> DE-Message "Lärmbelastung 2023", NICHT
			// die fixture-eigene `layerName` ("Lärmbelastung (Umweltatlas 2023)").
			const decodedHref = decodeURIComponent(mailto.getAttribute('href') ?? '');
			expect(decodedHref).toContain('subject=Fehler im Eintrag: Lärmbelastung 2023');
		});

		it('Breadcrumb- und Dataset-JSON-LD bleiben auf /en vollständig deutsch (Boundary inLanguage de-DE)', async () => {
			overwriteGetLocale(() => 'en');
			// i18n Block C1: `explain` im Loader-Datensatz ist jetzt locale-fähig
			// (hier absichtlich EN gesetzt, wie ein echter `/en`-Loader-Call es
			// liefern würde) -- das JSON-LD zieht seine Description trotzdem über
			// eine eigene DE-only-Quelle (`deExplain`, echte Message für den
			// Slug), nicht über diesen Loader-Wert (Boundary: JSON-LD bleibt DE).
			const d = {
				...detail(),
				explain: { short: 'Noise pollution in the area', long: 'EN loader text, must not leak.' }
			};
			render(Page, { data: { detail: d, faq: [] } });
			const breadcrumbScript = document.querySelector(
				'script[type="application/ld+json"][data-testid="layer-breadcrumb-jsonld"]'
			);
			const breadcrumb = JSON.parse(breadcrumbScript?.textContent ?? '{}');
			expect(breadcrumb.itemListElement[0].name).toBe('Berlin');
			expect(breadcrumb.itemListElement[1].name).toBe('Daten');
			// slug `laerm-2023` -> real DE message, not the fixture's `layerName`.
			expect(breadcrumb.itemListElement[2].name).toBe('Lärmbelastung 2023');
			const datasetScript = document.querySelector(
				'script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]'
			);
			const dataset = JSON.parse(datasetScript?.textContent ?? '{}');
			expect(dataset.name).toBe('Lärmbelastung 2023');
			// Echte DE-Message für `laerm-2023`, NICHT der EN-Loader-Fixture-Text.
			expect(dataset.description).toMatch(/Lärm-Gesamtbelastung/);
			expect(dataset.description).not.toMatch(/EN loader text/);
			expect(dataset.inLanguage).toBe('de-DE');
		});
	});
});
