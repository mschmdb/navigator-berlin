import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { HOME_LAYER_TEASERS, homeLayerTeaserLabel, homeLayerTeaserSummary } from './home-layer-teasers.js';
import { HOME_FEATURED_BEZIRKE, homeFeaturedBezirkTeaser } from './home-featured-bezirke.js';
import { HOME_DATA_SOURCES, homeDataSourceDescription } from './home-data-sources.js';
import { HOME_QUICK_LINKS, buildQuickLinkHref, homeQuickLinkDescription } from './home-quick-links.js';
import { HOME_SCREENSHOTS, homeScreenshotAlt, type HomeScreenshotKey } from './screenshot-manifest.js';

const REPO_ROOT = resolve(process.cwd());

function loadManifestLayerSlugs(): Set<string> {
	const raw = readFileSync(resolve(REPO_ROOT, 'static/layers/MANIFEST.json'), 'utf-8');
	const parsed = JSON.parse(raw) as { layers: { slug: string }[] };
	return new Set(parsed.layers.map((l) => l.slug));
}

describe('HOME_LAYER_TEASERS', () => {
	it('liefert exakt 7 Einträge (inkl. Kultur + Kriminalität)', () => {
		expect(HOME_LAYER_TEASERS).toHaveLength(7);
	});

	it('jeder Slug existiert im MANIFEST.json', () => {
		const manifestSlugs = loadManifestLayerSlugs();
		for (const t of HOME_LAYER_TEASERS) {
			expect(manifestSlugs.has(t.slug)).toBe(true);
		}
	});

	it('summary niemals leer + enthält keinen em-dash', () => {
		for (const t of HOME_LAYER_TEASERS) {
			const summary = homeLayerTeaserSummary(t.slug);
			expect(summary.length).toBeGreaterThan(20);
			expect(summary).not.toMatch(/—/);
		}
	});
});

describe('HOME_FEATURED_BEZIRKE', () => {
	it('liefert exakt 4 Einträge mit Berliner Bezirks-Slugs', () => {
		expect(HOME_FEATURED_BEZIRKE).toHaveLength(4);
		const KNOWN = new Set([
			'mitte',
			'friedrichshain-kreuzberg',
			'pankow',
			'charlottenburg-wilmersdorf',
			'spandau',
			'steglitz-zehlendorf',
			'tempelhof-schoeneberg',
			'neukoelln',
			'treptow-koepenick',
			'marzahn-hellersdorf',
			'lichtenberg',
			'reinickendorf'
		]);
		for (const b of HOME_FEATURED_BEZIRKE) {
			expect(KNOWN.has(b.slug)).toBe(true);
			const teaser = homeFeaturedBezirkTeaser(b.slug);
			expect(teaser.length).toBeGreaterThan(20);
			expect(teaser).not.toMatch(/—/);
			expect(teaser.toLowerCase()).not.toContain('lebenswert');
		}
	});
});

describe('HOME_DATA_SOURCES', () => {
	it('liefert 6 Quellen mit Lizenz-Marker', () => {
		expect(HOME_DATA_SOURCES).toHaveLength(6);
		for (const s of HOME_DATA_SOURCES) {
			expect(s.name.length).toBeGreaterThan(2);
			expect(s.license.length).toBeGreaterThan(2);
		}
	});
});

describe('HOME_QUICK_LINKS', () => {
	const BERLIN_LNG = [13.0, 13.8] as const;
	const BERLIN_LAT = [52.3, 52.7] as const;

	it('liefert 5 Berliner Landmarks innerhalb der Stadt-Bbox', () => {
		expect(HOME_QUICK_LINKS).toHaveLength(5);
		for (const q of HOME_QUICK_LINKS) {
			expect(q.lng).toBeGreaterThanOrEqual(BERLIN_LNG[0]);
			expect(q.lng).toBeLessThanOrEqual(BERLIN_LNG[1]);
			expect(q.lat).toBeGreaterThanOrEqual(BERLIN_LAT[0]);
			expect(q.lat).toBeLessThanOrEqual(BERLIN_LAT[1]);
			expect(q.query).toMatch(/Berlin/);
		}
	});

	it('buildQuickLinkHref erzeugt parseAddress-konformes Query', () => {
		const link = HOME_QUICK_LINKS[0];
		const href = buildQuickLinkHref(link);
		expect(href.startsWith('/explore?')).toBe(true);
		expect(href).toContain(`address=${link.lng}%2C${link.lat}`);
		expect(href).toContain('q=');
	});
});

