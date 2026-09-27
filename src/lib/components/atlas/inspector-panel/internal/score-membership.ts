import type { KiezScoreDimension } from '$lib/data';
import { m } from '$lib/paraglide/messages.js';
import { toAtlasMessageOptions, type LocaleOptions } from '../../internal/atlas-label-options.js';
import { dimensionLabel } from './kiez-score-display.js';

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

/** Lesbares Dimensions-Label für ein Score-Input-Layer, oder null. Locale-
 * fähig über `dimensionLabel` (i18n Block B3b); ohne `opts.locale`: DE
 * (Boundary, Atlas-Fundament). */
export function scoreDimensionLabelFor(slug: string, opts?: LocaleOptions): string | null {
	const dim = scoreDimensionFor(slug);
	return dim ? dimensionLabel(dim, opts) : null;
}

/**
 * Story 14.11 (V5): Layer, deren aktuelle Variante anders in den Score einfließt, bekommen einen
 * klärenden Hinweis (gegen die „doppelt"-Verwirrung). `laerm-2023` (3-Stufen) ist im Score durch
 * das dB-Mittel (`laerm-db`) abgelöst.
 *
 * i18n Block B3b: `contextNoteFor` ist jetzt locale-fähig (`opts`, Default
 * DE). Der vormals exportierte DE-Text-Konstante `LAYER_CONTEXT_NOTE` (Record
 * Slug→String) hatte keine externen Importer und wich der Message-basierten
 * `LAYER_CONTEXT_NOTE_SLUGS` (reiner Slug-Set-Check, Text kommt aus `m.*`).
 */
const LAYER_CONTEXT_NOTE_SLUGS = new Set(['laerm-2023']);

export function contextNoteFor(slug: string, opts?: LocaleOptions): string | null {
	if (!LAYER_CONTEXT_NOTE_SLUGS.has(slug)) return null;
	const options = toAtlasMessageOptions(opts);
	return m.inspector_score_membership_laerm_note(undefined, options);
}
