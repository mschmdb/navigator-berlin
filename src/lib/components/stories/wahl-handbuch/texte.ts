import { m } from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime';
import { formatShare, type Lang } from '$lib/stories/wahl-quadrate/grau';
import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien';

/** Sprache der Zahlen und Grau-Zeilen im Handbuch. */
export function lang(): Lang {
	return getLocale() === 'en' ? 'en' : 'de';
}

export function typName(typ: WahlTyp): string {
	return typ === 'btw' ? m.bq_hb_typ_btw() : m.bq_hb_typ_agh();
}

/** „Wahlbeteiligung 61,2 %“ */
export function turnoutLine(turnout: number): string {
	return `${m.bq_turnout()} ${formatShare(turnout, lang())}`;
}

/** Prozentwert, im Deutschen mit geschütztem Leerzeichen vor dem Zeichen. */
export function percent(v: number): string {
	return lang() === 'de' ? `${v}\u00a0%` : `${v}%`;
}
