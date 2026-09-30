import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Page from './+page.svelte';
import { internalHrefs, textLines } from '../methodik/methodik-test-utils.js';
import type { RankingRow } from '$lib/data/ranking-types.js';

function row(slug: string, displayName: string, overrides: Partial<RankingRow> = {}): RankingRow {
	return {
		slug,
		displayName,
		bezirkSlug: 'mitte',
		bezirkName: 'Mitte',
		composite: 60,
		ruheLuft: 30,
		gruenHitze: 40,
		mobilitaet: 50,
		versorgung: 60,
		wohnschutz: 55,
		kultur: 45,
		kriminalitaet: 70,
		...overrides
	};
}

const data = {
	kieze: [row('alexanderplatz', 'Alexanderplatz', { composite: 70 }), row('wedding', 'Wedding')],
	bezirke: [row('mitte', 'Mitte', { bezirkSlug: null, bezirkName: null })],
	computedAt: '2026-09-30T00:00:00.000Z'
};

describe('umwelt-infrastruktur-score · DE-Parität (i18n C4b)', () => {
	it('sichtbarer DE-Text entspricht dem festgehaltenen Stand', async () => {
		render(Page, { data });
		const article = document.querySelector('[data-testid="ranking-page"]')!;
		await expect(textLines(article)).toMatchFileSnapshot('./__snapshots__/uis-de.txt');
	});
});

describe('umwelt-infrastruktur-score · EN (i18n C4b)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	function renderEn(): Element {
		overwriteGetLocale(() => 'en');
		render(Page, { data });
		return document.querySelector('[data-testid="ranking-page"]')!;
	}

	it('H1, Intro, Disclaimer und Accordion sind englisch', async () => {
		const article = renderEn();
		expect(article.querySelector('h1')?.textContent).toBe('Environment & infrastructure score');
		const text = article.textContent ?? '';
		expect(text).toContain('Berlin Kieze and Bezirke sorted by five equally weighted dimensions');
		expect(text).toContain('A comparison, not a verdict.');
		expect(text).toContain('How is the score calculated?');
		expect(text).toContain('Full methodology · Kiez score');
	});

	it('Rangliste zeigt Kiez-Namen und englische Spaltenköpfe', async () => {
		const article = renderEn();
		const lines = textLines(article);
		expect(lines).toContain('th: Alexanderplatz');
		expect(lines).toContain('th: Wedding');
		for (const head of [
			'Rank',
			'Quiet & air',
			'Green & heat',
			'Local amenities',
			'Recorded crime'
		]) {
			expect(lines).toContain(`th: ${head}`);
		}
	});

	it('alle internen Links beginnen mit /en/', async () => {
		const article = renderEn();
		const hrefs = internalHrefs(article);
		expect(hrefs).toContain('/en/kiez/alexanderplatz');
		expect(hrefs).toContain('/en/kiez/wedding');
		expect(hrefs).toContain('/en/methodik/kiez-score');
		expect(hrefs.every((href) => href.startsWith('/en/'))).toBe(true);
	});

	it('enthält keinen deutschen Resttext', async () => {
		const text = renderEn().textContent ?? '';
		for (const de of [
			'Sortiert nach',
			'Wie wird der Score berechnet',
			'unterstes Viertel',
			'Kriminalität'
		]) {
			expect(text).not.toContain(de);
		}
	});

	it('JSON-LD trägt englischen Namen und Keyword', async () => {
		renderEn();
		const dataset = JSON.parse(
			document.querySelector('script[data-testid="ranking-dataset-jsonld"]')?.textContent ?? '{}'
		);
		expect(dataset.name).toBe('Environment & infrastructure score Berlin');
		expect(dataset.keywords).toBe('Kiez score, Berlin, Ranking');
	});

	it('DE-Links tragen kein /en', async () => {
		render(Page, { data });
		const article = document.querySelector('[data-testid="ranking-page"]')!;
		const hrefs = internalHrefs(article);
		expect(hrefs).toContain('/kiez/wedding');
		expect(hrefs).toContain('/methodik/kiez-score');
		expect(hrefs.some((href) => href.startsWith('/en/'))).toBe(false);
	});
});

describe('umwelt-infrastruktur-score · DE-Wortlaut von Aside, Accordion, Empty-State und Meta (i18n C4b)', () => {
	it('Disclaimer, Accordion-Trigger und -Inhalt behalten den Baseline-Wortlaut', async () => {
		render(Page, { data });
		const norm = (el: Element | null): string =>
			(el?.textContent ?? '').replace(/\s+/g, ' ').trim();
		expect(norm(document.querySelector('[data-testid="ranking-editorial-disclaimer"]'))).toBe(
			'Der Score fasst öffentliche Senats-Daten pro LOR-Bezirksregion zusammen. Was sich gut anfühlt, bemisst sich an persönlichen Prioritäten. Vergleich, nicht Urteil.'
		);
		const trigger = document.querySelector<HTMLElement>(
			'[data-testid="ranking-methodik-disclosure"]'
		)!;
		expect(norm(trigger)).toBe('Wie wird der Score berechnet?');
		trigger.click();
		await new Promise((r) => setTimeout(r, 100));
		const content = document.querySelector('[data-accordion-content]');
		expect(norm(content)).toBe(
			'Wir aggregieren fünf Dimensionen: Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz. Quelle pro Dimension sind offene Senats-Daten (Lärmkartierung, Grünversorgung, Klima-Atlas, ÖPNV-Halte, Milieuschutzgebiete, POI-Distanzen). Die Aggregation läuft 542 LOR-Planungsräume → 143 LOR-Bezirksregionen → 12 Bezirke, jeweils flächengewichtet. Jede Dimension wird gleich gewichtet (5 × 20%). Sozialstruktur wird bewusst nicht gewertet. Vollständige Methodik · Kiez-Score.'
		);
	});

	it('Radiogroup-Label der Tabelle und Meta-Title bleiben der Baseline', () => {
		render(Page, { data });
		expect(document.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe(
			'Ranking-Ansicht wechseln'
		);
		expect(document.title).toBe(
			'Umwelt- & Infrastruktur-Score - Berlin in Daten - navigator.berlin'
		);
	});

	it('Empty-State ohne Zeilen behält den Baseline-Wortlaut', () => {
		render(Page, { data: { kieze: [], bezirke: [], computedAt: null } });
		expect(document.querySelector('[data-testid="ranking-empty"]')?.textContent?.trim()).toBe(
			'Score-Daten werden mit dem nächsten Build freigeschaltet.'
		);
	});
});

describe('umwelt-infrastruktur-score · JSON-LD EN (i18n C4b)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('Breadcrumb-Wurzel, Breadcrumb-Name und ItemList-Pfade folgen der Locale', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data });
		const crumbs = JSON.parse(
			document.querySelector('script[data-testid="ranking-breadcrumb-jsonld"]')?.textContent ?? '{}'
		);
		expect(crumbs.itemListElement[0].item).toMatch(/\/en\/$/);
		expect(crumbs.itemListElement[1].name).toBe('Environment & infrastructure score');
		const list =
			document.querySelector('script[data-testid="ranking-itemlist-jsonld"]')?.textContent ?? '';
		expect(list).toContain('/en/kiez/wedding');
	});
});
