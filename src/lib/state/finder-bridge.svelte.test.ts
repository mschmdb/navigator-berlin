import { describe, expect, it, beforeEach } from 'vitest';
import {
	publishUserFinderState,
	requestAgentWeights,
	consumePendingAgentWeights,
	setFinderPanelActive,
	readFinderBridge,
	resetFinderBridgeForTests
} from './finder-bridge.svelte.js';
import { neutralWeights } from '$lib/components/atlas/internal/kiez-finder-engine.js';

beforeEach(() => resetFinderBridgeForTests());

describe('finder-bridge', () => {
	it('startet neutral: keine Quelle, keine Treffer, Panel inaktiv', () => {
		const s = readFinderBridge();
		expect(s.weights).toEqual(neutralWeights());
		expect(s.lastChangedBy).toBeNull();
		expect(s.topMatches).toEqual([]);
		expect(s.panelActive).toBe(false);
	});

	it('publishUserFinderState setzt Gewichte, Top-Liste und Quelle user', () => {
		publishUserFinderState({ ...neutralWeights(), kultur: 2 }, [
			{ plrId: '01100102', name: 'Regierungsviertel', fit: 87 }
		]);
		const s = readFinderBridge();
		expect(s.weights.kultur).toBe(2);
		expect(s.lastChangedBy).toBe('user');
		expect(s.topMatches[0]?.name).toBe('Regierungsviertel');
		expect(s.changedAt).not.toBeNull();
	});

	it('requestAgentWeights merged partiell auf den letzten Stand und markiert agent', () => {
		publishUserFinderState({ ...neutralWeights(), ruheLuft: 1 }, []);
		const merged = requestAgentWeights({ kultur: 2 });
		expect(merged.ruheLuft).toBe(1);
		expect(merged.kultur).toBe(2);
		expect(readFinderBridge().lastChangedBy).toBe('agent');
	});

	it('Panel konsumiert pending Agent-Gewichte genau einmal', () => {
		requestAgentWeights({ sbahn: 2 });
		const erste = consumePendingAgentWeights();
		expect(erste?.weights.sbahn).toBe(2);
		expect(consumePendingAgentWeights()).toBeNull();
	});

	it('trägt eine Agent-Partei durch bis zum Snapshot', () => {
		requestAgentWeights({ partei: 2 }, 'GRÜNE');
		const pending = consumePendingAgentWeights();
		expect(pending?.party).toBe('GRÜNE');
		publishUserFinderState(pending!.weights, [], { vomNutzer: false, party: 'GRÜNE' });
		expect(readFinderBridge().party).toBe('GRÜNE');
	});

	it('publishUserFinderState nach Agent-Apply überschreibt die Quelle nicht ohne Nutzer-Flag', () => {
		requestAgentWeights({ kultur: 2 });
		const pending = consumePendingAgentWeights();
		publishUserFinderState(pending!.weights, [], { vomNutzer: false });
		expect(readFinderBridge().lastChangedBy).toBe('agent');
	});

	it('setFinderPanelActive spiegelt den Panel-Zustand', () => {
		setFinderPanelActive(true);
		expect(readFinderBridge().panelActive).toBe(true);
		setFinderPanelActive(false);
		expect(readFinderBridge().panelActive).toBe(false);
	});
});
