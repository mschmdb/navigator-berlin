import { dimensionLabel } from '$lib/components/atlas/inspector-panel/internal/kiez-score-display.js';
import { SCORE_DIMENSION_KEYS } from '$lib/data/comparison-types.js';
import type { Dim, Figure } from './types';

/** Skizzen sind DE-only; Dimensionsnamen kommen trotzdem aus der einen Quelle der Seite. */
export function dimLabel(dim: Dim): string {
	if (dim === 'composite') return 'Kiez-Score gesamt';
	const key = SCORE_DIMENSION_KEYS.find((k) => k.field === dim)?.key;
	return key ? dimensionLabel(key) : dim;
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
		what: 'Nettokaltmiete laufender Verträge, Zensus 2022'
	},
	altbau: {
		label: 'Altbau',
		unit: '%',
		digits: 0,
		layer: 'zensus-altbau-anteil-2022',
		what: 'Wohnungen in Gebäuden vor 1949, Zensus 2022'
	},
	gruen: {
		label: 'Grünanlagen',
		unit: '%',
		digits: 1,
		layer: 'gruenanlagen',
		what: 'Anteil öffentlicher Grünanlagen an der Fläche'
	},
	hitze: {
		label: 'Hitze am Nachmittag',
		unit: '°C PET',
		digits: 1,
		layer: 'klima-pet-2022',
		what: 'Gefühlte Temperatur (PET) an einem Sommertag, 14 Uhr, Median'
	},
	milieuschutz: {
		label: 'Milieuschutz',
		unit: '%',
		digits: 0,
		layer: 'milieuschutz-erhaltungsmiete',
		what: 'Fläche in sozialen Erhaltungsgebieten'
	}
};

const nf = (digits: number) =>
	new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatFigure(figure: Figure, value: number | null): string {
	if (value === null) return 'keine Angabe';
	const spec = FIGURE_SPECS[figure];
	return `${nf(spec.digits).format(value)} ${spec.unit}`;
}

export function formatScore(value: number | null): string {
	return value === null ? 'keine Angabe' : nf(0).format(value);
}

export function formatInt(value: number): string {
	return nf(0).format(value);
}

export function formatPercent(share01: number): string {
	return `${nf(0).format(share01 * 100)} %`;
}
