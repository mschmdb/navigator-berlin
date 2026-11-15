export type WahlArt = 'btw' | 'agh' | 'bvv';
export type WahlEbene = 'kiez' | 'bezirk' | 'berlin';

export const WAHL_ARTEN: readonly { id: WahlArt; label: string; stimmtyp: string }[] = [
	{ id: 'btw', label: 'Bundestag', stimmtyp: 'Zweitstimme' },
	{ id: 'agh', label: 'Abgeordnetenhaus', stimmtyp: 'Zweitstimme' },
	{ id: 'bvv', label: 'Bezirksverordnete', stimmtyp: 'Stimme' }
];

export interface WahlPunkt {
	readonly jahr: number;
	readonly partei: string;
	readonly farbe: string;
	/** Anteil in Prozent (0-100). */
	readonly anteil: number;
}

export type WahlBundle = Readonly<Record<WahlArt, readonly WahlPunkt[]>>;
