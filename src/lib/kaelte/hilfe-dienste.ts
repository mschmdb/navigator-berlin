/**
 * Hilfedienste der Berliner Kältehilfe. Einzige Quelle der Wahrheit für Nummern, Zeiten,
 * Saison und Quellen. Stand 16.10.2026, jede Nummer ist durch zwei unabhängige Quellen belegt.
 */

export type HilfeDienstId = 'kaeltehilfetelefon' | 'kaeltebus' | 'waermebus' | 'karuna';

export interface MonthDay {
	readonly month: number;
	readonly day: number;
}

export interface Quelle {
	readonly label: string;
	/** Fehlt bei Quellen ohne stabile URL (z. B. Pressemitteilung). */
	readonly url?: string;
}

export interface HilfeDienst {
	readonly id: HilfeDienstId;
	/** Sichtbare Nummer, so wie sie gewählt wird. */
	readonly phoneDisplay: string;
	/** Internationale Form für `tel:`-Links. */
	readonly phoneTel: string;
	/** Beginn des Zeitfensters in Berliner Ortszeit, volle Stunde (0 bis 23). */
	readonly startHour: number;
	/** Ende des Zeitfensters. Kleiner oder gleich `startHour` bedeutet: über Mitternacht. */
	readonly endHour: number;
	/** ISO-Wochentage (1 = Montag, 7 = Sonntag). Ohne Angabe: täglich. */
	readonly weekdays?: readonly number[];
	/** Saison von/bis, jeweils einschließlich. Ohne Angabe: ganzjährig. */
	readonly season?: { readonly from: MonthDay; readonly to: MonthDay };
	readonly quellen: readonly Quelle[];
	/** Betrieb in der laufenden Saison nicht bestätigt: Seite zeigt einen Hinweis. */
	readonly betriebUnbestaetigt?: boolean;
}

/** Datum der letzten Prüfung (ISO). */
export const HILFE_STAND = '2026-10-16';

/** Notruf bei hilfloser oder nicht ansprechbarer Person. */
export const NOTRUF = { phoneDisplay: '112', phoneTel: '112' } as const;

export const KAELTEHILFE_APP_URL = 'https://www.kaeltehilfe-berlin.de/kaeltehilfe-app';
export const KAELTEHILFE_WEGWEISER_URL = 'https://www.kaeltehilfe-berlin.de/wegweiser';

const BERLIN_DE: Quelle = {
	label: 'berlin.de/kaeltehilfe',
	url: 'https://www.berlin.de/kaeltehilfe/'
};

export const HILFE_DIENSTE: readonly HilfeDienst[] = [
	{
		id: 'kaeltehilfetelefon',
		phoneDisplay: '030 34397140',
		phoneTel: '+493034397140',
		startHour: 19,
		endHour: 23,
		season: { from: { month: 10, day: 1 }, to: { month: 4, day: 30 } },
		quellen: [BERLIN_DE, { label: 'GEBEWO pro', url: 'https://gebewo.berlin/' }]
	},
	{
		id: 'kaeltebus',
		phoneDisplay: '030 690333690',
		phoneTel: '+4930690333690',
		startHour: 20,
		endHour: 2,
		season: { from: { month: 11, day: 1 }, to: { month: 3, day: 31 } },
		quellen: [
			BERLIN_DE,
			{ label: 'Berliner Stadtmission', url: 'https://www.berliner-stadtmission.de/kaeltebus' }
		],
		betriebUnbestaetigt: true
	},
	{
		id: 'waermebus',
		phoneDisplay: '030 6003001010',
		phoneTel: '+49306003001010',
		startHour: 18,
		endHour: 24,
		season: { from: { month: 11, day: 1 }, to: { month: 3, day: 31 } },
		quellen: [
			BERLIN_DE,
			{ label: 'DRK Berlin', url: 'https://www.drk-berlin.de/start/ehrenamt/waermebus' }
		]
	},
	{
		id: 'karuna',
		phoneDisplay: '0157 80597870',
		phoneTel: '+4915780597870',
		startHour: 9,
		endHour: 16,
		weekdays: [1, 2, 3, 4, 5],
		quellen: [
			{ label: 'Kältehilfe Berlin', url: 'https://www.kaeltehilfe-berlin.de' },
			{ label: 'Pressemitteilung Bezirksamt Charlottenburg-Wilmersdorf' }
		]
	}
];
