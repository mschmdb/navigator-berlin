/**
 * Story 3 (Portal-Skeleton /berlin-wahlen): URL-State-Parser/Serializer für
 * `?reihe=&jahr=&ebene=`. Pure Funktionen, kein Svelte-Import, testbar ohne
 * Component-Mount.
 *
 * Defaults (I/O-Matrix Kaltstart): jüngste AGH-Reihe, Ebene stimmbezirk
 * (Story 5: amtliche Einheiten als Standard-Ansicht, Tagesspiegel-Referenz).
 * `jahr` hat keinen fixen Default hier, weil das jüngste Jahr von der
 * geladenen Wahl-Liste abhängt (siehe `wahl-portal-context.svelte.ts`).
 * `jahr: null` heißt „kein expliziter User-Override", die Context-Schicht
 * löst daraus das jüngste Jahr der aktuellen Reihe auf.
 *
 * Ungültige Werte fallen still auf Defaults zurück (kein Fehler, kein 404).
 */

export type WahlPortalReihe = 'btw' | 'agh' | 'bvv';
export type WahlPortalEbene = 'stimmbezirk' | 'kiez' | 'bezirk';

export const DEFAULT_REIHE: WahlPortalReihe = 'agh';
export const DEFAULT_EBENE: WahlPortalEbene = 'stimmbezirk';

export const REIHE_VALUES: readonly WahlPortalReihe[] = ['btw', 'agh', 'bvv'];
// Nur Ebenen mit API-Gegenstück (/api/wahl/series|winners); 'berlin' hat
// keine Gebietskarte und kommt erst mit einem konkreten Kapitel-Bedarf.
export const EBENE_VALUES: readonly WahlPortalEbene[] = ['stimmbezirk', 'kiez', 'bezirk'];

export interface WahlPortalUrlState {
	readonly reihe: WahlPortalReihe;
	/** `null` = kein expliziter User-Override, Context löst Default-Jahr auf. */
	readonly jahr: number | null;
	readonly ebene: WahlPortalEbene;
}

const JAHR_MIN = 2000;
const JAHR_MAX = 2100;
const JAHR_PATTERN = /^\d{4}$/;

function parseReihe(value: string | null): WahlPortalReihe {
	if (value && (REIHE_VALUES as readonly string[]).includes(value)) {
		return value as WahlPortalReihe;
	}
	return DEFAULT_REIHE;
}

function parseEbene(value: string | null): WahlPortalEbene {
	if (value && (EBENE_VALUES as readonly string[]).includes(value)) {
		return value as WahlPortalEbene;
	}
	return DEFAULT_EBENE;
}

function parseJahr(value: string | null): number | null {
	if (!value || !JAHR_PATTERN.test(value)) return null;
	const n = Number(value);
	if (!Number.isFinite(n) || n < JAHR_MIN || n > JAHR_MAX) return null;
	return n;
}

export function parsePortalState(params: URLSearchParams): WahlPortalUrlState {
	return {
		reihe: parseReihe(params.get('reihe')),
		jahr: parseJahr(params.get('jahr')),
		ebene: parseEbene(params.get('ebene'))
	};
}

/**
 * Serialisiert nur Abweichungen vom Default (Kaltstart AC: kein Query-Müll).
 * `jahr` wird immer geschrieben wenn gesetzt, da es keinen statischen
 * Default gibt (hängt von der geladenen Wahl-Liste ab).
 */
export function serializePortalState(state: WahlPortalUrlState): URLSearchParams {
	const params = new URLSearchParams();
	if (state.reihe !== DEFAULT_REIHE) params.set('reihe', state.reihe);
	if (state.jahr !== null) params.set('jahr', String(state.jahr));
	if (state.ebene !== DEFAULT_EBENE) params.set('ebene', state.ebene);
	return params;
}

export type WahlPortalStimmtyp = 'einstimme' | 'zweitstimme';

/**
 * Leitet den API-Stimmtyp aus der Wahl-Reihe ab (Story 4 AC).
 * BVV kennt nur eine Stimme; BTW/AGH werten für die Winner-Map die
 * Zweitstimme (Parteien-Ergebnis, nicht Wahlkreis-Erststimme).
 */
export function stimmtypForReihe(reihe: WahlPortalReihe): WahlPortalStimmtyp {
	return reihe === 'bvv' ? 'einstimme' : 'zweitstimme';
}
