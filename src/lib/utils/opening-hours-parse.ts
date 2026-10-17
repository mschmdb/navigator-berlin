import OpeningHours from 'opening_hours';

const BERLIN_NOMINATIM = {
	lat: 52.52,
	lon: 13.405,
	address: { country_code: 'de', state: 'Berlin' }
};

/** Reine Syntaxprüfung ohne Zeitauswertung. Warnungen des Parsers zählen als Fehler. */
export function isParsableOpeningHours(value: string): boolean {
	const v = value.trim();
	if (!v) return false;
	try {
		return new OpeningHours(v, BERLIN_NOMINATIM).getWarnings().length === 0;
	} catch {
		return false;
	}
}
