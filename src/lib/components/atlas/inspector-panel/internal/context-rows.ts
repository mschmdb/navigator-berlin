/**
 * GH-88: Umfeld-Zeilen (Kiez, Bezirk, Berlin) für die Inspector-Datensätze, aus
 * `inspector-panel.svelte` herausgelöst. Zahlen laufen über `$lib/i18n/format.ts`,
 * damit Prozent und Dezibel überall gleich aussehen („66,7 %", „42,7 dB").
 */
import { m } from '$lib/paraglide/messages.js';
import { formatPercentValue, formatWithUnit } from '$lib/i18n/format.js';
import type {
	LayerAggregate,
	LayerAggregatesFile,
	NumericMedianAggregate
} from '$lib/data/layer-aggregates-types.js';
import type { Locale } from '$lib/paraglide/runtime';
import { getLayerDisplayName } from '../../internal/layer-palette-filter.js';
import { formatWeightedMeanContext } from './weighted-mean-context.js';
import {
	getValueSeverity,
	hasRatedCategories,
	type SeverityLevel
} from './value-severity-mapping.js';

export type AggregateScope = 'kiez' | 'bezirk' | 'berlin';

export interface ContextRow {
	id: string;
	label: string;
	text: string;
	/** Stufe des dominanten Werts, nur bei Layern mit Stufenskala (Punkt in der Zeile). */
	severity?: SeverityLevel;
}

export interface RegionKeys {
	kiezSlug: string | null;
	bezirkSlug: string | null;
}

interface LocaleOpts {
	locale: Locale;
}

/** Aggregat eines Layers für Kiez, Bezirk oder Berlin, oder `undefined`. */
export function aggregateFor(
	aggregates: LayerAggregatesFile | null,
	slug: string,
	scope: AggregateScope,
	keys: RegionKeys
): LayerAggregate | undefined {
	const entry = aggregates?.aggregates[slug];
	if (!entry) return undefined;
	if (scope === 'berlin') return entry.berlin;
	if (scope === 'kiez') {
		const s = keys.kiezSlug;
		if (!s) return undefined;
		return entry.kiez[s] ?? (keys.bezirkSlug ? entry.kiez[`${s}-${keys.bezirkSlug}`] : undefined);
	}
	return keys.bezirkSlug ? entry.bezirk[keys.bezirkSlug] : undefined;
}

/** Wie `aggregateFor`, aber nur Median-Aggregate (PET-Card). */
export function numericAggregateFor(
	aggregates: LayerAggregatesFile | null,
	slug: string,
	scope: AggregateScope,
	keys: RegionKeys
): NumericMedianAggregate | null {
	const a = aggregateFor(aggregates, slug, scope, keys);
	return a?.type === 'numeric-median' ? a : null;
}

/** Lesbarer Umfeld-Text eines Aggregats, z. B. „meist mittel, 66,7 %". */
export function contextText(slug: string, agg: LayerAggregate, opts: LocaleOpts): string | null {
	if (agg.type === 'ordinal-distribution') {
		if (agg.dominant === null) return null;
		const share = agg.classes.find((c) => c.label === agg.dominant)?.share;
		// `agg.dominant` ist ein roher Kategorie-Wert (Boundary: Rohwerte bleiben unverändert).
		return share != null
			? m.inspector_context_dominant_with_share(
					{ dominant: agg.dominant, share: formatPercentValue(share, opts) },
					opts
				)
			: m.inspector_context_dominant({ dominant: agg.dominant }, opts);
	}
	if (agg.type === 'weighted-mean') return formatWeightedMeanContext(agg, opts, slug);
	if (agg.type === 'coverage-share' || agg.type === 'area-share') {
		return m.inspector_context_area_share({ share: formatPercentValue(agg.share, opts) }, opts);
	}
	return null;
}

/** Stufe einer Umfeld-Zeile aus derselben Bewertung wie das Badge des Datensatzes. */
/**
 * Hält den Anteil zusammen: „…, 34,5 %“ bricht nur zwischen den Wörtern davor um,
 * nie zwischen Komma, Zahl und Prozentzeichen.
 */
export function glueShare(text: string): string {
	return text.replace(/,[ \u00a0](?=\d)/g, ',\u00a0').replace(/(\d)[ \u00a0]%/g, '$1\u00a0%');
}

export function contextSeverity(slug: string, agg: LayerAggregate): SeverityLevel | undefined {
	if (!hasRatedCategories(slug)) return undefined;
	if (agg.type !== 'ordinal-distribution' || agg.dominant === null) return undefined;
	// Rohwert als String: Kategorie- und Wohnlage-Bewertungen lesen Strings direkt.
	return getValueSeverity(slug, agg.dominant);
}

/**
 * Eine Card zeigt EINEN Wert, darum Singular-Label, obwohl der Layer-Name
 * (Karten-Legende) Plural ist.
 */
export function cardLayerName(slug: string, opts: LocaleOpts): string {
	switch (slug) {
		case 'bezirke':
			return m.inspector_card_label_bezirk(undefined, opts);
		case 'ortsteile':
			return m.inspector_card_label_ortsteil(undefined, opts);
		case 'plz':
			return m.inspector_card_label_plz(undefined, opts);
		case 'einschulbereiche-2024':
			return m.inspector_card_label_einschulbereich(undefined, opts);
		default:
			return getLayerDisplayName(slug, opts);
	}
}

export interface ContextRowInput extends RegionKeys {
	aggregates: LayerAggregatesFile | null;
	kiezName: string | null;
	bezirkName: string | null;
	/** Lärm-dB-Kiez-Mittel (L_DEN), nur für `laerm-2023`. */
	laermDb: number | null;
}

/** Umfeld-Zeilen für Kiez, Bezirk und Berlin; bei Lärm zusätzlich das dB-Mittel. */
export function buildContextRows(
	slug: string,
	input: ContextRowInput,
	opts: LocaleOpts
): ContextRow[] {
	const scopes: { id: string; label: string; scope: AggregateScope }[] = [
		{
			id: 'kiez',
			label: input.kiezName ?? m.inspector_context_row_kiez_fallback(undefined, opts),
			scope: 'kiez'
		},
		{
			id: 'bezirk',
			label: input.bezirkName ?? m.inspector_context_row_bezirk_fallback(undefined, opts),
			scope: 'bezirk'
		},
		{ id: 'berlin', label: m.inspector_context_row_berlin(undefined, opts), scope: 'berlin' }
	];
	const rows = scopes.flatMap((s) => {
		const agg = aggregateFor(input.aggregates, slug, s.scope, input);
		const text = agg ? contextText(slug, agg, opts) : null;
		if (!agg || !text) return [];
		const severity = contextSeverity(slug, agg);
		return [
			severity ? { id: s.id, label: s.label, text, severity } : { id: s.id, label: s.label, text }
		];
	});
	if (slug === 'laerm-2023' && input.laermDb !== null) {
		rows.unshift({
			id: 'laerm-db',
			label: m.inspector_context_row_laerm_mittel_label(undefined, opts),
			text: m.inspector_context_row_laerm_mittel_text(
				{ db: formatWithUnit(input.laermDb, 'dB', opts) },
				opts
			)
		});
	}
	return rows;
}
