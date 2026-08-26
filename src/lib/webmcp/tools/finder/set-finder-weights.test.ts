import { describe, expect, it, vi } from 'vitest';
import { createSetFinderWeightsTool } from './set-finder-weights.js';
import { neutralWeights } from '$lib/components/atlas/internal/kiez-finder-engine.js';

function makeDeps(overrides: Record<string, unknown> = {}) {
	return {
		applyFinderWeights: vi.fn(async (partial) => ({
			weights: { ...neutralWeights(), ...partial },
			finderOpen: true,
			navigation: 'none' as const,
			topMatches: [{ plrId: '01100102', name: 'Regierungsviertel', fit: 87 }]
		})),
		...overrides
	};
}

describe('set_finder_weights', () => {
	it('mappt englische Schema-Keys auf interne Gewichte', async () => {
		const deps = makeDeps();
		const tool = createSetFinderWeightsTool(deps);
		await tool.handler({ culture: 2, sbahn_proximity: 1 });
		expect(deps.applyFinderWeights).toHaveBeenCalledWith({ kultur: 2, sbahn: 1 });
	});

	it('liefert angewandte Gewichte englisch zurück, inkl. Top-Treffern', async () => {
		const tool = createSetFinderWeightsTool(makeDeps());
		const out = (await tool.handler({ quiet_air: -1 })) as Record<string, unknown>;
		const weights = out.applied_weights as Record<string, number>;
		expect(weights.quiet_air).toBe(-1);
		expect(weights.voting_similarity).toBe(0);
		expect((out.top_matches as unknown[]).length).toBe(1);
		expect(out.finder_open).toBe(true);
	});

	it('lehnt leeren Input mit englischer Meldung ab', async () => {
		const tool = createSetFinderWeightsTool(makeDeps());
		await expect(tool.handler({})).rejects.toThrow(/at least one weight/i);
	});

	it('lehnt Werte außerhalb der Range ab', async () => {
		const tool = createSetFinderWeightsTool(makeDeps());
		await expect(tool.handler({ culture: 5 })).rejects.toThrow();
		await expect(tool.handler({ sbahn_proximity: -1 })).rejects.toThrow();
	});
});
