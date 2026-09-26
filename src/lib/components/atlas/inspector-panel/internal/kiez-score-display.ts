import type { SeverityLevel } from './value-severity-mapping.js';
import type { KiezScoreDimension } from '$lib/data';
import { m } from '$lib/paraglide/messages.js';
import {
	assertUnreachable,
	toAtlasMessageOptions,
	type LocaleOptions
} from '../../internal/atlas-label-options.js';

/** Stufen-ID der Kiez-Score-Skala (i18n Block B3a: "Skalen-Union -> IDs",
 * ersetzt die vormals direkt als Label genutzte Union `'gering' | 'mittel' |
 * 'hoch' | 'sehr hoch'`). `sehr-hoch` bewusst mit Bindestrich (gültiger
 * Discriminant/Message-Key-Suffix, das alte Label hatte ein Leerzeichen). */
export type KiezScoreScaleId = 'gering' | 'mittel' | 'hoch' | 'sehr-hoch';

export interface KiezScoreScale {
	readonly id: KiezScoreScaleId;
	/** Locale-abhängiges Anzeige-Label zu `id` (DE ohne `opts.locale`, Boundary). */
	readonly label: string;
	readonly severity: SeverityLevel;
}

export const DIMENSION_LABELS_DE: Record<KiezScoreDimension, string> = {
	'ruhe-luft': 'Ruhe & Luft',
	'gruen-hitze': 'Grün & Hitze',
	mobilitaet: 'Mobilität',
	versorgung: 'Versorgung',
	wohnschutz: 'Wohnschutz',
	kultur: 'Kultur',
	// Story 14.1: neutrale Bezeichnung, kein "sicher/gefährlich" (Stigma-Schutz, ADR-019).
	kriminalitaet: 'Erfasste Kriminalität'
};

/** Locale-fähiges Dimension-Label. Ohne `opts.locale`: DE (Boundary Spec
 * i18n B3a). `DIMENSION_LABELS_DE` bleibt für DE-only-Direktimporter
 * (Compare-Panel, LLM-Export, Inspector-Panel vor B3b/B3c) unverändert. */
export function dimensionLabel(dimension: KiezScoreDimension, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	switch (dimension) {
		case 'ruhe-luft':
			return m.atlas_dimension_label_ruhe_luft(undefined, options);
		case 'gruen-hitze':
			return m.atlas_dimension_label_gruen_hitze(undefined, options);
		case 'mobilitaet':
			return m.atlas_dimension_label_mobilitaet(undefined, options);
		case 'versorgung':
			return m.atlas_dimension_label_versorgung(undefined, options);
		case 'wohnschutz':
			return m.atlas_dimension_label_wohnschutz(undefined, options);
		case 'kultur':
			return m.atlas_dimension_label_kultur(undefined, options);
		case 'kriminalitaet':
			return m.atlas_dimension_label_kriminalitaet(undefined, options);
		default:
			return assertUnreachable(dimension);
	}
}

/** Locale-fähiges Skalen-Label zu einer `KiezScoreScaleId`. Ohne
 * `opts.locale`: DE (Boundary). */
export function kiezScoreScaleLabel(id: KiezScoreScaleId, opts?: LocaleOptions): string {
	const options = toAtlasMessageOptions(opts);
	switch (id) {
		case 'gering':
			return m.atlas_scale_label_gering(undefined, options);
		case 'mittel':
			return m.atlas_scale_label_mittel(undefined, options);
		case 'hoch':
			return m.atlas_scale_label_hoch(undefined, options);
		case 'sehr-hoch':
			return m.atlas_scale_label_sehr_hoch(undefined, options);
		default:
			return assertUnreachable(id);
	}
}

/** Exportiert (Review-Fund): `value-formatters.ts`s `kiezScoreStufeLabel`
 * kopierte dieselben Schwellenwerte ein drittes Mal -- eine Quelle statt
 * dreier synchron zu haltender Kopien. */
export function scaleIdFor(clamped: number): KiezScoreScaleId {
	return clamped <= 25 ? 'gering' : clamped <= 50 ? 'mittel' : clamped <= 75 ? 'hoch' : 'sehr-hoch';
}

export function scaleFor(
	value: number | null,
	dimension: KiezScoreDimension,
	opts?: LocaleOptions
): KiezScoreScale | null {
	if (value === null || !Number.isFinite(value)) return null;
	const clamped = Math.max(0, Math.min(100, value));
	const id = scaleIdFor(clamped);
	const label = kiezScoreScaleLabel(id, opts);
	// Story 14.4: Kriminalität ist Magnitude (kein Gut-Maß) → immer neutrale Severity, kein
	// grün/orange „besser/schlechter"-Signal (Stigma-Schutz, ADR-019).
	if (dimension === 'kriminalitaet') {
		return { id, label, severity: 'neutral' };
	}
	const severity: SeverityLevel =
		clamped <= 25
			? 'warning'
			: clamped <= 50
				? 'neutral'
				: clamped <= 75
					? 'success-soft'
					: 'success';
	return { id, label, severity };
}

export function scaleForOverall(
	value: number | null | undefined,
	opts?: LocaleOptions
): KiezScoreScale | null {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;
	const clamped = Math.max(0, Math.min(100, value));
	const id = scaleIdFor(clamped);
	const label = kiezScoreScaleLabel(id, opts);
	const severity: SeverityLevel =
		clamped <= 25
			? 'warning'
			: clamped <= 50
				? 'neutral'
				: clamped <= 75
					? 'success-soft'
					: 'success';
	return { id, label, severity };
}
