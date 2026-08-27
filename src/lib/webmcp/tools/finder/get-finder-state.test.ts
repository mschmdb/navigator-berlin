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
		// Zustand im Link, inkl. Partei: der Empfänger sieht dieselbe Karte.
		expect(decodeURIComponent(out.map_url as string)).toContain('fw=0,0,0,0,0,2,0,0,1');
		expect(decodeURIComponent(out.map_url as string)).toContain('fp=GRÜNE');
		expect((out.top_matches as Array<Record<string, unknown>>)[0]?.kiez).toBe('Regierungsviertel');
	});

	it('dokumentiert map_url und party im Output-Schema', () => {
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
		const props = (tool.outputSchema as { properties: Record<string, { description?: string }> })
			.properties;
		expect(props.map_url).toBeDefined();
		expect(props.map_url?.description).toMatch(/shareable|reproduc/i);
		expect(props.party).toBeDefined();
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
