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

	// Cross-Kontext-Sync (Gate 2, 26.08.): der ChatGPT-Agent arbeitet auf
	// einer EIGENEN Seiten-Instanz. BroadcastChannel trägt Agent-Updates in
	// den sichtbaren Tab und den Panel-Zustand zurück.
	it('eingehendes agent-update setzt pending, Gewichte und Quelle agent', async () => {
		const fremd = new BroadcastChannel('navigator-finder-bridge');
		fremd.postMessage({
			typ: 'agent-update',
			weights: { ...neutralWeights(), kultur: 2 },
			party: 'GRÜNE'
		});
		await new Promise((r) => setTimeout(r, 30));
		const pending = consumePendingAgentWeights();
		expect(pending?.weights.kultur).toBe(2);
		expect(pending?.party).toBe('GRÜNE');
		expect(readFinderBridge().lastChangedBy).toBe('agent');
		fremd.close();
	});

	it('requestAgentWeights sendet agent-update an fremde Kontexte', async () => {
		const fremd = new BroadcastChannel('navigator-finder-bridge');
		const empfangen: unknown[] = [];
		fremd.onmessage = (e) => empfangen.push(e.data);
		requestAgentWeights({ sbahn: 2 });
		await new Promise((r) => setTimeout(r, 30));
		expect(empfangen.length).toBe(1);
		expect((empfangen[0] as { typ: string }).typ).toBe('agent-update');
		fremd.close();
	});

	it('publishUserFinderState sendet state mit Top-Liste, Empfänger übernimmt sie', async () => {
		const fremd = new BroadcastChannel('navigator-finder-bridge');
		const empfangen: Array<{ typ: string }> = [];
		fremd.onmessage = (e) => empfangen.push(e.data);
		publishUserFinderState(
			{ ...neutralWeights(), ruheLuft: 1 },
			[{ plrId: '01100102', name: 'Regierungsviertel', fit: 87 }],
			{ vomNutzer: true, party: 'SPD' }
		);
		await new Promise((r) => setTimeout(r, 30));
		expect(empfangen[0]?.typ).toBe('state');
		fremd.close();
	});

	it('eingehender state aktualisiert Snapshot inkl. remote panelActive', async () => {
		const fremd = new BroadcastChannel('navigator-finder-bridge');
		fremd.postMessage({
			typ: 'state',
			weights: { ...neutralWeights(), gruenHitze: 2 },
			party: 'SPD',
			topMatches: [{ plrId: 'x', name: 'Britzer Garten', fit: 90.5 }],
			lastChangedBy: 'user',
			changedAt: 123,
			panelActive: true
		});
		await new Promise((r) => setTimeout(r, 30));
		const s = readFinderBridge();
		expect(s.weights.gruenHitze).toBe(2);
		expect(s.topMatches[0]?.name).toBe('Britzer Garten');
		expect(s.panelActive).toBe(true);
		expect(s.lastChangedBy).toBe('user');
		fremd.close();
	});

	it('setFinderPanelActive spiegelt den Panel-Zustand', () => {
		setFinderPanelActive(true);
		expect(readFinderBridge().panelActive).toBe(true);
		setFinderPanelActive(false);
		expect(readFinderBridge().panelActive).toBe(false);
	});
});
