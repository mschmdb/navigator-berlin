/**
 * Story 16.3: Geolocation-Abfrage als getestete Funktion mit diskriminierter Union.
 * Spiegelt das onLocate-Pattern der Explore-Seite (Consent, Timeout, Error-Mapping),
 * damit „in deiner Nähe" keinen zweiten Geolocation-Stack braucht.
 */
export type PositionResult =
	| { ok: true; lat: number; lng: number }
	| { ok: false; reason: 'unsupported' | 'denied' | 'error' };

const PERMISSION_DENIED = 1;

export async function requestPosition(): Promise<PositionResult> {
	if (typeof navigator === 'undefined' || !navigator.geolocation) {
		return { ok: false, reason: 'unsupported' };
	}
	try {
		const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject, {
				enableHighAccuracy: true,
				timeout: 10_000,
				maximumAge: 30_000
			});
		});
		return { ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude };
	} catch (err) {
		const denied =
			typeof err === 'object' &&
			err !== null &&
			'code' in err &&
			(err as GeolocationPositionError).code === PERMISSION_DENIED;
		return { ok: false, reason: denied ? 'denied' : 'error' };
	}
}
