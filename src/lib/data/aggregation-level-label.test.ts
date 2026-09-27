import { describe, expect, it } from 'vitest';
import { aggregationLevelLabel, isKnownAggregationLevel } from './aggregation-level-label.js';
import { AGGREGATION_LEVELS } from './layer-methodology.js';

// Textbereinigung (spec-textbereinigung-layer-texte.md, G-47): `/layer/[slug]`
// zeigte den rohen `aggregationLevel`-Enum-Wert (z.B. `point-osm`) unmoderiert
// im UI. Label-Map uebersetzt jeden bekannten Wert in einen lesbaren Text,
// DE/EN. Matze-Entscheidung 27.09.: "Einzelstandort"/"individual site" und
// "Baublock"/"city block" fuer die beiden neuen Begriffe, die uebrigen Ebenen
// aus dem bestehenden LOR-Glossar (layer_explain_lor_*_short).

const EXPECTED_DE_LABELS: Record<(typeof AGGREGATION_LEVELS)[number], string> = {
	address: 'Adresse',
	'lor-planungsraum': 'LOR-Planungsraum',
	'lor-bezirksregion': 'LOR-Bezirksregion',
	'lor-prognoseraum': 'LOR-Prognoseraum',
	bezirk: 'Bezirk',
	block: 'Baublock',
	'point-osm': 'Einzelstandort'
};

const EXPECTED_EN_LABELS: Record<(typeof AGGREGATION_LEVELS)[number], string> = {
	address: 'Address',
	'lor-planungsraum': 'LOR planning area',
	'lor-bezirksregion': 'LOR Bezirksregion',
	'lor-prognoseraum': 'LOR forecast area (Prognoseraum)',
	bezirk: 'Bezirk',
	block: 'City block',
	'point-osm': 'Individual site'
};

describe('aggregationLevelLabel', () => {
	it.each(AGGREGATION_LEVELS)('liefert für "%s" exakt das erwartete DE-Label', (level) => {
		expect(aggregationLevelLabel(level)).toBe(EXPECTED_DE_LABELS[level]);
	});

	it.each(AGGREGATION_LEVELS)('liefert für "%s" exakt das erwartete EN-Label', (level) => {
		expect(aggregationLevelLabel(level, { locale: 'en' })).toBe(EXPECTED_EN_LABELS[level]);
	});

	it('DE: point-osm wird "Einzelstandort" (Matze-Entscheidung)', () => {
		expect(aggregationLevelLabel('point-osm')).toBe('Einzelstandort');
	});

	it('EN: point-osm wird "Individual site" (Matze-Entscheidung)', () => {
		expect(aggregationLevelLabel('point-osm', { locale: 'en' })).toBe('Individual site');
	});

	it('DE: block wird "Baublock" (Matze-Entscheidung)', () => {
		expect(aggregationLevelLabel('block')).toBe('Baublock');
	});

	it('EN: block wird "City block" (Matze-Entscheidung)', () => {
		expect(aggregationLevelLabel('block', { locale: 'en' })).toBe('City block');
	});

	it('EN: lor-bezirksregion bleibt "LOR Bezirksregion" (Glossar-Begriff, kein Denglisch-Ersatz)', () => {
		expect(aggregationLevelLabel('lor-bezirksregion', { locale: 'en' })).toBe('LOR Bezirksregion');
	});

	it('unbekannter Enum-Wert: Rohwert unveraendert zurueck (kein stiller Fallback-Text)', () => {
		expect(aggregationLevelLabel('unknown-level-xyz')).toBe('unknown-level-xyz');
		expect(aggregationLevelLabel('unknown-level-xyz', { locale: 'en' })).toBe('unknown-level-xyz');
	});

	it('ohne opts.locale: DE (Boundary wie bundleLabel/getLayerDisplayName)', () => {
		expect(aggregationLevelLabel('address')).toBe('Adresse');
	});
});

describe('isKnownAggregationLevel', () => {
	it.each(AGGREGATION_LEVELS)('erkennt "%s" als bekannt', (level) => {
		expect(isKnownAggregationLevel(level)).toBe(true);
	});

	it('erkennt einen unbekannten Wert als nicht bekannt', () => {
		expect(isKnownAggregationLevel('unknown-level-xyz')).toBe(false);
	});
});
