import { describe, expect, it } from 'vitest';
import { createGetFinderStateTool } from './get-finder-state.js';
import { neutralWeights } from '$lib/components/atlas/internal/kiez-finder-engine.js';

describe('get_finder_state', () => {
	it('liefert Zustand englisch: Gewichte, Quelle, ISO-Zeit, Top-Treffer', async () => {
		const tool = createGetFinderStateTool({
			readFinderState: () => ({
				weights: { ...neutralWeights(), kultur: 2, partei: 1 },
				party: 'GRÜNE',
				lastChangedBy: 'user',
				changedAt: 1787725681000,
				topMatches: [{ plrId: '01100102', name: 'Regierungsviertel', fit: 87 }],
				panelActive: true
			})
		});
		const out = (await tool.handler({})) as Record<string, unknown>;
		const weights = out.weights as Record<string, number>;
		expect(weights.culture).toBe(2);
		expect(weights.voting_similarity).toBe(1);
		expect(out.last_changed_by).toBe('user');
		expect(out.party).toBe('GRÜNE');
		expect(out.changed_at).toBe(new Date(1787725681000).toISOString());
		expect(out.finder_open).toBe(true);
		expect(out.map_url).toMatch(/\/explore\?finder=1$/);
		expect((out.top_matches as Array<Record<string, unknown>>)[0]?.kiez).toBe('Regierungsviertel');
	});

	it('unberührter Finder: Quelle und Zeit null, leere Treffer', async () => {
		const tool = createGetFinderStateTool({
			readFinderState: () => ({
				weights: neutralWeights(),
				party: null,
				lastChangedBy: null,
				changedAt: null,
				topMatches: [],
				panelActive: false
			})
		});
		const out = (await tool.handler({})) as Record<string, unknown>;
		expect(out.last_changed_by).toBeNull();
		expect(out.changed_at).toBeNull();
		expect(out.finder_open).toBe(false);
	});
});
