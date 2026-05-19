import { describe, it, expect } from 'vitest';
import { createGetElectionResultTool } from './get-election-result.js';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	Top5Entry
} from '$lib/data/get-wahl-results-at-point.js';

function makeTop(entries: Array<[string, number]>): Top5Entry[] {
	return entries.map(([k, a]) => ({
		kurzname: k,
		vollname: k,
		farbeHex: '#111',
		stimmen: Math.round(a * 1000),
		anteil: a
	}));
}

function makeBundle(jahr: number, isRepeat = false): WahlResultBundle {
	return {
		wahl: {
			id: jahr,
			jahr,
			typ: 'btw',
			stimmtyp: 'zweitstimme',
			isRepeatElection: isRepeat,
			parentElectionId: null,
			sourceUrl: 'https://bundeswahlleiterin.de/x.zip',
			license: 'dl-de/by-2-0'
		},
		uwbId: '075-01-100-0',
		levels: {
			stimmbezirk: { available: true, top5: makeTop([['CDU', 0.3], ['SPD', 0.25]]) },
			kiez: { available: true, top5: makeTop([['SPD', 0.3], ['GRÜNE', 0.25]]) },
			bezirk: { available: true, top5: makeTop([['SPD', 0.28]]) },
			berlin: { available: true, top5: makeTop([['CDU', 0.22]]) }
		}
	};
}

function makeResults(bundles: WahlResultBundle[]): WahlResultsAtPoint {
	return {
		point: { lat: 52.52, lng: 13.41 },
		location: { bezirkSlug: 'mitte', kiezSlug: 'alex' },
		wahlbezirks: {},
		wahlen: bundles,
		sparklines: []
	};
}

describe('get_election_result tool', () => {
	it('hat snake_case-Name', () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2025)])
		});
		expect(tool.name).toBe('get_election_result');
	});

	it('liefert top + source + license', async () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2025)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slug: '2025-btw-zweitstimme'
		})) as Record<string, unknown>;
		expect(out.election_slug).toBe('2025-btw-zweitstimme');
		expect(out.level).toBe('stimmbezirk');
		expect(out.source).toBe('Bundeswahlleiterin');
		expect(out.license).toBe('dl-de/by-2-0');
		expect(Array.isArray(out.top)).toBe(true);
	});

	it('ergänzt Briefwahl-Caveat bei pre-2021-stimmbezirk', async () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2017)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slug: '2017-btw-zweitstimme',
			level: 'stimmbezirk'
		})) as Record<string, unknown>;
		expect((out.caveats as string[])[0]).toContain('Briefstimmen');
	});

	it('keine Briefwahl-Caveat bei post-2021-stimmbezirk', async () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2025)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slug: '2025-btw-zweitstimme',
			level: 'stimmbezirk'
		})) as Record<string, unknown>;
		expect(out.caveats).toBeUndefined();
	});

	it('Wiederholungswahl-Caveat', async () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () =>
				makeResults([{ ...makeBundle(2023, true), wahl: { ...makeBundle(2023, true).wahl } }])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slug: '2023-btw-zweitstimme'
		})) as Record<string, unknown>;
		expect((out.caveats as string[]).some((c) => c.includes('Wiederholungswahl'))).toBe(true);
	});

	it('Error address_outside_berlin', async () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () => null
		});
		const out = (await tool.handler({
			lat: 0,
			lng: 0,
			election_slug: '2025-btw-zweitstimme'
		})) as Record<string, unknown>;
		expect(out.error).toBe('address_outside_berlin');
	});

	it('Error election_not_found', async () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2025)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slug: '1999-btw-zweitstimme'
		})) as Record<string, unknown>;
		expect(out.error).toBe('election_not_found');
	});

	it('Schema-Validation: ungültiges Slug-Format wirft', async () => {
		const tool = createGetElectionResultTool({
			fetchResultsAtPoint: async () => null
		});
		await expect(
			tool.handler({ lat: 52.52, lng: 13.41, election_slug: 'invalid-format' })
		).rejects.toThrow();
	});
});
