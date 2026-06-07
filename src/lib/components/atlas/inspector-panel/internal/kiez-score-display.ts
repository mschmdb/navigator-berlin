import type { SeverityLevel } from './value-severity-mapping.js';
import type { KiezScoreDimension } from '$lib/data';

export interface KiezScoreScale {
	label: 'gering' | 'mittel' | 'hoch' | 'sehr hoch';
	severity: SeverityLevel;
}

export const DIMENSION_LABELS_DE: Record<KiezScoreDimension, string> = {
	'ruhe-luft': 'Ruhe & Luft',
	'gruen-hitze': 'Grün & Hitze',
	mobilitaet: 'Mobilität',
	versorgung: 'Versorgung',
	wohnschutz: 'Wohnschutz',
	kultur: 'Kultur'
};

export function scaleFor(value: number | null, _dimension: KiezScoreDimension): KiezScoreScale | null {
	if (value === null || !Number.isFinite(value)) return null;
	const clamped = Math.max(0, Math.min(100, value));
	const label =
		clamped <= 25 ? 'gering' : clamped <= 50 ? 'mittel' : clamped <= 75 ? 'hoch' : 'sehr hoch';
	const severity: SeverityLevel =
		clamped <= 25 ? 'warning' : clamped <= 50 ? 'neutral' : clamped <= 75 ? 'success-soft' : 'success';
	return { label, severity };
}

export function scaleForOverall(value: number | null | undefined): KiezScoreScale | null {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;
	const clamped = Math.max(0, Math.min(100, value));
	const label =
		clamped <= 25 ? 'gering' : clamped <= 50 ? 'mittel' : clamped <= 75 ? 'hoch' : 'sehr hoch';
	const severity: SeverityLevel =
		clamped <= 25 ? 'warning' : clamped <= 50 ? 'neutral' : clamped <= 75 ? 'success-soft' : 'success';
	return { label, severity };
}
