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

/** Rohwert aus der URL im Schreibformat, damit ein Deep-Link mit weniger Stellen gleich zählt. */
export function normalizeAddressParam(raw: string | null): string | null {
	if (!raw) return null;
	const parts = raw.split(',').map((part) => Number.parseFloat(part));
	if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return null;
	return formatAddressParam([parts[0]!, parts[1]!]);
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

/**
 * Query für eine Adresswahl. Die aktuelle Adresse wird gelesen, bevor
 * `clearKeys` sie entfernt, sonst greift der Vergleich mit der URL nie.
 */
export function buildAddressNavigation(input: {
	href: string;
	lngLat: readonly [number, number];
	displayName?: string;
	intent: AddressHistoryIntent;
	lastWrittenAddress: string | null;
	clearKeys: readonly string[];
}): { search: string; mode: AddressHistoryMode; nextAddress: string } {
	const url = new URL(input.href);
	const currentAddress = normalizeAddressParam(url.searchParams.get('address'));
	for (const key of input.clearKeys) url.searchParams.delete(key);
	const nextAddress = formatAddressParam(input.lngLat);
	const mode = addressHistoryMode({
		intent: input.intent,
		currentAddress,
		lastWrittenAddress: input.lastWrittenAddress,
		nextAddress
	});
	url.searchParams.set('address', nextAddress);
	if (input.displayName) url.searchParams.set('q', input.displayName);
	return { search: `?${url.searchParams.toString()}`, mode, nextAddress };
}

export interface AddressHistoryWriter {
	write(address: string, search: string, mode: AddressHistoryMode): Promise<void>;
	/** Zuletzt bestätigt geschriebene Adresse der aktuellen Wahl. */
	lastWritten(): string | null;
	/** Auswahl geschlossen: verwirft laufende und wartende Writes. */
	forget(): void;
}

/**
 * Führt Schreibvorgänge derselben Adresse zusammen, solange `navigate` läuft.
 * Ein zweites `goto` würde das erste abbrechen und als Replace den vorigen
 * History-Eintrag überschreiben. Ändert sich nur der Name (`q`), folgt nach
 * dem ersten Schreiben ein Replace; landete das erste nicht, wiederholt der
 * Nachzügler dessen Modus. Eine neuere Wahl oder `forget` verwirft Nachzügler.
 *
 * `navigate` meldet, ob die URL danach die Adresse trägt: SvelteKit erfüllt das
 * `goto`-Promise auch, wenn eine andere Navigation es überholt hat.
 */
export function createAddressHistoryWriter(
	navigate: (search: string, mode: AddressHistoryMode) => Promise<boolean>
): AddressHistoryWriter {
	let inFlight: {
		address: string;
		search: string;
		mode: AddressHistoryMode;
		confirmed: Promise<boolean>;
		promise: Promise<void>;
	} | null = null;
	let lastWritten: string | null = null;
	// Jede neue Wahl und jedes `forget` erhöht die Generation und entwertet Nachzügler.
	let generation = 0;

	function track(
		address: string,
		search: string,
		mode: AddressHistoryMode,
		own: number,
		confirmed: Promise<boolean>
	): Promise<void> {
		const settled: Promise<void> = confirmed
			.then((wrote) => {
				// Nur die aktuelle Wahl zählt; eine überholte darf `lastWritten` nicht setzen.
				if (wrote && own === generation) lastWritten = address;
			})
			.finally(() => {
				if (inFlight?.promise === settled) inFlight = null;
			});
		inFlight = { address, search, mode, confirmed, promise: settled };
		return settled;
	}

	return {
		write(address, search, mode) {
			if (inFlight && inFlight.address === address) {
				if (inFlight.search === search) return inFlight.promise;
				const prior = inFlight;
				const own = ++generation;
				const confirmed = prior.confirmed
					.then(
						(landed) => landed,
						() => false
					)
					.then((landed) => {
						// Verworfener Zwischenstand: den Stand des Vorgängers weiterreichen,
						// damit ein gelandeter Push nicht ein zweites Mal gepusht wird.
						if (own !== generation) return landed;
						return navigate(search, landed ? 'replace' : prior.mode);
					});
				return track(address, search, prior.mode, own, confirmed);
			}
			const own = ++generation;
			return track(address, search, mode, own, navigate(search, mode));
		},
		lastWritten: () => lastWritten,
		forget: () => {
			lastWritten = null;
			inFlight = null;
			++generation;
		}
	};
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
