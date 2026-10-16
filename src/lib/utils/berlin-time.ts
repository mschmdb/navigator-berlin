import type { HilfeDienst, MonthDay } from '$lib/kaelte/hilfe-dienste.js';

const BERLIN_TZ = 'Europe/Berlin';

export interface BerlinParts {
	readonly year: number;
	readonly month: number;
	readonly day: number;
	readonly hour: number;
	readonly minute: number;
	/** ISO-Wochentag: 1 = Montag, 7 = Sonntag. */
	readonly isoWeekday: number;
}

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: BERLIN_TZ,
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	hourCycle: 'h23'
});

/** Kalenderdatum und Uhrzeit des Zeitpunkts in Berlin, unabhängig von der Zeitzone des Geräts. */
export function getBerlinParts(date: Date): BerlinParts {
	const values: Record<string, number> = {};
	for (const part of partsFormatter.formatToParts(date)) {
		if (part.type !== 'literal') values[part.type] = Number(part.value);
	}
	const year = values.year ?? 0;
	const month = values.month ?? 0;
	const day = values.day ?? 0;
	return {
		year,
		month,
		day,
		hour: (values.hour ?? 0) % 24,
		minute: values.minute ?? 0,
		isoWeekday: isoWeekdayOf(year, month, day)
	};
}

function isoWeekdayOf(year: number, month: number, day: number): number {
	const js = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
	return js === 0 ? 7 : js;
}

interface CalendarDay {
	readonly year: number;
	readonly month: number;
	readonly day: number;
}

function addDays(d: CalendarDay, offset: number): CalendarDay {
	const shifted = new Date(Date.UTC(d.year, d.month - 1, d.day + offset));
	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate()
	};
}

function inRange(day: MonthDay, from: MonthDay, to: MonthDay): boolean {
	const value = day.month * 100 + day.day;
	const start = from.month * 100 + from.day;
	const end = to.month * 100 + to.day;
	return start <= end ? value >= start && value <= end : value >= start || value <= end;
}

function isEligibleStartDay(service: HilfeDienst, d: CalendarDay): boolean {
	if (service.season && !inRange(d, service.season.from, service.season.to)) return false;
	if (service.weekdays && !service.weekdays.includes(isoWeekdayOf(d.year, d.month, d.day))) {
		return false;
	}
	return true;
}

export type ServiceStatus =
	| { readonly state: 'open'; readonly closesAtHour: number }
	| {
			readonly state: 'later';
			readonly opensAtHour: number;
			readonly when: 'today' | 'tomorrow' | 'next-weekday';
	  }
	| { readonly state: 'season-starts'; readonly month: number; readonly day: number };

/**
 * Erreichbarkeit eines Dienstes zum Zeitpunkt `now`, gerechnet in Europe/Berlin.
 * Ein Fenster über Mitternacht gehört zum Tag seines Beginns (Saison und Wochentag zählen dort).
 */
export function serviceStatus(service: HilfeDienst, now: Date): ServiceStatus {
	const p = getBerlinParts(now);
	const today: CalendarDay = { year: p.year, month: p.month, day: p.day };
	const wraps = service.endHour <= service.startHour;
	// Anzeige: „bis 24 Uhr“ bleibt 24, damit es nicht wie 0 Uhr zum Tagesbeginn wirkt.
	const closesAtHour = service.endHour;

	const startedToday = p.hour >= service.startHour && (wraps || p.hour < service.endHour);
	if (startedToday && isEligibleStartDay(service, today)) {
		return { state: 'open', closesAtHour };
	}
	const startedYesterday = wraps && p.hour < service.endHour;
	if (startedYesterday && isEligibleStartDay(service, addDays(today, -1))) {
		return { state: 'open', closesAtHour };
	}

	for (let offset = 0; offset <= 7; offset += 1) {
		if (offset === 0 && p.hour >= service.startHour) continue;
		if (!isEligibleStartDay(service, addDays(today, offset))) continue;
		if (offset === 0) return { state: 'later', opensAtHour: service.startHour, when: 'today' };
		if (offset === 1) return { state: 'later', opensAtHour: service.startHour, when: 'tomorrow' };
		if (service.weekdays) {
			return { state: 'later', opensAtHour: service.startHour, when: 'next-weekday' };
		}
		break;
	}

	const from = service.season?.from;
	return { state: 'season-starts', month: from?.month ?? 1, day: from?.day ?? 1 };
}

const KAELTE_SAISON = { from: { month: 10, day: 1 }, to: { month: 4, day: 30 } } as const;

/** Kältehilfe-Saison (1. Oktober bis 30. April) am Tag des Zeitpunkts in Berlin. */
export function isKaelteSaison(now: Date): boolean {
	const p = getBerlinParts(now);
	return inRange(p, KAELTE_SAISON.from, KAELTE_SAISON.to);
}

/** Tag und Monat ohne Jahr in der Sprache der Seite, z. B. „1. November“. */
export function formatMonthDay(d: MonthDay, locale: string): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone: 'UTC',
		day: 'numeric',
		month: 'long'
	}).format(new Date(Date.UTC(2026, d.month - 1, d.day)));
}
