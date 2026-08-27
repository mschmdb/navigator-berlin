import { describe, expect, it, vi } from 'vitest';
import { createSetFinderWeightsTool } from './set-finder-weights.js';
import { neutralWeights } from '$lib/components/atlas/internal/kiez-finder-engine.js';

function makeDeps(overrides: Record<string, unknown> = {}) {
	return {
		applyFinderWeights: vi.fn(async (partial: Record<string, number>, _party?: string) => ({
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
		expect(deps.applyFinderWeights).toHaveBeenCalledWith({ kultur: 2, sbahn: 1 }, undefined);
	});

	it('liefert angewandte Gewichte englisch zurück, inkl. Top-Treffern', async () => {
		const tool = createSetFinderWeightsTool(makeDeps());
		const out = (await tool.handler({ quiet_air: -1 })) as Record<string, unknown>;
		const weights = out.applied_weights as Record<string, number>;
		expect(weights.quiet_air).toBe(-1);
		expect(weights.voting_similarity).toBe(0);
		expect((out.top_matches as unknown[]).length).toBe(1);
		expect(out.finder_open).toBe(true);
		// Der Link muss den Zustand tragen: ein blanker /explore?finder=1
		// öffnete beim Empfänger neun Regler auf „egal" (Prod-Befund 26.08.).
		expect(decodeURIComponent(out.map_url as string)).toContain('fw=-1,0,0,0,0,0,0,0,0');
	});

	// Ein Feld, das der Handler liefert, das Schema aber verschweigt, ist für
	// den Agenten unsichtbar: er nahm stattdessen die Browser-URL (Prod 26.08.).
	it('dokumentiert map_url im Output-Schema', () => {
		const tool = createSetFinderWeightsTool(makeDeps());
		const props = (tool.outputSchema as { properties: Record<string, { description?: string }> })
			.properties;
		expect(props.map_url).toBeDefined();
		expect(props.map_url?.description).toMatch(/shareable|reproduc/i);
	});

	it('setzt voting_similarity samt Partei um', async () => {
		const deps = makeDeps();
		const tool = createSetFinderWeightsTool(deps);
		await tool.handler({ voting_similarity: 2, party: 'GRÜNE' });
		expect(deps.applyFinderWeights).toHaveBeenCalledWith({ partei: 2 }, 'GRÜNE');
	});

	it('lehnt unbekannte Partei ab', async () => {
		const tool = createSetFinderWeightsTool(makeDeps());
		await expect(tool.handler({ voting_similarity: 1, party: 'Piraten' })).rejects.toThrow();
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
