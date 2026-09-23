import { describe, it, expect } from 'vitest';
import { createCompareElectionsTool } from './compare-elections.js';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	LevelKey
} from '$lib/data/get-wahl-results-at-point.js';

function makeBundle(
	jahr: number,
	levels: Partial<Record<LevelKey, boolean>> = {},
	vorlaeufig = false,
	sourceUpdatedAt: string | null = null
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
			license: 'dl-de/by-2-0',
			vorlaeufig,
			sourceUpdatedAt
		},
		uwbId: null,
		gruppeId: null,
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

	it('ergänzt Kiez-Caveat (Postwahl-Schätzung) pro Series-Eintrag auf Default-Ebene kiez (Review-Fund)', async () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () => makeResults([makeBundle(2017), makeBundle(2025)])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slugs: ['2017-btw-zweitstimme', '2025-btw-zweitstimme']
		})) as Record<string, unknown>;
		const series = out.series as Array<Record<string, unknown>>;
		for (const entry of series) {
			expect((entry.caveats as string[])[0]).toContain('postal votes allocated proportionally');
		}
	});

	it('reicht provisional/source_updated_at je Series-Eintrag durch (Story: Ingest AGH/BVV 2026)', async () => {
		const tool = createCompareElectionsTool({
			fetchResultsAtPoint: async () =>
				makeResults([makeBundle(2025), makeBundle(2026, {}, true, '2026-09-20T23:55:55.000Z')])
		});
		const out = (await tool.handler({
			lat: 52.52,
			lng: 13.41,
			election_slugs: ['2025-btw-zweitstimme', '2026-btw-zweitstimme']
		})) as {
			series: Array<{ jahr: number; provisional: boolean; source_updated_at: string | null }>;
		};
		const alt = out.series.find((s) => s.jahr === 2025);
		const neu = out.series.find((s) => s.jahr === 2026);
		expect(alt?.provisional).toBe(false);
		expect(alt?.source_updated_at).toBeNull();
		expect(neu?.provisional).toBe(true);
		expect(neu?.source_updated_at).toBe('2026-09-20T23:55:55.000Z');
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
