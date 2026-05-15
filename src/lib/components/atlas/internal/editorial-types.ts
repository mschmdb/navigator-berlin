import type { Feature, Point } from 'geojson';

export type DisclaimerVariant =
	| 'legal'
	| 'historic'
	| 'seasonal'
	| 'source'
	| 'compare-stolperstein'
	| 'compare-mietspiegel'
	| 'compare-bodenrichtwerte'
	| 'compare-stigma-footer'
	| 'mss-aggregat'
	| 'compare-mss-aggregat'
	| 'kiez-score-explainer';

export type EditorialCustomComponent = 'StolpersteinDetail' | 'MauerSektorenDetail';

export interface EditorialConfig {
	slug: string;
	disclaimerVariants: DisclaimerVariant[];
	primarySourceUrl?: string;
	customComponent?: EditorialCustomComponent;
	feedbackMailto: boolean;
	neverMachineTranslate?: boolean;
}

export interface StolpersteinProperties {
	person?: string;
	'person:firstname'?: string;
	'person:lastname'?: string;
	inscription?: string;
	'addr:street'?: string;
	'addr:housenumber'?: string;
	'wikipedia:de'?: string;
	'wikipedia:en'?: string;
	wikipedia?: string;
	[key: string]: unknown;
}

export type StolpersteinFeature = Feature<Point, StolpersteinProperties>;
