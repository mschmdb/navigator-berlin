/** Werte einer Einheit (Bezirk oder Kiez) aus `static/data/stories-kennzahlen.json`. `null` heißt: keine Daten. */
export interface Kennzahlen {
	readonly slug: string;
	readonly gruen: number | null;
	readonly altbauAnteil: number | null;
	readonly laermDb: number | null;
	readonly bewohnerProKm2: number | null;
	readonly haltestelle400mAnteil: number | null;
	readonly clubs: number | null;
}

export interface KennzahlenQuelle {
	readonly name: string;
	readonly stand?: string;
	readonly url?: string;
	readonly file?: string;
}

export interface BezirkItem {
	readonly slug: string;
	readonly name: string;
	readonly kennzahlen: Kennzahlen;
}

export interface Marks {
	readonly circleR: number | null;
	readonly squareSize: number | null;
	readonly triangleSize: number | null;
	readonly barLength: number | null;
	readonly lineCount: number;
	readonly donutR: number;
}

export interface Geometrie {
	readonly lines: readonly number[];
	readonly circle: { readonly cx: number; readonly cy: number; readonly r: number } | null;
	readonly square: { readonly x: number; readonly y: number; readonly size: number } | null;
	readonly triangle: { readonly x: number; readonly y: number; readonly size: number } | null;
	readonly bar: {
		readonly x: number;
		readonly y: number;
		readonly w: number;
		readonly h: number;
		readonly rot: number;
	} | null;
	readonly donut: { readonly cx: number; readonly cy: number; readonly r: number } | null;
}

export const VIEW = 200;
export const BAR_HEIGHT = 9;
