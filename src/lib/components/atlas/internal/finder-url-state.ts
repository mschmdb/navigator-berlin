/**
 * Finder-Zustand in der URL.
 *
 * Ohne diese Kodierung ist ein Finder-Link wertlos: Gewichte lebten nur im
 * Speicher der Seite, ein geteilter Link öffnete neun Regler auf „egal"
 * (Prod-Befund 26.08., der Agent verwies Judges auf eine leere Karte).
 * Mit `fw`/`fp` reproduziert jeder Link die Karte überall und jederzeit.
 *
 * Format kompakt und teilbar: `fw=2,0,0,2,0,0,0,1,0` in Regler-Reihenfolge,
 * `fp=CDU` nur wenn die Partei-Ähnlichkeit aktiv ist.
 */

import {
	neutralWeights,
	FINDER_PARTIES,
	type FinderWeights,
	type FinderParty
} from './kiez-finder-engine.js';

export const FINDER_URL_KEYS = {
	weights: 'fw',
	party: 'fp'
} as const;

/** Reihenfolge der Werte in `fw`, identisch zur Regler-Reihenfolge im Panel. */
const WEIGHT_ORDER = [
	'ruheLuft',
	'gruenHitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz',
	'kultur',
	'dichte',
	'sbahn',
	'partei'
] as const satisfies readonly (keyof FinderWeights)[];

/** Nähe-Kriterien kennen kein „möglichst wenig", daher eigene Untergrenze. */
const UNIPOLAR_KEYS: ReadonlySet<keyof FinderWeights> = new Set(['sbahn', 'partei']);

function istGueltig(key: keyof FinderWeights, wert: number): boolean {
	if (!Number.isInteger(wert)) return false;
	const min = UNIPOLAR_KEYS.has(key) ? 0 : -2;
	return wert >= min && wert <= 2;
}

export interface FinderUrlState {
	readonly weights: FinderWeights;
	readonly party: FinderParty | null;
}

/**
 * Gewichte in URL-Parameter. Ein neutraler Finder liefert ein leeres Objekt,
 * damit unbenutzte Regler keine Parameter in jede geteilte URL schreiben.
 */
export function encodeFinderUrlState(
	weights: FinderWeights,
	party: string | null
): Record<string, string> {
	if (WEIGHT_ORDER.every((k) => weights[k] === 0)) return {};
	const out: Record<string, string> = {
		[FINDER_URL_KEYS.weights]: WEIGHT_ORDER.map((k) => weights[k]).join(',')
	};
	if (weights.partei !== 0 && party !== null && (FINDER_PARTIES as readonly string[]).includes(party)) {
		out[FINDER_URL_KEYS.party] = party;
	}
	return out;
}

/**
 * URL-Parameter zurück in Gewichte. Kaputte oder manipulierte Werte werden
 * verworfen (null), nie geraten: ein fremder Link darf die Seite nicht in
 * einen halb gesetzten Zustand bringen.
 */
export function parseFinderUrlState(params: URLSearchParams): FinderUrlState | null {
	const roh = params.get(FINDER_URL_KEYS.weights);
	if (roh === null) return null;

	const teile = roh.split(',');
	if (teile.length !== WEIGHT_ORDER.length) return null;

	const weights: { -readonly [K in keyof FinderWeights]: number } = { ...neutralWeights() };
	for (const [i, key] of WEIGHT_ORDER.entries()) {
		const wert = Number(teile[i]);
		if (teile[i]?.trim() === '' || !istGueltig(key, wert)) return null;
		weights[key] = wert;
	}

	const parteiRoh = params.get(FINDER_URL_KEYS.party);
	const party =
		parteiRoh !== null && (FINDER_PARTIES as readonly string[]).includes(parteiRoh)
			? (parteiRoh as FinderParty)
			: null;

	// Wahl-Ähnlichkeit ohne gültige Partei ist mehrdeutig: das Panel fiele auf
	// seine Vorauswahl zurück und unterstellte dem Absender eine Partei, die er
	// nie genannt hat. Die Dimension fällt weg, die übrigen Regler bleiben.
	if (weights.partei !== 0 && party === null) weights.partei = 0;

	return { weights, party };
}
