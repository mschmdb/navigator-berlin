import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import WahlSection from './wahl-section.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});
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
			license: 'dl-de/by-2.0',
			vorlaeufig: false,
			sourceUpdatedAt: null
		},
		uwbId: '075-01-100-0',
		gruppeId: '075-01-1A-5',
		levels: {
			stimmbezirk: makeLevel([
				{ kurzname: 'SPD', vollname: 'SPD', farbeHex: '#E3000F', stimmen: 300, anteil: 0.3 },
				{ kurzname: 'CDU', vollname: 'CDU', farbeHex: '#000000', stimmen: 250, anteil: 0.25 },
				{ kurzname: 'GRÜNE', vollname: 'GRÜNE', farbeHex: '#1AA037', stimmen: 200, anteil: 0.2 },
				{ kurzname: 'AfD', vollname: 'AfD', farbeHex: '#009EE0', stimmen: 150, anteil: 0.15 },
				{
					kurzname: 'Die Linke',
					vollname: 'Die Linke',
					farbeHex: '#BE3075',
					stimmen: 100,
					anteil: 0.1
				}
			]),
			kiez: makeLevel([
				{ kurzname: 'GRÜNE', vollname: 'GRÜNE', farbeHex: '#1AA037', stimmen: 3000, anteil: 0.3 },
				{
					kurzname: 'Die Linke',
					vollname: 'Die Linke',
					farbeHex: '#BE3075',
					stimmen: 2500,
					anteil: 0.25
				},
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
		wahlen: bundles,
		sparklines: []
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

	it('level-Switch wechselt zwischen Levels via Pill-Click', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const group = page.getByTestId('wahl-level-switch');
		await expect.element(group).toBeInTheDocument();
		const berlinPill = page.getByTestId('wahl-level-berlin');
		await berlinPill.click();
		await expect.element(berlinPill).toHaveAttribute('aria-checked', 'true');
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
				license: 'dl-de/by-2.0',
				vorlaeufig: false,
				sourceUpdatedAt: null
			}
		});
		render(WahlSection, { results: makeResults([b]) });
		const tab = page.getByTestId('wahl-typ-tab-agh');
		await tab.click();
		await expect.element(page.getByTestId('wahl-wiederholung-marker')).toBeInTheDocument();
	});

	it('zeigt Vorläufig-Marker mit Stand-Datum wenn vorlaeufig=true (Story: Ingest AGH/BVV 2026)', async () => {
		const b = makeBundle({
			wahl: {
				id: 22,
				jahr: 2026,
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				isRepeatElection: false,
				parentElectionId: null,
				sourceUrl: 'https://www.wahlen-berlin.de/wahlen/BE2026/x.csv',
				license: 'dl-de/by-2.0',
				vorlaeufig: true,
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			}
		});
		render(WahlSection, { results: makeResults([b]) });
		const tab = page.getByTestId('wahl-typ-tab-agh');
		await tab.click();
		await expect
			.element(page.getByTestId('wahl-vorlaeufig-marker'))
			.toHaveTextContent('Vorläufig · Stand 21.09.2026');
	});

	it('zeigt keinen Vorläufig-Marker wenn vorlaeufig=false', async () => {
		const b = makeBundle({
			wahl: {
				id: 9,
				jahr: 2023,
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				isRepeatElection: false,
				parentElectionId: null,
				sourceUrl: 'https://download.statistik-berlin-brandenburg.de/abc.xlsx',
				license: 'dl-de/by-2.0',
				vorlaeufig: false,
				sourceUpdatedAt: null
			}
		});
		render(WahlSection, { results: makeResults([b]) });
		const tab = page.getByTestId('wahl-typ-tab-agh');
		await tab.click();
		await expect.element(page.getByTestId('wahl-vorlaeufig-marker')).not.toBeInTheDocument();
	});

	it('zeigt Landeswahlleiterin Berlin als Quelle bei wahlen-berlin.de-URL (Story: Ingest AGH/BVV 2026)', async () => {
		const b = makeBundle({
			wahl: {
				id: 22,
				jahr: 2026,
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				isRepeatElection: false,
				parentElectionId: null,
				sourceUrl: 'https://www.wahlen-berlin.de/wahlen/BE2026/x.csv',
				license: 'dl-de/by-2.0',
				vorlaeufig: true,
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			}
		});
		render(WahlSection, { results: makeResults([b]) });
		const tab = page.getByTestId('wahl-typ-tab-agh');
		await tab.click();
		await expect
			.element(page.getByTestId('wahl-meta'))
			.toHaveTextContent('Landeswahlleiterin Berlin');
	});

	it('unterdrückt BriefwahlMarker + Hairline auf Stimmbezirks-Level auch bei pre-2021-Wahl (Story 17: Briefwahl-Gruppen gelten für alle Jahre mit Geometrie)', async () => {
		const b = makeBundle({
			wahl: {
				id: 17,
				jahr: 2017,
				typ: 'btw',
				stimmtyp: 'zweitstimme',
				isRepeatElection: false,
				parentElectionId: null,
				sourceUrl: 'https://bundeswahlleiterin.de/dam/jcr/abc/btw17_wbz.zip',
				license: 'dl-de/by-2.0',
				vorlaeufig: false,
				sourceUpdatedAt: null
			}
		});
		render(WahlSection, { results: makeResults([b]) });
		const stimmbezirkPill = page.getByTestId('wahl-level-stimmbezirk');
		await stimmbezirkPill.click();
		await expect.element(page.getByTestId('briefwahl-marker')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-confidence-hairline')).not.toBeInTheDocument();
	});

	it('unterdrückt BriefwahlMarker bei post-2021-Wahl auch auf Stimmbezirks-Level', async () => {
		const b = makeBundle();
		render(WahlSection, { results: makeResults([b]) });
		const stimmbezirkPill = page.getByTestId('wahl-level-stimmbezirk');
		await stimmbezirkPill.click();
		await expect.element(page.getByTestId('briefwahl-marker')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('wahl-confidence-hairline')).not.toBeInTheDocument();
	});

	it('zeigt BriefwahlMarker auf Kiez-Ebene als Schätzungs-Hinweis (Review-Fund: Kiez-Werte enthalten anteilig verteilte Briefwahl ohne jeden Hinweis)', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const kiezPill = page.getByTestId('wahl-level-kiez');
		await kiezPill.click();
		await expect.element(page.getByTestId('briefwahl-marker')).toBeInTheDocument();
		await expect
			.element(page.getByTestId('briefwahl-marker-trigger'))
			.toHaveTextContent('Briefwahl geschätzt');
	});

	it('unterdrückt BriefwahlMarker auf Bezirks-Ebene', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const bezirkPill = page.getByTestId('wahl-level-bezirk');
		await bezirkPill.click();
		await expect.element(page.getByTestId('briefwahl-marker')).not.toBeInTheDocument();
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

	// Review-Fund: Detail-/Methodik-Link waren NICHT über `localizedHref`
	// lokalisiert (immer DE-Pfad, unabhängig von `lang`).
	it('Detail-Link + Methodik-Link zeigen DE-Pfade ohne Präfix', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const detail = (await page.getByTestId('wahl-detail-link').element()) as HTMLAnchorElement;
		const methodik = (await page.getByTestId('wahl-methodik-link').element()) as HTMLAnchorElement;
		expect(detail.getAttribute('href')).toBe('/berlin-wahlen/2025-btw-zweitstimme');
		expect(methodik.getAttribute('href')).toBe('/methodik/wahldaten');
	});

	it('Detail-Link + Methodik-Link zeigen /en/-Pfade für lang="en"', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]), lang: 'en' });
		const detail = (await page.getByTestId('wahl-detail-link').element()) as HTMLAnchorElement;
		const methodik = (await page.getByTestId('wahl-methodik-link').element()) as HTMLAnchorElement;
		expect(detail.getAttribute('href')).toBe('/en/berlin-wahlen/2025-btw-zweitstimme');
		expect(methodik.getAttribute('href')).toBe('/en/methodik/wahldaten');
	});

	// Review-Fund: Delta-Pill-`title` (positiv + negativ) und der exakte
	// DE-Prozent-String waren ungetestet.
	it('Delta-Pill-title DE: positiv "höher" (GRÜNE ggü. Stimmbezirk) + negativ "niedriger" (SPD ggü. Bezirk)', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		const gruene = page.getByTestId('wahl-delta-GRÜNE-stimmbezirk');
		await expect
			.element(gruene)
			.toHaveAttribute('title', 'Stimmbezirk: 20,0 % (hier 10,0 Prozent-Punkte höher)');
		const spd = page.getByTestId('wahl-delta-SPD-bezirk');
		await expect
			.element(spd)
			.toHaveAttribute('title', 'Bezirk: 23,0 % (hier 3,0 Prozent-Punkte niedriger)');
	});

	it('Delta-Pill-title EN: positiv "higher" + negativ "lower"', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]), lang: 'en' });
		const gruene = page.getByTestId('wahl-delta-GRÜNE-stimmbezirk');
		await expect
			.element(gruene)
			.toHaveAttribute(
				'title',
				'Polling district: 20.0% (here 10.0 percentage points higher)'
			);
		const spd = page.getByTestId('wahl-delta-SPD-bezirk');
		await expect
			.element(spd)
			.toHaveAttribute('title', 'Bezirk: 23.0% (here 3.0 percentage points lower)');
	});

	it('Top-5-Anteil zeigt DE-Prozent mit Komma + Leerzeichen ("30,0 %")', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]) });
		await expect.element(page.getByTestId('wahl-legend')).toHaveTextContent('30,0 %');
	});

	// i18n Block B3b: englische Wahlsektion via `lang="en"`-Prop.
	it('rendert englische Wahlsektion für lang="en" (Header, Ebene, Glossar, Prozent)', async () => {
		render(WahlSection, { results: makeResults([makeBundle()]), lang: 'en' });
		await expect
			.element(page.getByTestId('wahl-section-header'))
			.toHaveTextContent('Voting behaviour here');
		await expect.element(page.getByTestId('wahl-typ-tab-btw')).toHaveTextContent('Bundestag');
		await expect
			.element(page.getByTestId('wahl-methodik-link'))
			.toHaveTextContent('Methodology · Election data');
		const berlinPill = page.getByTestId('wahl-level-berlin');
		await expect.element(berlinPill).toHaveTextContent('Berlin overall');
		await expect.element(page.getByTestId('wahl-legend')).toHaveTextContent('%');
		await expect.element(page.getByTestId('wahl-legend')).not.toHaveTextContent(' %');
	});

	// Review-relevant: die Karten-/Inspector-Oberfläche übergibt kein `lang`-Prop,
	// sondern verlässt sich auf den `getLocale()`-Default-Pfad (Muster B3a).
	it('rendert englisch über den Default-Pfad (getLocale()), ohne explizites lang-Prop', async () => {
		overwriteGetLocale(() => 'en');
		render(WahlSection, { results: makeResults([makeBundle()]) });
		await expect
			.element(page.getByTestId('wahl-section-header'))
			.toHaveTextContent('Voting behaviour here');
	});

	it('zeigt Vorläufig-Marker mit englischem Datum für lang="en"', async () => {
		const b = makeBundle({
			wahl: {
				id: 22,
				jahr: 2026,
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				isRepeatElection: false,
				parentElectionId: null,
				sourceUrl: 'https://www.wahlen-berlin.de/wahlen/BE2026/x.csv',
				license: 'dl-de/by-2.0',
				vorlaeufig: true,
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			}
		});
		render(WahlSection, { results: makeResults([b]), lang: 'en' });
		const tab = page.getByTestId('wahl-typ-tab-agh');
		await tab.click();
		await expect
			.element(page.getByTestId('wahl-vorlaeufig-marker'))
			.toHaveTextContent('Provisional · as of 21 September 2026');
	});

	it('zeigt englische Quelle + Lizenz-Code unverändert in wahl-meta für lang="en"', async () => {
		const b = makeBundle({
			wahl: {
				id: 22,
				jahr: 2026,
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				isRepeatElection: false,
				parentElectionId: null,
				sourceUrl: 'https://www.wahlen-berlin.de/wahlen/BE2026/x.csv',
				license: 'dl-de/by-2.0',
				vorlaeufig: true,
				sourceUpdatedAt: '2026-09-20T23:55:55.000Z'
			}
		});
		render(WahlSection, { results: makeResults([b]), lang: 'en' });
		const tab = page.getByTestId('wahl-typ-tab-agh');
		await tab.click();
		const meta = page.getByTestId('wahl-meta');
		await expect
			.element(meta)
			.toHaveTextContent('Berlin State Election Commissioner (Landeswahlleiterin Berlin)');
		await expect.element(meta).toHaveTextContent('Licence dl-de/by-2.0');
	});
});
