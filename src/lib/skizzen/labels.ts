import { m } from '$lib/paraglide/messages.js';
import { dimensionLabel } from '$lib/components/atlas/inspector-panel/internal/kiez-score-display.js';
import { SCORE_DIMENSION_KEYS } from '$lib/data/comparison-types.js';
import { msgOpts, numberFormat, numberLocale, type LocaleOpts } from './locale';
import type { Dim, Figure } from './types';

/** Dimensionsnamen kommen aus der einen Quelle der Seite, in der gewählten Sprache. */
export function dimLabel(dim: Dim, opts?: LocaleOpts): string {
	if (dim === 'composite') return m.skizze_composite({}, msgOpts(opts));
	const key = SCORE_DIMENSION_KEYS.find((k) => k.field === dim)?.key;
	return key ? dimensionLabel(key, msgOpts(opts)) : dim;
}

export interface FigureSpec {
	readonly label: string;
	readonly unit: string;
	readonly digits: number;
	readonly layer: string;
	/** Kurz, was die Zahl misst. */
	readonly what: string;
}

export const FIGURE_SPECS: Readonly<Record<Figure, FigureSpec>> = {
	bestandsmiete: {
		label: 'Bestandsmiete',
		unit: '€/m²',
		digits: 2,
		layer: 'zensus-bestandsmiete-2022',
		what: 'Nettokaltmiete in laufenden Mietverträgen, Zensus 2022'
	},
	altbau: {
		label: 'Altbau',
		unit: '%',
		digits: 0,
		layer: 'zensus-altbau-anteil-2022',
		what: 'Anteil der Wohnungen in Häusern, die vor 1949 gebaut wurden, Zensus 2022'
	},
	gruen: {
		label: 'Grünanlagen',
		unit: '%',
		digits: 1,
		layer: 'gruenanlagen',
		what: 'Anteil öffentlicher Parks und Grünanlagen an der Fläche'
	},
	hitze: {
		label: 'Gefühlte Hitze',
		unit: '°C',
		digits: 1,
		layer: 'klima-pet-2022',
		what: 'So warm fühlt es sich an einem heißen Sommertag um 14 Uhr an, mittlerer Wert im Gebiet'
	},
	milieuschutz: {
		label: 'Milieuschutz',
		unit: '%',
		digits: 0,
		layer: 'milieuschutz-erhaltungsmiete',
		what: 'Anteil der Fläche in Milieuschutzgebieten, wo Umbau und Umwandlung in Eigentum genehmigt werden müssen'
	}
};

export function formatFigure(figure: Figure, value: number | null, opts?: LocaleOpts): string {
	if (value === null) return m.skizze_no_data({}, msgOpts(opts));
	const spec = FIGURE_SPECS[figure];
	return `${numberFormat(spec.digits, opts).format(value)} ${spec.unit}`;
}

export function formatScore(value: number | null, opts?: LocaleOpts): string {
	return value === null ? m.skizze_no_data({}, msgOpts(opts)) : numberFormat(0, opts).format(value);
}

export function formatInt(value: number, opts?: LocaleOpts): string {
	return numberFormat(0, opts).format(value);
}

export function formatPercent(share01: number, opts?: LocaleOpts): string {
	return `${numberFormat(0, opts).format(share01 * 100)} %`;
}

/** Ganze Prozent aus einem Wert in 0 bis 100: „12 %“ (de), „12%“ (en). */
export function fmtPct(value: number, opts?: LocaleOpts): string {
	return msgOpts(opts).locale === 'en' ? `${Math.round(value)}%` : `${Math.round(value)} %`;
}

/** Fläche in km² mit einer Nachkommastelle. */
export function formatKm2(value: number, opts?: LocaleOpts): string {
	return new Intl.NumberFormat(numberLocale(opts), { maximumFractionDigits: 1 }).format(value);
}
