import { m } from '$lib/paraglide/messages.js';
import type { GreyKey, GreyNames } from '$lib/stories/wahl-quadrate/grau';
import type { PartyKey } from '$lib/stories/wahl-quadrate/parteien';
import type { Locale } from '$lib/paraglide/runtime';

type Message = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;

const NAMES: Record<PartyKey | 'fw' | 'tier', Message> = {
	afd: m.bq_party_afd,
	bsw: m.bq_party_bsw,
	cdu: m.bq_party_cdu,
	fdp: m.bq_party_fdp,
	gruene: m.bq_party_gruene,
	linke: m.bq_party_linke,
	piraten: m.bq_party_piraten,
	spd: m.bq_party_spd,
	rest: m.bq_party_rest,
	fw: m.bq_party_fw,
	tier: m.bq_party_tier
};

/**
 * Anzeigename einer Partei, ohne `lang` in der aktuellen Sprache. `rest` heißt „Grau“.
 * Plakat und Bilder entstehen auf dem Server für beide Sprachen und geben `lang` mit.
 */
export function partyName(key: PartyKey | GreyKey, lang?: Locale): string {
	return NAMES[key]({}, lang ? { locale: lang } : undefined);
}

/** Namen für `formatGreyLine`. */
export function greyNames(lang?: Locale): GreyNames {
	const keys: GreyKey[] = [
		'afd',
		'bsw',
		'cdu',
		'fdp',
		'gruene',
		'linke',
		'piraten',
		'spd',
		'fw',
		'tier'
	];
	return Object.fromEntries(keys.map((k) => [k, partyName(k, lang)])) as GreyNames;
}
