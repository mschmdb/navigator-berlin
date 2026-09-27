import { m } from '$lib/paraglide/messages.js';
import {
	toAtlasMessageOptions,
	type LocaleOptions
} from '../components/atlas/internal/atlas-label-options.js';

/**
 * Anti-Stigma-konforme Rang-Beschriftung (Story 11.4, ADR-015).
 *
 * Für starke bis mittlere Werte den exakten Rang („Platz 12 von 143"), für das
 * schwächste Viertel (Quartil 4) bewusst nur „unteres Viertel" statt „Platz 143
 * von 143". `null` → Gedankenstrich.
 *
 * i18n Block B4a: `opts` mit DE-Default (Boundary: geteilte Helfer ohne
 * `opts.locale` bleiben DE, Server-FAQ-Renderer ruft weiterhin ohne `opts`
 * auf). Der Gedankenstrich bleibt ein locale-neutrales Symbol.
 */
export function formatRank(
	rang: number | null,
	quartil: number | null,
	total: number,
	opts?: LocaleOptions
): string {
	const options = toAtlasMessageOptions(opts);
	if (rang === null || total <= 0) return '–';
	if (quartil === 4) return m.rank_format_bottom_quartile(undefined, options);
	return m.rank_format_placed({ rang, total }, options);
}
