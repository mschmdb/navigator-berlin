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
	| 'kiez-score-explainer'
	| 'kriminalitaet-aggregat'
	| 'wahl-stimmenanteile'
	| 'cross-layer-template'
	| 'brw-not-aggregatable'
	| 'level-below-threshold';

export type EditorialCustomComponent = 'MauerSektorenDetail';

export interface EditorialConfig {
	slug: string;
	disclaimerVariants: DisclaimerVariant[];
	primarySourceUrl?: string;
	customComponent?: EditorialCustomComponent;
	feedbackMailto: boolean;
	neverMachineTranslate?: boolean;
}
