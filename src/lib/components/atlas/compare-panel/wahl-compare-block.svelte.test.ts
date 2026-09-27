import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import WahlCompareBlock from './wahl-compare-block.svelte';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	LevelResults
} from '$lib/data/get-wahl-results-at-point.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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
		await expect.element(page.getByTestId('wahl-compare-briefwahl-marker')).not.toBeInTheDocument();
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

// i18n Block B3c: EN-Locale übersetzt Header, Wahl-/Ebenen-Tabs, Empty-Text,
// Methodik-Link (localizedHref → /en/...) und die Diff-Spalte.
describe('WahlCompareBlock i18n Block B3c (EN)', () => {
	it('Header, Typ-Tab und Empty-Text englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(WahlCompareBlock, {
			resultsA: makeResults(makeBundle()),
			resultsB: null
		});
		await expect
			.element(page.getByTestId('wahl-compare-header'))
			.toHaveTextContent('Voting behaviour · comparison');
		const typTab = (await page.getByTestId('wahl-compare-typ-tab-btw').element()) as HTMLElement;
		expect(typTab.textContent?.trim()).toBe('Bundestag');
	});

	it('Methodik-Link zeigt unter EN auf /en/methodik/wahldaten', async () => {
		overwriteGetLocale(() => 'en');
		render(WahlCompareBlock, {
			resultsA: makeResults(makeBundle()),
			resultsB: null
		});
		const link = (await page
			.getByTestId('wahl-compare-methodik-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/methodik/wahldaten');
		expect(link.textContent?.trim()).toBe('Methodology · voting data');
	});

	it('Diff-Spalte: Titel + Richtung englisch', async () => {
		overwriteGetLocale(() => 'en');
		const bundleA = makeBundle();
		const bundleB = makeBundle({
			levels: {
				...makeBundle().levels,
				stimmbezirk: makeLevel([
					{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 100, anteil: 0.1 },
					{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 250, anteil: 0.25 }
				])
			}
		});
		render(WahlCompareBlock, {
			resultsA: makeResults(bundleA),
			resultsB: makeResults(bundleB)
		});
		const diffCell = (await page
			.getByTestId('wahl-compare-SPD-diff')
			.element()) as HTMLTableCellElement;
		expect(diffCell.getAttribute('title')).toMatch(
			/Difference A−B.*percentage points.*higher in A/
		);
	});

	it('agh-Tab zeigt das EN-Institutions-Label', async () => {
		overwriteGetLocale(() => 'en');
		const bundle = makeBundle({ wahl: { ...makeBundle().wahl, typ: 'agh' } });
		render(WahlCompareBlock, { resultsA: makeResults(bundle), resultsB: null });
		const aghTab = (await page.getByTestId('wahl-compare-typ-tab-agh').element()) as HTMLElement;
		expect(aghTab.textContent?.trim()).toBe('House of Representatives');
	});

	it('EN-Briefwahl-Marker: Label + lokalisierter methodikHref', async () => {
		overwriteGetLocale(() => 'en');
		const kiezLevel = makeLevel([
			{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 300, anteil: 0.3 }
		]);
		const bundle = makeBundle({ levels: { ...makeBundle().levels, kiez: kiezLevel } });
		render(WahlCompareBlock, { resultsA: makeResults(bundle), resultsB: makeResults(bundle) });
		await page.getByTestId('wahl-compare-level-kiez').click();
		const trigger = (await page
			.getByTestId('wahl-compare-briefwahl-marker-trigger')
			.element()) as HTMLAnchorElement;
		expect(trigger.textContent).toContain('Postal vote estimated');
		expect(trigger.getAttribute('href')).toBe('/en/methodik/wahldaten#wahldaten-briefwahl');
	});

	it('EN-Ebenen-Label unterscheidet sich von DE (Berlin gesamt → Berlin overall)', async () => {
		overwriteGetLocale(() => 'en');
		const berlinLevel = makeLevel([
			{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 3000, anteil: 0.3 }
		]);
		const bundle = makeBundle({ levels: { ...makeBundle().levels, berlin: berlinLevel } });
		render(WahlCompareBlock, { resultsA: makeResults(bundle), resultsB: null });
		const berlinToggle = (await page
			.getByTestId('wahl-compare-level-berlin')
			.element()) as HTMLElement;
		expect(berlinToggle.textContent?.trim()).toBe('Berlin overall');
	});

	it('Meta-Zeile, Diff-Zelle und Prozent-Zelle englisch formatiert', async () => {
		overwriteGetLocale(() => 'en');
		const bundleA = makeBundle();
		const bundleB = makeBundle({
			levels: {
				...makeBundle().levels,
				stimmbezirk: makeLevel([
					{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 250, anteil: 0.25 },
					{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 250, anteil: 0.25 }
				])
			}
		});
		render(WahlCompareBlock, { resultsA: makeResults(bundleA), resultsB: makeResults(bundleB) });
		const meta = (await page.getByTestId('wahl-compare-meta').element()) as HTMLElement;
		expect(meta.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Bundestag 2025 · Level Polling district · party vote'
		);
		const spdA = (await page.getByTestId('wahl-compare-SPD-a').element()) as HTMLElement;
		expect(spdA.textContent?.trim()).toBe('30.0%');
		const diffCell = (await page.getByTestId('wahl-compare-SPD-diff').element()) as HTMLElement;
		expect(diffCell.textContent?.trim()).toBe('+5.0');
	});
});

// DE-Kontrolle zu den B3c-Review-Ergänzungen (Meta-Zeile, Diff-/Prozent-Zellen).
describe('WahlCompareBlock DE-Kontrolle (Review-Ergänzung)', () => {
	it('Meta-Zeile, Diff-Zelle und Prozent-Zelle bleiben deutsch formatiert', async () => {
		const bundleA = makeBundle();
		const bundleB = makeBundle({
			levels: {
				...makeBundle().levels,
				stimmbezirk: makeLevel([
					{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 250, anteil: 0.25 },
					{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 250, anteil: 0.25 }
				])
			}
		});
		render(WahlCompareBlock, { resultsA: makeResults(bundleA), resultsB: makeResults(bundleB) });
		const meta = (await page.getByTestId('wahl-compare-meta').element()) as HTMLElement;
		expect(meta.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Bundestag 2025 · Ebene Stimmbezirk · Zweitstimme'
		);
		const spdA = (await page.getByTestId('wahl-compare-SPD-a').element()) as HTMLElement;
		expect(spdA.textContent?.trim()).toBe('30,0 %');
		const diffCell = (await page.getByTestId('wahl-compare-SPD-diff').element()) as HTMLElement;
		expect(diffCell.textContent?.trim()).toBe('+5,0');
	});
});
