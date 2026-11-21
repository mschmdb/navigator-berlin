import { m } from '#lib/paraglide/messages.js';
import { msgOpts, type LocaleOpts } from './locale';

export type WahlArt = 'btw' | 'agh' | 'bvv';
export type WahlEbene = 'kiez' | 'bezirk' | 'berlin';

export interface WahlArtText {
	readonly id: WahlArt;
	readonly label: string;
	readonly stimmtyp: string;
}

/** Wahlarten mit Namen und Stimmtyp in der gewählten Sprache. */
export function wahlArtTexts(opts?: LocaleOpts): WahlArtText[] {
	const o = msgOpts(opts);
	return [
		{ id: 'btw', label: m.place_wahl_btw({}, o), stimmtyp: m.place_wahl_stimme_zweit({}, o) },
		{ id: 'agh', label: m.place_wahl_agh({}, o), stimmtyp: m.place_wahl_stimme_zweit({}, o) },
		{ id: 'bvv', label: m.place_wahl_bvv({}, o), stimmtyp: m.place_wahl_stimme({}, o) }
	];
}

export interface WahlPunkt {
	readonly jahr: number;
	readonly partei: string;
	readonly farbe: string;
	/** Anteil in Prozent (0-100). */
	readonly anteil: number;
}

export type WahlBundle = Readonly<Record<WahlArt, readonly WahlPunkt[]>>;
