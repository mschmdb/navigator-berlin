import { describe, expect, it } from 'vitest';
import { loadRankingRegions } from '$lib/server/layer-kiez-ranking-loader.js';
import { m } from '$lib/paraglide/messages.js';
import { BEZIRK_DESCRIPTION_MAX, buildBezirkMeta, buildKiezMeta } from './profile-meta.js';
import { buildPageTitle, PAGE_TITLE_MAX } from './page-title.js';

const LOCALES = ['de', 'en'] as const;

// Ungünstige Werte: lange Zahlen, dreistelliger Score-Text, Fläche.
const FACTS = {
	einwohner: 387654,
	flaecheHa: 12345,
	stichtag: '2024-12-31',
	score: 53.4,
	rang: 57,
	quartil: 2,
	total: 143
} as const;

describe('Titel aller Kieze und Bezirke (echte Namen)', () => {
	it('kennt 143 Kieze und 12 Bezirke', async () => {
		const regions = [...(await loadRankingRegions()).values()];
		expect(regions).toHaveLength(143);
		expect(new Set(regions.map((r) => r.bezirkName)).size).toBe(12);
	});

	it('Kiez-Titel haben höchstens 60 Zeichen, außer der Name allein ist länger', async () => {
		const regions = [...(await loadRankingRegions()).values()];
		for (const region of regions) {
			for (const locale of LOCALES) {
				const { title } = buildKiezMeta({
					...FACTS,
					name: region.name,
					bezirk: region.bezirkName,
					locale
				});
				expect(title.length <= PAGE_TITLE_MAX || title === region.name, `${locale} ${title}`).toBe(
					true
				);
				expect(title.startsWith(region.name)).toBe(true);
			}
		}
	});

	it('Bezirks-Titel haben höchstens 60 Zeichen, außer der Name allein ist länger', async () => {
		const names = new Set([...(await loadRankingRegions()).values()].map((r) => r.bezirkName));
		for (const name of names) {
			for (const locale of LOCALES) {
				const { title } = buildBezirkMeta({ ...FACTS, name, locale });
				expect(title.length <= PAGE_TITLE_MAX || title === name, `${locale} ${title}`).toBe(true);
				expect(title.startsWith(name)).toBe(true);
			}
		}
	});

	it('Bezirks-Meta: Name vorn, Bezirk im Titel, Description <= 155 mit Seiteninhalt', async () => {
		const names = new Set([...(await loadRankingRegions()).values()].map((r) => r.bezirkName));
		for (const name of names) {
			for (const locale of LOCALES) {
				const { title, description } = buildBezirkMeta({ ...FACTS, name, locale });
				expect(title.length, title).toBeLessThanOrEqual(PAGE_TITLE_MAX);
				expect(title).toMatch(locale === 'de' ? /: Bezirk / : /: Berlin district /);
				expect(description.startsWith(name)).toBe(true);
				expect(description.length, description).toBeLessThanOrEqual(BEZIRK_DESCRIPTION_MAX);
				expect(description).toMatch(locale === 'de' ? /Milieuschutz und Kieze/ : /Kieze on a map/);
			}
		}
	});
});

describe('Bezirke-Übersicht: Titel und Description', () => {
	it('DE und EN mit Marke, Titel <= 60, Description <= 155', () => {
		for (const locale of LOCALES) {
			const opts = { locale };
			const title = buildPageTitle(m.overview_bezirke_meta_title({ count: 12 }, opts));
			const description = m.overview_bezirke_meta_description({ count: 12 }, opts);
			expect(title.endsWith(' | navigator.berlin'), title).toBe(true);
			expect(title.length, title).toBeLessThanOrEqual(PAGE_TITLE_MAX);
			expect(description.length, description).toBeLessThanOrEqual(BEZIRK_DESCRIPTION_MAX);
			expect(description).toContain('12');
			expect(description).not.toMatch(/Wahl|election/i);
		}
		expect(buildPageTitle(m.overview_bezirke_meta_title({ count: 12 }, { locale: 'de' }))).toBe(
			'Alle 12 Bezirke Berlins mit Einwohnerzahl | navigator.berlin'
		);
		expect(buildPageTitle(m.overview_bezirke_meta_title({ count: 12 }, { locale: 'en' }))).toBe(
			'All 12 Berlin districts with population | navigator.berlin'
		);
	});
});
