/**
 * Zustand von Handbuch und Gesamtansicht „Alle Bezirke, alle Wahlen“ in der URL (#189).
 *
 * Parameternamen folgen der Vorlage `runde-20-ux/src/wall.js` (read/write), damit
 * Links aus der Skizzenphase weiter funktionieren. Kapitel 5 bekommt eigene
 * Parameter (`bezirk`, `wahl5`), weil `wahl` dort nur AGH oder BTW kennt.
 *
 * Die Typen stehen bewusst lokal hier: `types.ts` im selben Ordner gehört dem
 * Datenbasis-Thread (#187). Nach dessen Merge können Parteischlüssel und
 * Wahltyp von dort kommen.
 */
import { HOME_BEZIRKE } from '$lib/content/home-bezirke';

export type WahlTyp = 'agh' | 'btw';
export type GesamtWahl = WahlTyp | 'both';
export type GesamtSort = 'nr' | 'alpha' | 'party' | 'turnout';
export type Reihenfolge = 'fixed' | 'size';
export type ParteiKey = 'afd' | 'bsw' | 'cdu' | 'fdp' | 'gruene' | 'linke' | 'piraten' | 'spd';
export type Kapitel = 1 | 2 | 3 | 4 | 5 | 6;

export interface GesamtState {
	readonly wahl: GesamtWahl;
	/** Eingeblendete Wahlen als Schlüssel `a2011`, `b2013`; `null` heißt alle. */
	readonly jahre: readonly string[] | null;
	/** Eingeblendete Bezirke als Nummer `01` bis `12`; `null` heißt alle. */
	readonly bezirke: readonly string[] | null;
	readonly sort: GesamtSort;
	/** Schwelle für das Grau in Prozent, ganzzahlig 0 bis 10. */
	readonly schwelle: number;
	readonly hervorheben: ParteiKey | null;
	readonly papier: boolean;
	readonly zahlen: boolean;
	readonly nurGrau: boolean;
	readonly reihenfolge: Reihenfolge;
}

export interface ZeitState {
	readonly bezirk: string;
	readonly wahl: WahlTyp;
}

export interface QuadrateUrlState {
	readonly gesamt: GesamtState;
	readonly zeit: ZeitState;
	readonly kapitel: Kapitel | null;
}

const PARTEIEN: readonly ParteiKey[] = [
	'afd',
	'bsw',
	'cdu',
	'fdp',
	'gruene',
	'linke',
	'piraten',
	'spd'
];
const GESAMT_WAHLEN: readonly GesamtWahl[] = ['agh', 'btw', 'both'];
const WAHL_TYPEN: readonly WahlTyp[] = ['agh', 'btw'];
const SORTS: readonly GesamtSort[] = ['nr', 'alpha', 'party', 'turnout'];
const JAHRE: Readonly<Record<WahlTyp, readonly number[]>> = {
	agh: [2011, 2016, 2021, 2023, 2026],
	btw: [2013, 2017, 2021, 2025]
};
const JAHR_KEYS: readonly string[] = [
	...JAHRE.agh.map((y) => `a${y}`),
	...JAHRE.btw.map((y) => `b${y}`)
];
const BEZIRK_NRN: readonly string[] = Array.from({ length: HOME_BEZIRKE.length }, (_, i) =>
	String(i + 1).padStart(2, '0')
);
const BEZIRK_SLUGS: readonly string[] = HOME_BEZIRKE.map((b) => b.slug);
const SCHWELLE_MAX = 10;

/** Alle Parameter, die dieses Modul besitzt. Fremde Parameter bleiben unberührt. */
const OWN_KEYS = [
	'wahl',
	'y',
	'bz',
	'sort',
	'thr',
	'hl',
	'paper',
	'nums',
	'ng',
	'ord',
	'bezirk',
	'wahl5'
] as const;

export const DEFAULT_URL_STATE: QuadrateUrlState = {
	gesamt: {
		wahl: 'agh',
		jahre: null,
		bezirke: null,
		sort: 'alpha',
		schwelle: 5,
		hervorheben: null,
		papier: false,
		zahlen: true,
		nurGrau: false,
		reihenfolge: 'fixed'
	},
	zeit: { bezirk: 'friedrichshain-kreuzberg', wahl: 'agh' },
	kapitel: null
};

function oneOf<T extends string>(allowed: readonly T[], value: string | null, fallback: T): T {
	return allowed.find((a) => a === value) ?? fallback;
}

