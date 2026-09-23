import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import WahlCompareBlock from './wahl-compare-block.svelte';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	LevelResults
} from '$lib/data/get-wahl-results-at-point.js';

function makeLevel(top5: LevelResults['top5']): LevelResults {
	return { available: !!top5 && top5.length > 0, top5 };
}

function makeBundle(overrides: Partial<WahlResultBundle> = {}): WahlResultBundle {
	const base: WahlResultBundle = {
		wahl: {
			id: 1,
			jahr: 2025,
			typ: 'btw',
			stimmtyp: 'zweitstimme',
			isRepeatElection: false,
			parentElectionId: null,
			sourceUrl: 'https://bundeswahlleiterin.de/dam/jcr/abc/btw25_wbz.zip',
			license: 'dl-de/by-2.0',
			vorlaeufig: false,
			sourceUpdatedAt: null
		},
		uwbId: '075-01-100-0',
		gruppeId: '075-01-1A-5',
		levels: {
			stimmbezirk: makeLevel([
				{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 300, anteil: 0.3 },
				{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 250, anteil: 0.25 }
			]),
			kiez: makeLevel(null),
			bezirk: makeLevel(null),
			berlin: makeLevel(null)
		}
	};
	return { ...base, ...overrides };
}

function makeResults(bundle: WahlResultBundle): WahlResultsAtPoint {
	return {
		point: { lat: 52.52, lng: 13.41 },
		location: { bezirkSlug: 'mitte', kiezSlug: 'alexanderplatz' },
		wahlbezirks: { bt25: { uwbId: '100', bezirkCode: '01' } },
		wahlen: [bundle],
		sparklines: []
	};
}

describe('WahlCompareBlock Kiez-Briefwahl-Schätzungs-Hinweis (Review-Fund: Kiez-Werte enthalten anteilig verteilte Briefwahl ohne jeden Hinweis)', () => {
	const kiezLevel = makeLevel([
		{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 3000, anteil: 0.3 }
	]);

	it('unterdrückt den BriefwahlMarker auf der Default-Ebene (Stimmbezirk)', async () => {
		const bundleA = makeBundle({ levels: { ...makeBundle().levels, kiez: kiezLevel } });
		const bundleB = makeBundle({ levels: { ...makeBundle().levels, kiez: kiezLevel } });
		render(WahlCompareBlock, {
			resultsA: makeResults(bundleA),
			resultsB: makeResults(bundleB)
		});
		await expect
			.element(page.getByTestId('wahl-compare-briefwahl-marker'))
			.not.toBeInTheDocument();
	});

	it('zeigt den BriefwahlMarker auf Kiez-Ebene', async () => {
		const bundleA = makeBundle({ levels: { ...makeBundle().levels, kiez: kiezLevel } });
		const bundleB = makeBundle({ levels: { ...makeBundle().levels, kiez: kiezLevel } });
		render(WahlCompareBlock, {
			resultsA: makeResults(bundleA),
			resultsB: makeResults(bundleB)
		});
		await page.getByTestId('wahl-compare-level-kiez').click();
		await expect.element(page.getByTestId('wahl-compare-briefwahl-marker')).toBeInTheDocument();
	});
});

describe('WahlCompareBlock sameAggregat (Stimmbezirks-Ebene)', () => {
	it('erkennt dieselbe Briefwahl-Gruppe trotz unterschiedlicher Urnen-uwbId (Review-Fund: verglich bisher uwbId statt gruppeId)', async () => {
		const bundleA = makeBundle({ uwbId: '075-01-100-0', gruppeId: '075-01-1A-5' });
		const bundleB = makeBundle({ uwbId: '075-01-101-0', gruppeId: '075-01-1A-5' });
		render(WahlCompareBlock, {
			resultsA: makeResults(bundleA),
			resultsB: makeResults(bundleB)
		});
		await expect.element(page.getByTestId('wahl-compare-same-aggregat')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('wahl-compare-same-aggregat'))
			.toHaveTextContent('derselben Briefwahl-Gruppe');
	});

	it('meldet keine Übereinstimmung bei unterschiedlicher Gruppe', async () => {
		const bundleA = makeBundle({ uwbId: '075-01-100-0', gruppeId: '075-01-1A-5' });
		const bundleB = makeBundle({ uwbId: '075-01-200-0', gruppeId: '075-01-9Z-5' });
		render(WahlCompareBlock, {
			resultsA: makeResults(bundleA),
			resultsB: makeResults(bundleB)
		});
		await expect.element(page.getByTestId('wahl-compare-same-aggregat')).not.toBeInTheDocument();
	});
});
