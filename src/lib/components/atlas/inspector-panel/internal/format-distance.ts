import { formatDecimal } from '$lib/i18n/format.js';
import type { LocaleOptions } from '../../internal/atlas-label-options.js';

/**
 * Distanz in Nutzer-Sprache: unter 1 km in Metern, darüber in Kilometern.
 * Geteilt von kuehle-orte-card und in-deiner-nähe, damit die beiden Flächen
 * nicht auseinanderdriften. Locale-fähig (i18n Block B3a), ohne
 * `opts.locale`: DE (Boundary). Der früher hart auf ein deutsches
 * Dezimalkomma verdrahtete `.replace('.', ',')` läuft jetzt über
 * `$lib/i18n/format.ts` ("Komma-Hacks auf format.ts").
 */
export function formatDistance(distanceM: number, opts?: LocaleOptions): string {
	if (distanceM < 1000) return `${distanceM} m`;
	const locale = opts?.locale ?? 'de';
	return `${formatDecimal(distanceM / 1000, { locale, maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`;
}

/** @deprecated Review-Fund: der Name suggerierte "immer DE" -- die Funktion
 * ist seit i18n Block B3a locale-fähig. Nutze `formatDistance`. Bleibt als
 * Alias, bis alle Aufrufer umgestellt sind. */
export const formatDistanceDe = formatDistance;
