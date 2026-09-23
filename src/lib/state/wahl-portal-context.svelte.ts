import { getContext, setContext } from 'svelte';
import type { WahlPortalEbene, WahlPortalReihe } from '$lib/utils/wahl-portal-url-state.js';

const KEY = Symbol('wahl-portal-state');

/**
 * Portal-weiter Zustand für /berlin-wahlen (Story 3, ADR-012/MUST-Regel 16).
 *
 * Context-API statt Modul-Scope-`$state`, damit kein State zwischen Requests
 * leakt (SSR). Reihe/Jahr/Ebene gelten seitenweit, alle Kapitel lesen daraus.
 *
 * `jahrOverride: null` heißt „kein expliziter User-Pick" — die Steuerleiste
 * und alle Kapitel zeigen dann das jüngste Jahr der aktuellen Reihe
 * (`currentJahr`). Das hält die URL frei von Default-Query-Müll.
 */
export interface WahlPortalListEntry {
	readonly slug: string;
	readonly jahr: number;
	readonly typ: WahlPortalReihe;
	readonly isRepeatElection: boolean;
	readonly sourceName: string;
	readonly license: string;
	/** Vorläufiges Ergebnis (Matze-Entscheidung 23.09., 1B). */
	readonly vorlaeufig: boolean;
	readonly sourceUpdatedAt: string | null;
}

export type WahlPortalListStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface WahlPortalState {
	reihe: WahlPortalReihe;
	ebene: WahlPortalEbene;
	jahrOverride: number | null;
	wahlen: WahlPortalListEntry[];
	status: WahlPortalListStatus;
}

export function createWahlPortalState(initial: {
	reihe: WahlPortalReihe;
	ebene: WahlPortalEbene;
	jahr: number | null;
}): WahlPortalState {
	const state = $state<WahlPortalState>({
		reihe: initial.reihe,
		ebene: initial.ebene,
		jahrOverride: initial.jahr,
		wahlen: [],
		status: 'idle'
	});
	setContext(KEY, state);
	return state;
}

export function getWahlPortalState(): WahlPortalState {
	const ctx = getContext<WahlPortalState | undefined>(KEY);
	if (!ctx) {
		throw new Error('WahlPortalState fehlt: createWahlPortalState() muss in einem Ancestor laufen');
	}
	return ctx;
}

/**
 * Jahre der übergebenen Reihe, jüngstes zuerst. Dedupliziert über Stimmtypen:
 * /api/wahl/list liefert pro Jahr ZWEI Rows (erst- + zweitstimme), die
 * Jahr-Chips brauchen aber genau einen Eintrag pro Jahr (keyed each).
 */
export function jahreForReihe(
	state: WahlPortalState,
	reihe: WahlPortalReihe
): WahlPortalListEntry[] {
	const out: WahlPortalListEntry[] = [];
	for (const w of state.wahlen) {
		if (w.typ !== reihe) continue;
		if (!out.some((e) => e.jahr === w.jahr)) out.push(w);
	}
	return out.sort((a, b) => b.jahr - a.jahr);
}

/** Aufgelöstes aktuelles Jahr: expliziter Override, sonst jüngstes Jahr der Reihe. */
export function currentJahr(state: WahlPortalState): number | null {
	const years = jahreForReihe(state, state.reihe);
	if (state.jahrOverride !== null && years.some((y) => y.jahr === state.jahrOverride)) {
		return state.jahrOverride;
	}
	return years[0]?.jahr ?? null;
}

/**
 * Reihen-Wechsel (AC: „ungültiges gewähltes Jahr springt auf jüngstes der
 * Reihe"). Setzt jahrOverride zurück, wenn er zur neuen Reihe nicht passt.
 */
export function setReihe(state: WahlPortalState, reihe: WahlPortalReihe): void {
	state.reihe = reihe;
	const years = jahreForReihe(state, reihe);
	if (state.jahrOverride !== null && !years.some((y) => y.jahr === state.jahrOverride)) {
		state.jahrOverride = null;
	}
}

export function setEbene(state: WahlPortalState, ebene: WahlPortalEbene): void {
	state.ebene = ebene;
}

export function setJahr(state: WahlPortalState, jahr: number): void {
	state.jahrOverride = jahr;
}

/**
 * Schreibt geladene Wahl-Liste in den State und bereinigt einen jetzt
 * ungültigen jahrOverride still auf Default (I/O-Matrix Deep-Link-Zeile).
 */
export function applyWahlList(state: WahlPortalState, entries: WahlPortalListEntry[]): void {
	state.wahlen = entries;
	state.status = 'loaded';
	const years = jahreForReihe(state, state.reihe);
	if (state.jahrOverride !== null && !years.some((y) => y.jahr === state.jahrOverride)) {
		state.jahrOverride = null;
	}
}

interface WahlListApiResponse {
	readonly elections: ReadonlyArray<{
		readonly slug: string;
		readonly jahr: number;
		readonly typ: WahlPortalReihe;
		readonly is_repeat_election: boolean;
		readonly source_name: string;
		readonly license: string;
		readonly vorlaeufig: boolean;
		readonly source_updated_at: string | null;
	}>;
}

/** Lädt `/api/wahl/list` client-seitig (kein DB-Zugriff im Prerender). */
export async function loadWahlList(
	state: WahlPortalState,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	state.status = 'loading';
	try {
		const res = await fetchFn('/api/wahl/list');
		if (!res.ok) throw new Error(`status ${res.status}`);
		const data = (await res.json()) as WahlListApiResponse;
		const entries: WahlPortalListEntry[] = data.elections.map((e) => ({
			slug: e.slug,
			jahr: e.jahr,
			typ: e.typ,
			isRepeatElection: e.is_repeat_election,
			sourceName: e.source_name,
			license: e.license,
			vorlaeufig: e.vorlaeufig,
			sourceUpdatedAt: e.source_updated_at
		}));
		applyWahlList(state, entries);
	} catch {
		state.status = 'error';
	}
}

/**
 * Vorläufig-Status für `typ`+`jahr` aus der Portal-Wahl-Liste, unabhängig
 * vom Stimmtyp (beide Stimmtypen einer Quelle teilen denselben Ingest-Lauf
 * und damit dasselbe `vorlaeufig`-Flag). `null` = Liste noch nicht geladen
 * oder kein Treffer -- Aufrufer zeigen dann weder „vorläufig" noch
 * „endgültig" an (Status unbekannt statt geraten).
 */
export function vorlaeufigStatusFor(
	state: WahlPortalState,
	typ: WahlPortalReihe,
	jahr: number | null
): { vorlaeufig: boolean; sourceUpdatedAt: string | null } | null {
	if (state.status !== 'loaded' || jahr === null) return null;
	const entry = state.wahlen.find((w) => w.typ === typ && w.jahr === jahr);
	if (!entry) return null;
	return { vorlaeufig: entry.vorlaeufig, sourceUpdatedAt: entry.sourceUpdatedAt };
}
