/**
 * Logik der Gesamtansicht „Alle Bezirke, alle Wahlen“ (#191), nach
 * `runde-20-ux/src/wall.js`: ein- und ausblenden, sortieren, Rastermaße und
 * die Grau-Tabelle unter der Ansicht. Der Zustand ist `GesamtState` aus `url-state.ts`.
 */
import { HOME_BEZIRKE } from '$lib/content/home-bezirke';
import { toElectionShares } from './eingabe';
import { derive, type SmallParty } from './grau';
import { JAHRE, WAHL_TYPEN, wahlSlug, type NamedParty, type WahlTyp } from './parteien';
import type { BezirkWahlen, StoriesWahlData } from './types';
import type { GesamtState, GesamtWahl } from './url-state';

/** Parteien im Grau erscheinen in der Tabelle ab diesem berlinweiten Anteil mit Namen. */
export const MIN_DARIN = 0.01;

const PREFIX: Record<WahlTyp, string> = { agh: 'a', btw: 'b' };

export function wahlTypen(wahl: GesamtWahl): WahlTyp[] {
	return wahl === 'both' ? [...WAHL_TYPEN] : [wahl];
}

/** Schlüssel einer Wahl in `GesamtState.jahre`, z. B. `a2011`. */
export function jahrKey(typ: WahlTyp, jahr: number): string {
	return PREFIX[typ] + jahr;
}

const ALLE_JAHR_KEYS: readonly string[] = WAHL_TYPEN.flatMap((t) =>
	JAHRE[t].map((y) => jahrKey(t, y))
);

export function jahrAn(s: GesamtState, typ: WahlTyp, jahr: number): boolean {
	return s.jahre === null || s.jahre.includes(jahrKey(typ, jahr));
}

export function sichtbareJahre(s: GesamtState, typ: WahlTyp): number[] {
	return JAHRE[typ].filter((y) => jahrAn(s, typ, y));
}

export function bezirkAn(s: GesamtState, nr: string): boolean {
	return s.bezirke === null || s.bezirke.includes(nr);
}

export function hatAusgeblendet(s: GesamtState): boolean {
	return s.jahre !== null || s.bezirke !== null;
}

/** Schaltet einen Wert in einer Teilmenge um. Alle an ergibt `null`, keiner ein leeres Array. */
function toggleIn(
	current: readonly string[] | null,
	key: string,
	all: readonly string[]
): readonly string[] | null {
	const set = new Set(current ?? all);
	if (set.has(key)) set.delete(key);
	else set.add(key);
	const kept = all.filter((k) => set.has(k));
	return kept.length === all.length ? null : kept;
}

export function toggleJahr(s: GesamtState, typ: WahlTyp, jahr: number): GesamtState {
	return { ...s, jahre: toggleIn(s.jahre, jahrKey(typ, jahr), ALLE_JAHR_KEYS) };
}

export function toggleBezirk(s: GesamtState, nr: string, alle: readonly string[]): GesamtState {
	return { ...s, bezirke: toggleIn(s.bezirke, nr, alle) };
}

export function alleEinblenden(s: GesamtState): GesamtState {
	return { ...s, jahre: null, bezirke: null };
}

/** Zweiter Klick auf dieselbe Partei hebt auf. Ohne Partei fällt `party` auf `nr` zurück. */
export function toggleHervorheben(s: GesamtState, party: NamedParty): GesamtState {
	const hervorheben = s.hervorheben === party ? null : party;
	const sort = hervorheben === null && s.sort === 'party' ? 'nr' : s.sort;
	return { ...s, hervorheben, sort };
}

/** Bezugswahl für Sortierung nach Wert: die letzte sichtbare Wahl der ersten Wahlart mit Jahren. */
function bezugsSlug(s: GesamtState) {
	for (const typ of wahlTypen(s.wahl)) {
		const jahr = sichtbareJahre(s, typ).at(-1);
		if (jahr !== undefined) return wahlSlug(typ, jahr);
	}
	return null;
}

