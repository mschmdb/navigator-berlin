import type { EditorialConfig } from './editorial-types.js';

export const EDITORIAL_CONFIG: Record<string, EditorialConfig> = {
	'mietspiegel-wohnlage': {
		slug: 'mietspiegel-wohnlage',
		disclaimerVariants: ['legal'],
		primarySourceUrl: 'https://www.berlin.de/mietspiegel/',
		feedbackMailto: true
	},
	'wohnlagen-2024': {
		slug: 'wohnlagen-2024',
		disclaimerVariants: ['legal'],
		primarySourceUrl: 'https://mietspiegel.berlin.de/',
		feedbackMailto: true
	},
	bodenrichtwerte: {
		slug: 'bodenrichtwerte',
		disclaimerVariants: ['legal'],
		primarySourceUrl: 'https://www.berlin.de/gutachterausschuss/',
		feedbackMailto: true
	},
	trinkbrunnen: {
		slug: 'trinkbrunnen',
		disclaimerVariants: ['seasonal'],
		primarySourceUrl: 'https://www.bwb.de/de/trinkbrunnen.php',
		feedbackMailto: true
	},
	stolpersteine: {
		slug: 'stolpersteine',
		disclaimerVariants: ['source'],
		primarySourceUrl: 'https://www.stolpersteine-berlin.de/',
		customComponent: 'StolpersteinDetail',
		feedbackMailto: true,
		neverMachineTranslate: true
	},
	'mss-gesamtindex-2025': {
		slug: 'mss-gesamtindex-2025',
		disclaimerVariants: ['mss-aggregat'],
		primarySourceUrl:
			'https://daten.berlin.de/datensaetze/monitoring-soziale-stadtentwicklung-mss-2025-wms-39b8b768',
		feedbackMailto: true,
		neverMachineTranslate: true
	},
	'mauer-sektoren': {
		slug: 'mauer-sektoren',
		disclaimerVariants: ['historic'],
		primarySourceUrl: 'https://www.berlin-mauer.de/',
		customComponent: 'MauerSektorenDetail',
		feedbackMailto: true,
		neverMachineTranslate: true
	}
};

export const ALL_LAYERS_GET_FEEDBACK_MAILTO = true;

export function getEditorialConfig(slug: string): EditorialConfig | undefined {
	return EDITORIAL_CONFIG[slug];
}
