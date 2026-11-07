import { getLocale } from '$lib/paraglide/runtime';
import type { Lang } from '$lib/stories/wahl-quadrate/grau';

/** Sprache der Quadrate: Englisch auf `/en`, sonst Deutsch. */
export function aktuelleSprache(): Lang {
	return getLocale() === 'en' ? 'en' : 'de';
}

/** Ganze Prozent wie „5 %“ (geschütztes Leerzeichen) oder „5%“. */
export function ganzeProzent(n: number, lang: Lang = aktuelleSprache()): string {
	return lang === 'de' ? `${n}\u00a0%` : `${n}%`;
}
