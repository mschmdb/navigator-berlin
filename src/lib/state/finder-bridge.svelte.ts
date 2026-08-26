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

import { untrack } from 'svelte';
import {
	neutralWeights,
	type FinderWeights
} from '$lib/components/atlas/internal/kiez-finder-engine.js';

export interface FinderTopMatch {
	readonly plrId: string;
	readonly name: string;
	/** Passung 0..100, gerundet. */
	readonly fit: number;
	/** BBox-Zentrum: erspart Agenten address_lookup für Folge-Queries. */
	readonly lng?: number;
	readonly lat?: number;
}

export type FinderChangeSource = 'agent' | 'user';

export interface PendingAgentUpdate {
	readonly weights: FinderWeights;
	/** Partei für weights.partei; null = aktuelle Panel-Auswahl behalten. */
	readonly party: string | null;
}

export interface FinderBridgeSnapshot {
	readonly weights: FinderWeights;
	/** Aktive Partei-Auswahl des Panels (null bis zum ersten Publish). */
	readonly party: string | null;
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
let party = $state<string | null>(null);
let pendingAgentUpdate = $state<PendingAgentUpdate | null>(null);
/** Panel-Sichtbarkeit in ANDEREN Kontexten (Broadcast-empfangen). */
let remotePanelActive = $state(false);
/**
 * Zählt jede veröffentlichte Rechnung. `waitForFinderTopMatches` unterscheidet
 * damit eine frische Rangliste von der noch stehenden alten: nach dem ersten
 * Tool-Aufruf ist die Liste nie wieder leer, "nicht leer" taugt also nicht als
 * Kriterium (Prod-Bug 26.08., Agent meldete die alte Rangliste als neue).
 */
let publishSeq = $state(0);

/**
 * Panel → Bridge: nach jedem Paint den sichtbaren Zustand spiegeln.
 * `vomNutzer: false` (Agent-Apply) aktualisiert Werte und Treffer,
 * lässt die Quelle aber beim Agenten.
 */
export function publishUserFinderState(
	next: FinderWeights,
	top: readonly FinderTopMatch[],
	opts: { vomNutzer?: boolean; party?: string } = {}
): void {
	weights = { ...next };
	topMatches = [...top];
	publishSeq += 1;
	if (opts.party !== undefined) party = opts.party;
	if (opts.vomNutzer !== false) {
		lastChangedBy = 'user';
		changedAt = Date.now();
	}
	sendeState();
}

/** Tool → Bridge: partielle Gewichte (und optional Partei) mergen. */
export function requestAgentWeights(
	partial: Partial<FinderWeights>,
	agentParty?: string
): FinderWeights {
	const merged = { ...weights, ...partial };
	weights = merged;
	if (agentParty !== undefined) party = agentParty;
	pendingAgentUpdate = { weights: merged, party: agentParty ?? null };
	lastChangedBy = 'agent';
	changedAt = Date.now();
	sende({ typ: 'agent-update', weights: merged, party: agentParty ?? null });
	return merged;
}

/** Panel-Effect: wartendes Agent-Update genau einmal abholen. */
export function consumePendingAgentWeights(): PendingAgentUpdate | null {
	const pending = pendingAgentUpdate;
	pendingAgentUpdate = null;
	return pending;
}

/** Reaktiver Lesezugriff fürs Panel-Effect (ohne zu konsumieren). */
export function peekPendingAgentWeights(): PendingAgentUpdate | null {
	return pendingAgentUpdate;
}

export function setFinderPanelActive(active: boolean): void {
	panelActive = active;
	sendeState();
}

export function readFinderBridge(): FinderBridgeSnapshot {
	return {
		weights: { ...weights },
		party,
		lastChangedBy,
		changedAt,
		topMatches: [...topMatches],
		panelActive: panelActive || remotePanelActive
	};
}

/**
 * Cross-Kontext-Sync (26.08., "Gate 2"): Der ChatGPT-Agent arbeitet auf
 * einer eigenen Instanz der Seite. BroadcastChannel trägt Agent-Updates
 * in alle same-origin-Kontexte (der sichtbare Tab wendet sie an, die
 * Karte färbt sich vor den Augen des Menschen) und den Panel-Zustand
 * samt Top-Liste zurück in den Agenten-Kontext. BroadcastChannel stellt
 * eigene Nachrichten nie an den Sender zu, Loops sind ausgeschlossen.
 */
type SyncNachricht =
	| { typ: 'agent-update'; weights: FinderWeights; party: string | null }
	| {
			typ: 'state';
			weights: FinderWeights;
			party: string | null;
			topMatches: readonly FinderTopMatch[];
			lastChangedBy: FinderChangeSource | null;
			changedAt: number | null;
			panelActive: boolean;
	  };

const KANAL_NAME = 'navigator-finder-bridge';
let kanal: BroadcastChannel | null = null;

function sende(nachricht: SyncNachricht): void {
	// $state-Proxies sind nicht structured-cloneable: erst zu Plain-Daten.
	kanal?.postMessage($state.snapshot(nachricht));
}

function empfange(nachricht: SyncNachricht): void {
	if (nachricht.typ === 'agent-update') {
		weights = { ...nachricht.weights };
		if (nachricht.party !== null) party = nachricht.party;
		pendingAgentUpdate = { weights: { ...nachricht.weights }, party: nachricht.party };
		lastChangedBy = 'agent';
		changedAt = Date.now();
		return;
	}
	weights = { ...nachricht.weights };
	party = nachricht.party;
	topMatches = [...nachricht.topMatches];
	// Auch eine Rangliste aus einem fremden Tab ist eine frische Rechnung.
	publishSeq += 1;
	lastChangedBy = nachricht.lastChangedBy;
	changedAt = nachricht.changedAt;
	remotePanelActive = nachricht.panelActive;
}

if (typeof BroadcastChannel !== 'undefined') {
	kanal = new BroadcastChannel(KANAL_NAME);
	kanal.onmessage = (e: MessageEvent<SyncNachricht>) => empfange(e.data);
}

function sendeState(): void {
	// untrack: Broadcasts dürfen aufrufende Effects nicht auf den gesamten
	// Bridge-State abonnieren, sonst loopt das Panel-Sichtbarkeits-Effect
	// mit jedem Paint (effect_update_depth_exceeded).
	untrack(() => {
		sende({
			typ: 'state',
			weights: { ...weights },
			party,
			topMatches: [...topMatches],
			lastChangedBy,
			changedAt,
			panelActive
		});
	});
}

/** Stand des Publish-Zählers, vor einem Schreibwunsch zu merken. */
export function readFinderPublishSeq(): number {
	return publishSeq;
}

/**
 * Wartet auf eine FRISCHE Rangliste (Agent-Flow: das Tool soll echte
 * top_matches zurückgeben, nicht die noch stehende alte Liste und keine
 * leere). `sinceSeq` ist der vor dem Schreibwunsch gemerkte Zählerstand;
 * gewartet wird, bis das Panel danach neu gerechnet hat. Nach Timeout:
 * aktueller Stand.
 */
export async function waitForFinderTopMatches(
	opts: { sinceSeq?: number; timeoutMs?: number; intervallMs?: number } = {}
): Promise<readonly FinderTopMatch[]> {
	const { sinceSeq = -1, timeoutMs = 7000, intervallMs = 150 } = opts;
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (publishSeq > sinceSeq && topMatches.length > 0) return [...topMatches];
		await new Promise((r) => setTimeout(r, intervallMs));
	}
	return [...topMatches];
}

export function resetFinderBridgeForTests(): void {
	weights = neutralWeights();
	party = null;
	lastChangedBy = null;
	changedAt = null;
	topMatches = [];
	panelActive = false;
	remotePanelActive = false;
	pendingAgentUpdate = null;
	publishSeq = 0;
}
