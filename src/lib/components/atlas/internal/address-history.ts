/**
 * Browser-History im Explorer (#91): Eine Adresswahl legt einen Eintrag an,
 * damit Back zur vorigen Adresse führt. Karten-Bewegung, Layer und Finder
 * ersetzen weiter den aktuellen Eintrag, sonst liefe die History voll.
 */

export type AddressHistoryIntent = 'user' | 'restore';
export type AddressHistoryMode = 'push' | 'replace';

/** Wert des `address`-Parameters, fünf Nachkommastellen wie beim Schreiben. */
export function formatAddressParam(lngLat: readonly [number, number]): string {
	return `${lngLat[0].toFixed(5)},${lngLat[1].toFixed(5)}`;
}

export function addressHistoryMode(input: {
	intent: AddressHistoryIntent;
	currentAddress: string | null;
	lastWrittenAddress: string | null;
	nextAddress: string;
}): AddressHistoryMode {
	// Default-Punkt und Back stellen nur einen Zustand her, sie sind keine neue Wahl.
	if (input.intent === 'restore') return 'replace';
	if (input.nextAddress === input.currentAddress) return 'replace';
	// Zwei Aufrufe für dieselbe Wahl, bevor `goto` die URL aktualisiert hat.
	if (input.nextAddress === input.lastWrittenAddress) return 'replace';
	return 'push';
}

export type PopstateSelection =
	| { kind: 'none' }
	| { kind: 'clear' }
	| { kind: 'select'; lng: number; lat: number; displayName: string };

/** Was Back/Forward mit der Auswahl tun soll, abgeleitet aus der Adresse der Ziel-URL. */
export function resolvePopstateSelection(
	address: { lng?: number; lat?: number; q?: string },
	marker: { lng: number; lat: number } | null
): PopstateSelection {
	if (typeof address.lng !== 'number' || typeof address.lat !== 'number') {
		return marker ? { kind: 'clear' } : { kind: 'none' };
	}
	if (
		marker &&
		formatAddressParam([marker.lng, marker.lat]) === formatAddressParam([address.lng, address.lat])
	) {
		return { kind: 'none' };
	}
	return {
		kind: 'select',
		lng: address.lng,
		lat: address.lat,
		displayName: address.q ?? `${address.lat.toFixed(5)}, ${address.lng.toFixed(5)}`
	};
}
