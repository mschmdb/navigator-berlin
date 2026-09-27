/**
 * Textbereinigung (spec-textbereinigung-layer-texte.md, G-47): `/layer/[slug]`
 * zeigte `methodology.aggregationLevel` als rohen Enum-Wert (z.B. `point-osm`)
 * an -- kein Text, sondern ein interner Code-Bezeichner im sichtbaren UI.
 * `aggregationLevel` selbst bleibt unverändert (Boundary Spec C2), diese
 * Label-Map übersetzt den Wert nur für die Anzeige, analog zu `bundleLabel`/
 * `BUNDLE_LABEL_MESSAGE` in `internal/layer-palette-filter.ts`.
 *
 * Wortlaut Matze-Entscheidung 27.09.: "Einzelstandort"/"individual site" und
 * "Baublock"/"city block" für die beiden neuen Begriffe, die übrigen Ebenen
 * aus dem bestehenden LOR-Glossar (`layer_explain_lor_*_short`).
 */
import { m } from '$lib/paraglide/messages.js';
import { toMessageOptions, type LocaleOptions } from '$lib/i18n/message-options.js';
import type { AggregationLevel } from './layer-methodology.js';

type MessageFn = (
	params?: undefined,
	options?: { locale: import('$lib/paraglide/runtime').Locale }
) => string;

const AGGREGATION_LEVEL_LABEL_MESSAGE: Record<AggregationLevel, MessageFn> = {
	address: m.layer_page_aggregation_level_address,
	'lor-planungsraum': m.layer_page_aggregation_level_lor_planungsraum,
	'lor-bezirksregion': m.layer_page_aggregation_level_lor_bezirksregion,
	'lor-prognoseraum': m.layer_page_aggregation_level_lor_prognoseraum,
	bezirk: m.layer_page_aggregation_level_bezirk,
	block: m.layer_page_aggregation_level_block,
	'point-osm': m.layer_page_aggregation_level_point_osm
};

/**
 * `level` kommt aus den Methodology-Daten, ist zur Laufzeit aber ein simpler
 * `string` (z.B. wenn ein künftiger Spec-Eintrag versehentlich einen neuen
 * Wert einführt, ohne die Label-Map zu ergänzen) -- `Object.hasOwn` prüft die
 * Existenz vor dem Zugriff (Muster wie `getLayerDisplayName`).
 */
export function isKnownAggregationLevel(level: string): level is AggregationLevel {
	return Object.hasOwn(AGGREGATION_LEVEL_LABEL_MESSAGE, level);
}

/**
 * Locale-fähiges Label für `aggregationLevel`. Ohne `opts.locale`: DE
 * (Boundary, wie `bundleLabel`/`getLayerDisplayName`). Unbekannte Werte
 * kommen roh zurück statt eines stillen Fallback-Texts -- das UI markiert
 * diesen Fall zusätzlich mit `lang="de"` (I/O-Matrix: "unbekannter Enum:
 * Rohwert mit lang=de").
 */
export function aggregationLevelLabel(level: string, opts?: LocaleOptions): string {
	if (!isKnownAggregationLevel(level)) return level;
	return AGGREGATION_LEVEL_LABEL_MESSAGE[level](undefined, toMessageOptions(opts));
}