describe('HOME_SCREENSHOTS', () => {
	it('alle referenzierten Pfade existieren unter static/', () => {
		for (const s of Object.values(HOME_SCREENSHOTS)) {
			const absolute = resolve(REPO_ROOT, 'static', s.path.replace(/^\//, ''));
			expect(existsSync(absolute), `${s.key} → ${absolute}`).toBe(true);
		}
	});

	it('alt-Text niemals leer + niemals em-dash', () => {
		for (const s of Object.values(HOME_SCREENSHOTS)) {
			const alt = homeScreenshotAlt(s.key as HomeScreenshotKey);
			expect(alt.length).toBeGreaterThan(10);
			expect(alt).not.toMatch(/—/);
		}
	});
});

// i18n Block B2: `label`/`description`/`summary`/`teaser`/`alt` sind keine
// Modul-Konstanten mehr, sondern locale-abhängig aufgelöst. Diese Tests
// belegen die EN-Fassung UND dass sie sich von der DE-Fassung unterscheidet
// (kein versehentlich unübersetztes Duplikat).
describe('i18n Block B2: EN-Aufloesung unterscheidet sich von DE', () => {
	it('HOME_LAYER_TEASERS: Label + Summary', () => {
		for (const t of HOME_LAYER_TEASERS) {
			const labelDe = homeLayerTeaserLabel(t.slug, { locale: 'de' });
			const labelEn = homeLayerTeaserLabel(t.slug, { locale: 'en' });
			expect(labelEn.length).toBeGreaterThan(0);
			expect(labelEn).not.toBe(labelDe);
			const summaryDe = homeLayerTeaserSummary(t.slug, { locale: 'de' });
			const summaryEn = homeLayerTeaserSummary(t.slug, { locale: 'en' });
			expect(summaryEn).not.toBe(summaryDe);
		}
	});

	it('HOME_FEATURED_BEZIRKE: Teaser (displayName bleibt Eigenname, unveraendert)', () => {
		for (const b of HOME_FEATURED_BEZIRKE) {
			const teaserDe = homeFeaturedBezirkTeaser(b.slug, { locale: 'de' });
			const teaserEn = homeFeaturedBezirkTeaser(b.slug, { locale: 'en' });
			expect(teaserEn).not.toBe(teaserDe);
		}
	});

	it('HOME_DATA_SOURCES: Description (name/license bleiben Datenschluessel)', () => {
		for (const s of HOME_DATA_SOURCES) {
			const descDe = homeDataSourceDescription(s.id, { locale: 'de' });
			const descEn = homeDataSourceDescription(s.id, { locale: 'en' });
			expect(descEn).not.toBe(descDe);
		}
	});

	it('HOME_QUICK_LINKS: Description (label/query bleiben Eigenname/Datenschluessel)', () => {
		for (const q of HOME_QUICK_LINKS) {
			const descDe = homeQuickLinkDescription(q.id, { locale: 'de' });
			const descEn = homeQuickLinkDescription(q.id, { locale: 'en' });
			expect(descEn).not.toBe(descDe);
		}
	});

	it('HOME_SCREENSHOTS: Alt-Text', () => {
		for (const key of Object.keys(HOME_SCREENSHOTS) as HomeScreenshotKey[]) {
			const altDe = homeScreenshotAlt(key, { locale: 'de' });
			const altEn = homeScreenshotAlt(key, { locale: 'en' });
			expect(altEn).not.toBe(altDe);
		}
	});
});
