import { m } from '$lib/paraglide/messages.js';
import { formatDecimal } from '$lib/i18n/format.js';
import type { WeightedMeanAggregate } from '$lib/data/layer-aggregates-types.js';
import { toAtlasMessageOptions, type LocaleOptions } from '../../internal/atlas-label-options.js';

/** Kontext-Zeile für gewichtete Mittel (Bestandsmiete): "11,00 €/m²" oder "keine Angabe". */
export function formatWeightedMeanContext(
	agg: WeightedMeanAggregate,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	if (agg.mean === null) return m.atlas_value_keine_angabe(undefined, options);
	const mean = formatDecimal(agg.mean, {
		...options,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	return m.inspector_context_bestandsmiete({ mean }, options);
}
