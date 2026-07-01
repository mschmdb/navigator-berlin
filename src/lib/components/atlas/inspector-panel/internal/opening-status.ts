import OpeningHours from 'opening_hours';

/**
 * Story 15.4: Live-Öffnungsstatus eines Orts aus dem OSM-`opening_hours`-String.
 * "closing-soon" = geöffnet, schließt aber binnen 30 Minuten. Unparsbare oder leere
 * Werte liefern "unknown" (kein falsches "offen"). Reines Modul, `now` ist Parameter (testbar).
 */
export type OpeningStatus = 'open' | 'closing-soon' | 'closed' | 'unknown';

const CLOSING_SOON_MS = 30 * 60 * 1000;

// Berlin-Kontext, damit Feiertags-Regeln (PH) auswertbar sind statt zu werfen.
const BERLIN_NOMINATIM = {
	lat: 52.52,
	lon: 13.405,
	address: { country_code: 'de', state: 'Berlin' }
};

export function getOpeningStatus(value: string, now: Date): OpeningStatus {
	const v = value.trim();
	if (!v) return 'unknown';
	try {
		const oh = new OpeningHours(v, BERLIN_NOMINATIM);
		if (!oh.getState(now)) return 'closed';
		const next = oh.getNextChange(now);
		if (next && next.getTime() - now.getTime() <= CLOSING_SOON_MS) return 'closing-soon';
		return 'open';
	} catch {
		return 'unknown';
	}
}

export function isOpenNow(status: OpeningStatus): boolean {
	return status === 'open' || status === 'closing-soon';
}
