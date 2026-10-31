/**
 * Startseiten-Vorschauen (#170): einzige Quelle für Zustand (Pfad), Bilddatei
 * und Maße. `scripts/home-screenshots.ts` nimmt die Bilder auf, die
 * Startseiten-Komponenten verlinken denselben Pfad.
 */

/** Sprachen mit eigenen Vorschaubildern; Bild zeigt die App in dieser Sprache. */
export const HOME_PREVIEW_LOCALES = ['de', 'en'] as const;
export type HomePreviewLocale = (typeof HOME_PREVIEW_LOCALES)[number];

export type HomePreviewName = 'kiez-score' | 'finder' | 'hitze' | 'wahlen';

export interface HomePreview {
	readonly name: HomePreviewName;
	/** App-Pfad ohne Locale-Präfix; Zustand, den das Bild zeigt. */
	readonly path: string;
	readonly width: number;
	readonly height: number;
}

export const HOME_PREVIEWS: Readonly<Record<HomePreviewName, HomePreview>> = {
	hitze: {
		name: 'hitze',
		path: '/explore?layers=klima-pet-2022&address=13.4243,52.4869&q=Hermannplatz',
		width: 1600,
		height: 878
	},
	'kiez-score': {
		name: 'kiez-score',
		path: '/explore?layers=kiez-score-ruhe-luft,kiez-score-wohnschutz&address=13.3735,52.5186&q=Regierungsviertel',
		width: 1600,
		height: 878
	},
	finder: {
		name: 'finder',
		path: '/explore?finder=1&fw=2,2,0,0,0,0,0,0,0',
		width: 1600,
		height: 878
	},
	wahlen: {
		name: 'wahlen',
		path: '/berlin-wahlen?jahr=2026',
		width: 1132,
		height: 1036
	}
};

/** Öffentliche URL der Bilddatei für eine Sprache. */
export function homePreviewSrc(preview: HomePreview, locale: HomePreviewLocale): string {
	return `/home/${locale}/${preview.name}.webp`;
}
