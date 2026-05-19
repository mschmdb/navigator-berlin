import { describe, it, expect } from 'vitest';
import { createListElectionsTool, type ElectionListEntry } from './list-elections.js';

const FIXTURE: ElectionListEntry[] = [
	{
		slug: '2025-btw-zweitstimme',
		jahr: 2025,
		typ: 'btw',
		stimmtyp: 'zweitstimme',
		is_repeat_election: false,
		parent_slug: null,
		has_stimmbezirks_geometry: true,
		source_name: 'Bundeswahlleiterin',
		source_url: 'https://bundeswahlleiterin.de/dam/jcr/abc/btw25_wbz.zip',
		license: 'dl-de/by-2-0'
	},
	{
		slug: '2023-bvv',
		jahr: 2023,
		typ: 'bvv',
		stimmtyp: 'einstimme',
		is_repeat_election: true,
		parent_slug: '2021-bvv',
		has_stimmbezirks_geometry: true,
		source_name: 'Amt für Statistik Berlin-Brandenburg',
		source_url: 'https://download.statistik-berlin-brandenburg.de/x.xlsx',
		license: 'dl-de/by-2-0'
	}
];

describe('list_elections tool', () => {
	it('hat snake_case-Name', () => {
		const tool = createListElectionsTool({ fetchElections: async () => FIXTURE });
		expect(tool.name).toBe('list_elections');
	});

	it('liefert elections-Array mit Provenance + Geometry-Flag', async () => {
		const tool = createListElectionsTool({ fetchElections: async () => FIXTURE });
		const out = (await tool.handler({})) as unknown as { elections: typeof FIXTURE };
		expect(out.elections).toHaveLength(2);
		expect(out.elections[0]).toMatchObject({
			slug: '2025-btw-zweitstimme',
			has_stimmbezirks_geometry: true,
			source_name: 'Bundeswahlleiterin'
		});
		expect(out.elections[1].is_repeat_election).toBe(true);
		expect(out.elections[1].parent_slug).toBe('2021-bvv');
	});

	it('liefert leeres Array bei keiner Wahl', async () => {
		const tool = createListElectionsTool({ fetchElections: async () => [] });
		const out = (await tool.handler({})) as unknown as { elections: unknown[] };
		expect(out.elections).toEqual([]);
	});
});
