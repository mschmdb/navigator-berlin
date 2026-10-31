export interface StoryColor {
	readonly hex: string;
	readonly meaning: string;
}

export interface StorySeries {
	readonly colors: Readonly<Record<string, StoryColor>>;
	/** Dünn und kräftig. Mehr Stärken gibt es pro Serie nicht. */
	readonly lineWidths: readonly [number, number];
}

export type StorySeriesId = 'punkt-linie-kiez' | 'signete';

export const STORY_PAPER = '#efe6d2';
export const STORY_INK = '#26221e';
export const STORY_FONT = "'Jost', 'IBM Plex Sans', sans-serif";

/** Unter dieser Kantenlänge entfallen Haarlinien und Punkte. */
export const SMALL_MARK_PX = 120;

export const STORY_SERIES: Readonly<Record<StorySeriesId, StorySeries>> = {
	'punkt-linie-kiez': {
		colors: {
			kreis: { hex: '#3a8a55', meaning: 'Grünversorgung' },
			quadrat: { hex: '#cf4128', meaning: 'Altbau' },
			dreieck: { hex: '#efbd2c', meaning: 'Lärm' },
			donut: { hex: '#24579e', meaning: 'Clubs' },
			balken: { hex: STORY_INK, meaning: 'Bewohner' }
		},
		lineWidths: [1, 3]
	},
	signete: {
		colors: {
			patina: { hex: '#4f7152', meaning: 'Grün' },
			gold: { hex: '#b88a2e', meaning: 'Clubs' },
			tinte: { hex: STORY_INK, meaning: 'Hitze, niedrig' },
			ochsenblut: { hex: '#5e2b22', meaning: 'Hitze, mittel' },
			rot: { hex: '#9e2a2b', meaning: 'Hitze, hoch' },
			toenung: { hex: '#d4c39e', meaning: 'Leere Wabe' }
		},
		lineWidths: [1.2, 3]
	}
};
