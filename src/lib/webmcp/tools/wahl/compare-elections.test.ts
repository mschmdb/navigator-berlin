import { describe, it, expect } from 'vitest';
import { createCompareElectionsTool } from './compare-elections.js';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	LevelKey
} from '$lib/data/get-wahl-results-at-point.js';

function makeBundle(
	jahr: number,
	levels: Partial<Record<LevelKey, boolean>> = {}
): WahlResultBundle {
	const mk = (lvl: LevelKey) =>
		levels[lvl] !== false
			? {
					available: true,
					top5: [
						{
							kurzname: 'SPD',
							vollname: 'SPD',
							farbeHex: '#E3000F',
							stimmen: 100,
							anteil: 0.25
						}
					]
				}
			: { available: false, top5: null };
	return {
		wahl: {
			id: jahr,
			jahr,
			typ: 'btw',
			stimmtyp: 'zweitstimme',
			isRepeatElection: false,
			parentElectionId: null,
			sourceUrl: 'https://bundeswahlleiterin.de/x.zip',
			license: 'dl-de/by-2-0'
		},
		uwbId: null,
		levels: {
			stimmbezirk: mk('stimmbezirk'),
			kiez: mk('kiez'),
			bezirk: mk('bezirk'),
			berlin: mk('berlin')
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

describe('compare_elections tool', () => {
	it('hat snake_case-Name', () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () => makeResults([])
		});
		expect(tool.name).toBe('compare_elections');
	});

	it('liefert series + common level (Default kiez)', async () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2017), makeBundle(2025)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slugs: ['2017-btw-zweitstimme', '2025-btw-zweitstimme']
		})) as Record<string, unknown>;
		expect(out.level).toBe('kiez');
		expect((out.series as unknown[]).length).toBe(2);
	});

	it('Error election_not_found bei missing slug', async () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2025)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slugs: ['2025-btw-zweitstimme', '1999-btw-zweitstimme']
		})) as Record<string, unknown>;
		expect(out.error).toBe('election_not_found');
	});

	it('respektiert level-Hint', async () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2017), makeBundle(2025)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slugs: ['2017-btw-zweitstimme', '2025-btw-zweitstimme'],
			level: 'bezirk'
		})) as Record<string, unknown>;
		expect(out.level).toBe('bezirk');
	});

	it('Error no_common_level wenn Levels nicht überlappen', async () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () =>
				makeResults([
					makeBundle(2013, { stimmbezirk: false, kiez: false, bezirk: false }),
					makeBundle(2025)
				])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slugs: ['2013-btw-zweitstimme', '2025-btw-zweitstimme']
		})) as Record<string, unknown>;
		expect(out.level).toBe('berlin');
	});

	it('Schema-Validation: zu wenige slugs (1) wirft', async () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () => null
		});
		await expect(
			tool.handler({
				lat: 52.52,
				lng: 13.41,
				election_slugs: ['2025-btw-zweitstimme']
			})
		).rejects.toThrow();
	});
});
