import type { GeocodeSuggestion } from '$lib/data';

/**
 * Nominatim liefert displayName mit Komma-getrennten Segmenten. Format
 * variiert: bei reverse-geocoded Adressen steht oft die Hausnummer als
 * erstes Segment (z.B. "34, Arndtstraße, Bergmannkiez, …"), bei direkten
 * Address-Hits ist "Strasse Hausnr" das erste Segment (z.B.
 * "Karl-Marx-Allee 99a, Mitte, …"), bei POIs der POI-Name
 * ("Hochschule für Technik und Wirtschaft, …").
 *
 * Heuristik: wenn erstes Segment rein-numerisch (mit optionalem
 * Buchstaben-Suffix wie „19a"), kombiniere mit zweitem Segment zu
 * „Strasse Hausnr". Sonst nimm erstes Segment.
 */
const HAUSNR_PATTERN = /^\d+[a-z]?$/i;

export function extractPrimaryName(displayName: string | undefined): string {
	if (!displayName) return '';
	const segments = displayName.split(',').map((s) => s.trim());
	const first = segments[0] ?? '';
	if (HAUSNR_PATTERN.test(first) && segments[1]) {
		return `${segments[1]} ${first}`;
	}
	return first;
}

export function extractStreetName(addr: GeocodeSuggestion): string {
	return extractPrimaryName(addr.displayName);
}

export function formatAddressSubline(addr: GeocodeSuggestion): string {
	const parts = [addr.kiez, addr.bezirk, addr.postcode].filter((p): p is string => Boolean(p));
	return parts.join(' · ');
}
