// Story 15.4: opening_hours.js liefert keine eigenen Typen und es gibt kein @types-Paket.
// Minimale Deklaration der von uns genutzten API (getState/getNextChange).
declare module 'opening_hours' {
	interface NominatimAddress {
		country_code?: string;
		state?: string;
	}
	interface NominatimObject {
		lat?: number;
		lon?: number;
		address?: NominatimAddress;
	}
	export default class OpeningHours {
		constructor(value: string, nominatim?: NominatimObject | null, optionalConf?: unknown);
		getState(date?: Date): boolean;
		getNextChange(date?: Date): Date | undefined;
	}
}
