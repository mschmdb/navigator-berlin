/**
 * Einzige Quelle für Parteischlüssel, Reihenfolge, Wahltypen und Jahre von
 * „Berlin in Quadraten“ (#176). `types.ts` beschreibt nur die Form der Daten
 * und bleibt reiner Typvertrag für die Pipeline. Laufzeit-Konstanten stehen hier.
 */
import type { WahlSlug } from './types';

/** Feste Parteireihenfolge der Quadrate, alphabetisch, Grau zuletzt. */
export const ORDER = [
	'afd',
	'bsw',
	'cdu',
	'fdp',
	'gruene',
	'linke',
	'piraten',
	'spd',
	'rest'
] as const;

export type PartyKey = (typeof ORDER)[number];
export type NamedParty = Exclude<PartyKey, 'rest'>;

export const REST_INDEX = ORDER.length - 1;

export const NAMED_PARTIES: readonly NamedParty[] = ORDER.filter(
	(k): k is NamedParty => k !== 'rest'
);

export const WAHL_TYPEN = ['agh', 'btw'] as const;
export type WahlTyp = (typeof WAHL_TYPEN)[number];

export const JAHRE: Readonly<Record<WahlTyp, readonly number[]>> = {
	agh: [2011, 2016, 2021, 2023, 2026],
	btw: [2013, 2017, 2021, 2025]
};

/** Slug einer Wahl wie `agh11`, `null` wenn es in dem Jahr keine gab. */
export function wahlSlug(typ: WahlTyp, jahr: number): WahlSlug | null {
	if (!JAHRE[typ].includes(jahr)) return null;
	// Test gleicht das Muster mit den Slugs der Datenbasis ab.
	return `${typ}${String(jahr).slice(-2)}` as WahlSlug;
}

/**
 * Wohin ein Pipeline-Kurzname fällt: eigene Farbe, Freie Wähler (Grau, in der
 * Caption benannt) oder Sonstige (Grau, ohne Namen).
 */
export type ParteiZiel = NamedParty | 'fw' | 'sonst';

const KURZNAME_ZIEL = new Map<string, Exclude<ParteiZiel, 'sonst'>>([
	['AfD', 'afd'],
	['BSW', 'bsw'],
	['CDU', 'cdu'],
	['FDP', 'fdp'],
	['GRÜNE', 'gruene'],
	['Die Linke', 'linke'],
	['PIRATEN', 'piraten'],
	['SPD', 'spd'],
	['FREIE WÄHLER', 'fw']
]);

/** Parteien ohne eigenen Schlüssel, etwa Tierschutzpartei, landen in Sonstige. */
export function parteiZiel(kurzname: string): ParteiZiel {
	return KURZNAME_ZIEL.get(kurzname) ?? 'sonst';
}