export function sortiereBezirke(
	bezirke: readonly BezirkWahlen[],
	s: GesamtState
): BezirkWahlen[] {
	const out = [...bezirke];
	const byNr = (a: BezirkWahlen, b: BezirkWahlen): number => a.nr.localeCompare(b.nr);
	if (s.sort === 'alpha') return out.sort((a, b) => a.name.localeCompare(b.name, 'de'));
	if (s.sort === 'nr') return out.sort(byNr);
	const slug = bezugsSlug(s);
	const wert = (b: BezirkWahlen): number => {
		const z = slug ? b.wahlen[slug] : undefined;
		if (!z) return 0;
		if (s.sort === 'turnout') return z.wahlbeteiligung;
		return s.hervorheben ? (toElectionShares(z).raw[s.hervorheben] ?? 0) : 0;
	};
	return out.sort((a, b) => wert(b) - wert(a) || byNr(a, b));
}

export interface WandMasse {
	/** Kantenlänge eines Quadrats in px. */
	quadrat: number;
	/** Spaltenabstand in px. */
	abstand: number;
	/** Breite der Spalte einer ausgeblendeten Wahl in px. */
	aus: number;
	/** Das Raster ist breiter als der Platz und scrollt seitwärts (nur Desktop). */
	scrollt: boolean;
}

const MASSE = {
	breit: { name: 180, abstand: 52, aus: 48, rand: 52, min: 100, max: 200 },
	schmal: { name: 0, abstand: 8, aus: 36, rand: 0, min: 40, max: Infinity }
} as const;

/**
 * Rastermaße aus der verfügbaren Breite. Breit: Name links, rechts Platz für
 * Außenbeschriftung, Quadrate höchstens 200 px. Schmal: Name über der Reihe, kein Rand.
 */
export function wandMasse(breite: number, schmal: boolean, s: GesamtState): WandMasse {
	const m = schmal ? MASSE.schmal : MASSE.breit;
	let quadrat: number = m.max;
	const spalten = wahlTypen(s.wahl).map((typ) => {
		const n = JAHRE[typ].length;
		const an = sichtbareJahre(s, typ).length;
		return { n, an, aus: n - an };
	});
	for (const sp of spalten) {
		if (sp.an === 0) continue;
		const frei = breite - m.rand - m.name - (sp.n - 1) * m.abstand - sp.aus * m.aus;
		quadrat = Math.min(quadrat, frei / sp.an);
	}
	quadrat = Math.max(m.min, Math.floor(Number.isFinite(quadrat) ? quadrat : m.min));
	const noetig = Math.max(
		0,
		...spalten.map(
			(sp) => m.name + sp.an * quadrat + sp.aus * m.aus + (sp.n - 1) * m.abstand + m.rand
		)
	);
	return { quadrat, abstand: m.abstand, aus: m.aus, scrollt: noetig > breite + 1 };
}

export interface GrauZeile {
	jahr: number;
	/** Grauanteil berlinweit, 0 bis 1. */
	grau: number;
	/** Parteien im Grau ab `MIN_DARIN`, absteigend. */
	darin: SmallParty[];
}

/** Grau in ganz Berlin je sichtbarer Wahl einer Wahlart, mit derselben Schwelle wie die Quadrate. */
export function grauTabelle(data: StoriesWahlData, typ: WahlTyp, s: GesamtState): GrauZeile[] {
	return sichtbareJahre(s, typ).flatMap((jahr) => {
		const slug = wahlSlug(typ, jahr);
		const z = slug ? data.berlin[slug] : undefined;
		if (!z) return [];
		const d = derive(toElectionShares(z), s.schwelle / 100);
		return [{ jahr, grau: d.disp.rest, darin: d.small.filter((p) => p.share >= MIN_DARIN) }];
	});
}

/** Kleinster und größter Grauanteil berlinweit in ganzen Prozent, für den Hinweis bei ausgeblendetem Grau. */
export function grauSpanne(data: StoriesWahlData, s: GesamtState): { lo: number; hi: number } | null {
	const werte = wahlTypen(s.wahl).flatMap((typ) =>
		grauTabelle(data, typ, s).map((r) => Math.round(r.grau * 100))
	);
	if (werte.length === 0) return null;
	return { lo: Math.min(...werte), hi: Math.max(...werte) };
}

export function statusZahlen(s: GesamtState): { bezirke: number; wahlen: number } {
	const bezirke = s.bezirke === null ? HOME_BEZIRKE.length : s.bezirke.length;
	const wahlen = wahlTypen(s.wahl).reduce((n, typ) => n + sichtbareJahre(s, typ).length, 0);
	return { bezirke, wahlen };
}
