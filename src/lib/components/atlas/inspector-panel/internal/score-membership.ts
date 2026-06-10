import type { KiezScoreDimension } from '$lib/data';
import { DIMENSION_LABELS_DE } from './kiez-score-display.js';

/**
 * Story 14.11: Welcher Inspector-Layer fließt in welche Kiez-Score-Dimension ein.
 *
 * Quelle der Wahrheit ist `scripts/lib/kiez-score/dimension-config.ts` (Build-Side). Diese Map ist
 * die SECTION-sichtbare Teilmenge (echte Layer mit Inspector-Card), übersetzt die virtuellen
 * Config-Slugs auf die realen Card-Slugs:
 * - `schulen-grundschule`/`-weiterfuehrend` → Card `schulen-2024`
 * - `radverkehr-presence` → `radverkehrsnetz-2025` + `fahrradstrassen-2024`
 * - `wohnschutz-presence` → `milieuschutz-*`
 * - `kitas-pro-kind` → Card `kitas-2024`
 * ÖPNV-Stops (`oepnv-*`) erscheinen als NearestStopsCard (Mobilität), nicht als reguläre Card.
 *
 * NICHT enthalten (bewusst Kontext, ADR-015): laerm-2023 (durch laerm-db abgelöst),
 * umweltgerechtigkeit-2023, mss-gesamtindex-2025, wohnlagen-2024, bodenrichtwerte, sportanlagen-2024,
 * schwimmbaeder, krankenhaeuser-weitere, Boundaries, Demografie, Wahldaten.
 */
export const LAYER_SCORE_DIMENSION: Readonly<Record<string, KiezScoreDimension>> = {
	// Ruhe & Luft
	'luft-2023': 'ruhe-luft',
	// Grün & Hitze
	'gruenversorgung-2023': 'gruen-hitze',
	'bioklima-2023': 'gruen-hitze',
	'klima-pet-2022': 'gruen-hitze',
	gruenanlagen: 'gruen-hitze',
	// Versorgung
	'kitas-2024': 'versorgung',
	'schulen-2024': 'versorgung',
	'krankenhaeuser-plan': 'versorgung',
	spielplaetze: 'versorgung',
	'nahversorgung-lebensmittel': 'versorgung',
	'nahversorgung-apotheke': 'versorgung',
	'nahversorgung-post': 'versorgung',
	// Wohnschutz
	'milieuschutz-erhaltungsmiete': 'wohnschutz',
	'milieuschutz-staedtebau': 'wohnschutz',
	// Mobilität
	'radverkehrsnetz-2025': 'mobilitaet',
	'fahrradstrassen-2024': 'mobilitaet'
};

/** Dimension, in die der Layer einfließt, oder null (= reiner Kontext, nicht im Score). */
export function scoreDimensionFor(slug: string): KiezScoreDimension | null {
	return LAYER_SCORE_DIMENSION[slug] ?? null;
}

/** Lesbares Dimensions-Label für ein Score-Input-Layer, oder null. */
export function scoreDimensionLabelFor(slug: string): string | null {
	const dim = scoreDimensionFor(slug);
	return dim ? DIMENSION_LABELS_DE[dim] : null;
}

/**
 * Story 14.11 (V5): Layer, deren aktuelle Variante anders in den Score einfließt, bekommen einen
 * klärenden Hinweis (gegen die „doppelt"-Verwirrung). `laerm-2023` (3-Stufen) ist im Score durch
 * das dB-Mittel (`laerm-db`) abgelöst.
 */
export const LAYER_CONTEXT_NOTE: Readonly<Record<string, string>> = {
	'laerm-2023':
		'Diese 3-Stufen-Karte ist Kontext. In den Score fließt der genauere Lärm-dB-Mittelwert (Ruhe & Luft) ein.'
};

export function contextNoteFor(slug: string): string | null {
	return LAYER_CONTEXT_NOTE[slug] ?? null;
}
