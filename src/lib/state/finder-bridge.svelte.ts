/**
 * Finder-Bridge: Modul-Singleton zwischen Kiez-Finder-Panel und den
 * WebMCP-Kollaborations-Tools (set_finder_weights / get_finder_state).
 *
 * Warum kein ui-context: der lebt im Svelte-Context-Baum und ist aus
 * `mount.ts` (WebMCP-Registrierung, außerhalb des Komponenten-Baums)
 * unerreichbar. Die Bridge hält den letzten bekannten Finder-Zustand,
 * puffert Agent-Schreibwünsche bis das Panel sie anwendet und merkt
 * sich, wer zuletzt gedreht hat: Mensch oder Agent.
 */

import {
	neutralWeights,
	type FinderWeights
} from '$lib/components/atlas/internal/kiez-finder-engine.js';

export interface FinderTopMatch {
	readonly plrId: string;
	readonly name: string;
	/** Passung 0..100, gerundet. */
	readonly fit: number;
}

export type FinderChangeSource = 'agent' | 'user';

export interface FinderBridgeSnapshot {
	readonly weights: FinderWeights;
	readonly lastChangedBy: FinderChangeSource | null;
	/** Epoch-ms des letzten Wechsels, null solange unberührt. */
	readonly changedAt: number | null;
	readonly topMatches: readonly FinderTopMatch[];
	/** true, solange das Panel gemountet ist (Finder sichtbar). */
	readonly panelActive: boolean;
}

let weights = $state<FinderWeights>(neutralWeights());
let lastChangedBy = $state<FinderChangeSource | null>(null);
let changedAt = $state<number | null>(null);
let topMatches = $state<readonly FinderTopMatch[]>([]);
let panelActive = $state(false);
let pendingAgentWeights = $state<FinderWeights | null>(null);

/**
 * Panel → Bridge: nach jedem Paint den sichtbaren Zustand spiegeln.
 * `vomNutzer: false` (Agent-Apply) aktualisiert Werte und Treffer,
 * lässt die Quelle aber beim Agenten.
 */
export function publishUserFinderState(
	next: FinderWeights,
	top: readonly FinderTopMatch[],
	opts: { vomNutzer?: boolean } = {}
): void {
	weights = { ...next };
	topMatches = [...top];
	if (opts.vomNutzer !== false) {
		lastChangedBy = 'user';
		changedAt = Date.now();
	}
}

/** Tool → Bridge: partielle Gewichte auf den letzten Stand mergen. */
export function requestAgentWeights(partial: Partial<FinderWeights>): FinderWeights {
	const merged = { ...weights, ...partial };
	weights = merged;
	pendingAgentWeights = merged;
	lastChangedBy = 'agent';
	changedAt = Date.now();
	return merged;
}

/** Panel-Effect: wartende Agent-Gewichte genau einmal abholen. */
export function consumePendingAgentWeights(): FinderWeights | null {
	const pending = pendingAgentWeights;
	pendingAgentWeights = null;
	return pending;
}

/** Reaktiver Lesezugriff fürs Panel-Effect (ohne zu konsumieren). */
export function peekPendingAgentWeights(): FinderWeights | null {
	return pendingAgentWeights;
}

export function setFinderPanelActive(active: boolean): void {
	panelActive = active;
}

export function readFinderBridge(): FinderBridgeSnapshot {
	return {
		weights: { ...weights },
		lastChangedBy,
		changedAt,
		topMatches: [...topMatches],
		panelActive
	};
}

export function resetFinderBridgeForTests(): void {
	weights = neutralWeights();
	lastChangedBy = null;
	changedAt = null;
	topMatches = [];
	panelActive = false;
	pendingAgentWeights = null;
}
