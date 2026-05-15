import type { GeocodeSuggestion } from '$lib/data';

export function extractStreetName(addr: GeocodeSuggestion): string {
	const display = addr.displayName ?? '';
	if (!display) return '';
	const firstPart = display.split(',')[0]?.trim() ?? '';
	return firstPart;
}

export function formatAddressSubline(addr: GeocodeSuggestion): string {
	const parts = [addr.kiez, addr.bezirk, addr.postcode].filter((p): p is string => Boolean(p));
	return parts.join(' · ');
}