/** Liest eine Komma-Liste, behält nur erlaubte Werte in kanonischer Reihenfolge. */
function subset(allowed: readonly string[], value: string | null): readonly string[] | null {
	if (value === null) return null;
	const picked = new Set(value.split(','));
	const kept = allowed.filter((a) => picked.has(a));
	if (kept.length === 0 || kept.length === allowed.length) return null;
	return kept;
}

function parseSchwelle(value: string | null): number {
	if (value === null || value.trim() === '') return DEFAULT_URL_STATE.gesamt.schwelle;
	const n = Number(value);
	if (!Number.isFinite(n)) return DEFAULT_URL_STATE.gesamt.schwelle;
	return Math.max(0, Math.min(SCHWELLE_MAX, Math.round(n)));
}

function parseKapitel(hash: string): Kapitel | null {
	const m = /^#s([1-6])$/.exec(hash);
	return m ? (Number(m[1]) as Kapitel) : null;
}

/** Sortierung nach Partei ergibt ohne hervorgehobene Partei keinen Sinn. */
function normalizeGesamt(w: GesamtState): GesamtState {
	return w.sort === 'party' && w.hervorheben === null ? { ...w, sort: 'nr' } : w;
}

export function parseUrlState(url: URL): QuadrateUrlState {
	const q = url.searchParams;
	const d = DEFAULT_URL_STATE;
	const gesamt = normalizeGesamt({
		wahl: oneOf(GESAMT_WAHLEN, q.get('wahl'), d.gesamt.wahl),
		jahre: subset(JAHR_KEYS, q.get('y')),
		bezirke: subset(BEZIRK_NRN, q.get('bz')),
		sort: oneOf(SORTS, q.get('sort'), d.gesamt.sort),
		schwelle: parseSchwelle(q.get('thr')),
		hervorheben: PARTEIEN.find((p) => p === q.get('hl')) ?? null,
		papier: q.get('paper') === '1',
		zahlen: q.get('nums') !== '0',
		nurGrau: q.get('ng') === '1',
		reihenfolge: q.get('ord') === 'size' ? 'size' : 'fixed'
	});
	return {
		gesamt,
		zeit: {
			bezirk: oneOf(BEZIRK_SLUGS, q.get('bezirk'), d.zeit.bezirk),
			wahl: oneOf(WAHL_TYPEN, q.get('wahl5'), d.zeit.wahl)
		},
		kapitel: parseKapitel(url.hash)
	};
}

/**
 * Schreibt nur Werte, die vom Default abweichen. `base` liefert fremde Parameter
 * (etwa `utm_source`), die erhalten bleiben.
 */
export function serializeUrlState(
	state: QuadrateUrlState,
	base: URLSearchParams = new URLSearchParams()
): { search: string; hash: string } {
	const q = new URLSearchParams(base);
	for (const k of OWN_KEYS) q.delete(k);
	const d = DEFAULT_URL_STATE;
	const w = normalizeGesamt(state.gesamt);

	if (w.wahl !== d.gesamt.wahl) q.set('wahl', w.wahl);
	if (w.jahre) q.set('y', w.jahre.join(','));
	if (w.bezirke) q.set('bz', w.bezirke.join(','));
	if (w.sort !== d.gesamt.sort) q.set('sort', w.sort);
	if (w.schwelle !== d.gesamt.schwelle) q.set('thr', String(w.schwelle));
	if (w.hervorheben) q.set('hl', w.hervorheben);
	if (w.papier) q.set('paper', '1');
	if (!w.zahlen) q.set('nums', '0');
	if (w.nurGrau) q.set('ng', '1');
	if (w.reihenfolge !== d.gesamt.reihenfolge) q.set('ord', w.reihenfolge);
	if (state.zeit.bezirk !== d.zeit.bezirk) q.set('bezirk', state.zeit.bezirk);
	if (state.zeit.wahl !== d.zeit.wahl) q.set('wahl5', state.zeit.wahl);

	const s = q.toString();
	return { search: s ? `?${s}` : '', hash: state.kapitel ? `#s${state.kapitel}` : '' };
}

/** Relativer Deep-Link wie `?hl=piraten#s6`. Leer für den Default-Zustand. */
export function urlStateHref(state: QuadrateUrlState): string {
	const { search, hash } = serializeUrlState(state);
	return search + hash;
}
