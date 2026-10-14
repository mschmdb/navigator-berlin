import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import LayerKiezRanking from './layer-kiez-ranking.svelte';
import type {
	LayerKiezRanking as Ranking,
	RankingEntry,
	RankingList
} from '$lib/data/layer-kiez-ranking.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

function entry(i: number, value: number): RankingEntry {
	return { slug: `kiez-${i}`, name: `Kiez ${i}`, bezirkName: 'Mitte', value };
}

function list(entries: RankingEntry[], tie: RankingList['tie'] = null): RankingList {
	return { entries, tie };
}

const NEUTRAL: Ranking = {
	variant: 'neutral',
	unit: 'eur-m2',
	top: list([entry(1, 12.5), entry(2, 11)]),
	bottom: list([entry(3, 5.25)])
};

describe('layer-kiez-ranking.svelte', () => {
	it('neutral: zeigt höchste und niedrigste Werte mit Links auf die Kiez-Seiten', async () => {
		render(LayerKiezRanking, { ranking: NEUTRAL });
		await expect.element(page.getByRole('heading', { name: 'Höchste Werte' })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Niedrigste Werte' })).toBeVisible();
		const links = page.getByTestId('layer-kiez-ranking-link');
		await expect.element(links.first()).toHaveAttribute('href', '/kiez/kiez-1');
		await expect.element(links.first()).toHaveAccessibleName('Kiez 1, Mitte, 12,50 €/m²');
	});

	it('neutral: Hinweis nennt die Messgröße und "ohne Wertung"', async () => {
		render(LayerKiezRanking, { ranking: NEUTRAL, measure: 'Nettokaltmiete im Bestand' });
		await expect
			.element(page.getByTestId('layer-kiez-ranking-note'))
			.toHaveTextContent('Nettokaltmiete im Bestand. Die Werte stehen ohne Wertung nebeneinander.');
	});

	it('neutral ohne Messgröße: allgemeiner Hinweis', async () => {
		render(LayerKiezRanking, { ranking: NEUTRAL });
		await expect
			.element(page.getByTestId('layer-kiez-ranking-note'))
			.toHaveTextContent('Die Werte stehen ohne Wertung nebeneinander.');
	});

	it('Grad Celsius mit Dezimalkomma', async () => {
		render(LayerKiezRanking, {
			ranking: { variant: 'neutral', unit: 'celsius', top: list([entry(1, 38.1)]), bottom: null }
		});
		await expect.element(page.getByText('38,1 °C')).toBeInTheDocument();
	});

	it('Prozent mit Leerzeichen', async () => {
		render(LayerKiezRanking, {
			ranking: { variant: 'neutral', unit: 'percent', top: list([entry(1, 66.7)]), bottom: null }
		});
		await expect.element(page.getByText('66,7 %')).toBeInTheDocument();
	});

	it('score: Anzahl in der Überschrift, kein Hinweis, keine Flop-Liste', async () => {
		render(LayerKiezRanking, {
			ranking: {
				variant: 'score',
				unit: 'score',
				top: list([entry(1, 70), entry(2, 69)]),
				bottom: null
			},
			measure: 'egal'
		});
		await expect
			.element(page.getByRole('heading', { name: 'Die 2 bestbewerteten Kieze' }))
			.toBeVisible();
		expect(page.getByTestId('layer-kiez-ranking-note').elements()).toHaveLength(0);
		expect(page.getByTestId('layer-kiez-ranking-bottom').elements()).toHaveLength(0);
		await expect
			.element(page.getByTestId('layer-kiez-ranking-link').first())
			.toHaveAccessibleName('Kiez 1, Mitte, Kiez-Score 70');
	});

	it('Gleichstand: Liste endet davor, Hinweis nennt Anzahl und Wert', async () => {
		render(LayerKiezRanking, {
			ranking: {
				variant: 'neutral',
				unit: 'percent',
				top: list([entry(1, 12), entry(2, 11), entry(3, 10)], { count: 9, value: 0 }),
				bottom: list([], { count: 9, value: 0 })
			}
		});
		const more = page.getByTestId('layer-kiez-ranking-more');
		await expect.element(more.first()).toHaveTextContent('9 weitere Kieze mit 0 %');
		expect(more.elements()).toHaveLength(2);
		expect(
			page.getByTestId('layer-kiez-ranking-bottom').getByRole('listitem').elements()
		).toHaveLength(0);
	});

	it('EN: englische Überschriften, /en-Links und Einheiten', async () => {
		overwriteGetLocale(() => 'en');
		render(LayerKiezRanking, { ranking: NEUTRAL });
		await expect.element(page.getByRole('heading', { name: 'Highest values' })).toBeVisible();
		await expect
			.element(page.getByTestId('layer-kiez-ranking-link').first())
			.toHaveAttribute('href', '/en/kiez/kiez-1');
		await expect.element(page.getByText('€12.50/m²').first()).toBeInTheDocument();
	});
});
