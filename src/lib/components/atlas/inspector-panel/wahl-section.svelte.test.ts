import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import WahlSection from './wahl-section.svelte';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	LevelKey,
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
			license: 'dl-de/by-2.0'
		},
		uwbId: '075-01-100-0',
		levels: {
			stimmbezirk: makeLevel([
				{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 300, anteil: 0.3 },
				{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 250, anteil: 0.25 },
				{ kurzname: 'GRÜNE', vollname: 'GRÜNE', farbeHex: '#1AA037', stimmen: 200, anteil: 0.2 },
				{ kurzname: 'AfD', vollname: 'AfD', farbeHex: '#009EE0', stimmen: 150, anteil: 0.15 },
				{ kurzname: 'Die Linke', vollname: 'Die Linke', farbeHex: '#BE3075', stimmen: 100, anteil: 0.1 }
			]),
			kiez: makeLevel([
				{ kurzname: 'GRÜNE', vollname: 'GRÜNE', farbeHex: '#1AA037', stimmen: 3000, anteil: 0.3 },
				{ kurzname: 'Die Linke', vollname: 'Die Linke', farbeHex: '#BE3075', stimmen: 2500, anteil: 0.25 },
				{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 2000, anteil: 0.2 },
				{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 1500, anteil: 0.15 },
				{ kurzname: 'AfD', vollname: 'AfD', farbeHex: '#009EE0', stimmen: 1000, anteil: 0.1 }
			]),
			bezirk: makeLevel([
				{ kurzname: 'GRÜNE', vollname: 'GRÜNE', farbeHex: '#1AA037', stimmen: 30000, anteil: 0.28 },
				{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 25000, anteil: 0.23 }
			]),
			berlin: makeLevel([
				{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 300000, anteil: 0.22 }
			])
		}
	};
	return { ...base, ...overrides };
}

function makeResults(bundles: WahlResultBundle[]): WahlResultsAtPoint {
	return {
		point: { lat: 52.52, lng: 13.41 },
		location: { bezirkSlug: 'mitte', kiezSlug: 'alexanderplatz' },
		wahlbezirks: { bt25: { uwbId: '100', bezirkCode: '01' } },
		wahlen: bundles
	};
}

describe('WahlSection', () => {
	it('rendert nichts wenn results=null', async () => {
		render(WahlSection, { results: null });
		await expect.element(page.getByTestId('wahl-section')).not.toBeInTheDocument();
	});

	it('rendert nichts bei leerem wahlen-Array', async () => {
		render(WahlSection, { results: makeResults([]) });
		await expect.element(page.getByTestId('wahl-section')).not.toBeInTheDocument();
	});

	it('rendert Section-Header + Methodik-Link', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		await expect.element(page.getByTestId('wahl-section')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-section-header')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-methodik-link')).toBeInTheDocument();
	});

	it('zeigt Wahltyp-Tab Bundestag (BTW) standardmäßig selected', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const tab = page.getByTestId('wahl-typ-tab-btw');
		await expect.element(tab).toBeInTheDocument();
		await expect.element(tab).toHaveAttribute('aria-selected', 'true');
	});

	it('zeigt Stacked-Bar mit Top-5-Parteien für Kiez-Level (Default)', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		await expect.element(page.getByTestId('wahl-stacked-bar')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-legend')).toBeInTheDocument();
	});

	it('a11y-Table rendert mit Top-5-Daten', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const table = page.getByTestId('wahl-a11y-table');
		await expect.element(table).toBeInTheDocument();
	});

	it('level-Switch wechselt zwischen Levels', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const select = page.getByTestId('wahl-level-switch');
		await expect.element(select).toBeInTheDocument();
		await select.selectOptions('berlin');
		await expect.element(page.getByTestId('wahl-legend')).toBeInTheDocument();
	});

	it('zeigt Wiederholungs-Marker wenn isRepeatElection=true', async () => {
		const b = makeBundle({
			wahl: {
				id: 9,
				jahr: 2023,
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				isRepeatElection: true,
				parentElectionId: 13,
				sourceUrl: 'https://download.statistik-berlin-brandenburg.de/abc/AGHBVV2023.xlsx',
				license: 'dl-de/by-2.0'
			}
		});
		render(WahlSection, { results: makeResults([b]) });
		const tab = page.getByTestId('wahl-typ-tab-agh');
		await tab.click();
		await expect.element(page.getByTestId('wahl-wiederholung-marker')).toBeInTheDocument();
	});

	it('zeigt Briefwahl-Note auf Stimmbezirks-Level wenn isBriefwahlAggregat=true', async () => {
		const b = makeBundle();
		b.levels.stimmbezirk = {
			available: true,
			top5: b.levels.stimmbezirk.top5,
			isBriefwahlAggregat: true
		};
		render(WahlSection, { results: makeResults([b]) });
		const select = page.getByTestId('wahl-level-switch');
		await select.selectOptions('stimmbezirk');
		await expect.element(page.getByTestId('wahl-briefwahl-note')).toBeInTheDocument();
	});

	it('rendert Editorial-Disclaimer wahl-stimmenanteile', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const dc = page.getByTestId('editorial-disclaimer');
		await expect.element(dc).toBeInTheDocument();
		await expect.element(dc).toHaveAttribute('data-variant', 'wahl-stimmenanteile');
	});

	it('zeigt 3 Wahltypen wenn alle vorhanden', async () => {
		const btw = makeBundle();
		const agh = makeBundle({
			wahl: { ...btw.wahl, id: 2, typ: 'agh' }
		});
		const bvv = makeBundle({
			wahl: { ...btw.wahl, id: 3, typ: 'bvv', stimmtyp: 'einstimme' }
		});
		render(WahlSection, { results: makeResults([btw, agh, bvv]) });
		await expect.element(page.getByTestId('wahl-typ-tab-btw')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-typ-tab-agh')).toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-typ-tab-bvv')).toBeInTheDocument();
	});
});
