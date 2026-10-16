import { describe, expect, it } from 'vitest';
import { HILFE_DIENSTE, type HilfeDienst, type HilfeDienstId } from '$lib/kaelte/hilfe-dienste.js';
import {
	formatMonthDay,
	getBerlinParts,
	isKaelteSaison,
	serviceStatus,
	type ServiceStatus
} from './berlin-time.js';

function dienst(id: HilfeDienstId): HilfeDienst {
	const found = HILFE_DIENSTE.find((d) => d.id === id);
	if (!found) throw new Error(`Dienst ${id} fehlt`);
	return found;
}

const at = (iso: string) => new Date(iso);

describe('getBerlinParts', () => {
	it('rechnet UTC im Winter auf MEZ (+1)', () => {
		const p = getBerlinParts(at('2026-11-16T20:30:00Z'));
		expect(p).toMatchObject({
			year: 2026,
			month: 11,
			day: 16,
			hour: 21,
			minute: 30,
			isoWeekday: 1
		});
	});

	it('rechnet UTC im Sommer auf MESZ (+2)', () => {
		const p = getBerlinParts(at('2026-06-15T22:30:00Z'));
		expect(p).toMatchObject({ month: 6, day: 16, hour: 0, minute: 30 });
	});

	it('liefert Mitternacht als Stunde 0, nicht 24', () => {
		expect(getBerlinParts(at('2026-12-01T23:00:00Z')).hour).toBe(0);
	});

	it('liefert Sonntag als ISO-Wochentag 7', () => {
		expect(getBerlinParts(at('2026-11-15T12:00:00Z')).isoWeekday).toBe(7);
	});
});

describe('serviceStatus', () => {
	it('abends im November: alle drei Nachtdienste erreichbar', () => {
		const now = at('2026-11-16T20:30:00Z'); // 21:30 Berlin
		expect(serviceStatus(dienst('kaeltehilfetelefon'), now).state).toBe('open');
		expect(serviceStatus(dienst('kaeltebus'), now).state).toBe('open');
		expect(serviceStatus(dienst('waermebus'), now).state).toBe('open');
	});

	it('nachts 1:30: nur der Kältebus ist erreichbar', () => {
		const now = at('2026-12-01T00:30:00Z'); // 1:30 Berlin
		expect(serviceStatus(dienst('kaeltebus'), now)).toEqual({ state: 'open', closesAtHour: 2 });
		expect(serviceStatus(dienst('kaeltehilfetelefon'), now)).toEqual({
			state: 'later',
			opensAtHour: 19,
			when: 'today'
		});
		expect(serviceStatus(dienst('waermebus'), now)).toEqual({
			state: 'later',
			opensAtHour: 18,
			when: 'today'
		});
	});

	it('tagsüber 14:00: kein Nachtdienst erreichbar', () => {
		const now = at('2026-12-02T13:00:00Z'); // Mittwoch 14:00 Berlin
		for (const id of ['kaeltehilfetelefon', 'kaeltebus', 'waermebus'] as const) {
			expect(serviceStatus(dienst(id), now).state).toBe('later');
		}
		expect(serviceStatus(dienst('karuna'), now)).toEqual({ state: 'open', closesAtHour: 16 });
	});

	it('Oktober: Kältehilfetelefon erreichbar, Busse erst ab 1. November', () => {
		const now = at('2026-10-15T18:00:00Z'); // 20:00 MESZ
		expect(serviceStatus(dienst('kaeltehilfetelefon'), now).state).toBe('open');
		const expected: ServiceStatus = { state: 'season-starts', month: 11, day: 1 };
		expect(serviceStatus(dienst('kaeltebus'), now)).toEqual(expected);
		expect(serviceStatus(dienst('waermebus'), now)).toEqual(expected);
	});

	it('Juni: saisonale Dienste starten mit der neuen Saison', () => {
		const now = at('2026-06-10T18:00:00Z');
		expect(serviceStatus(dienst('kaeltehilfetelefon'), now)).toEqual({
			state: 'season-starts',
			month: 10,
			day: 1
		});
		expect(serviceStatus(dienst('kaeltebus'), now).state).toBe('season-starts');
	});

	it('1. November, 1:30: Fenster begann am 31.10. außerhalb der Saison, erster Einsatz heute Abend', () => {
		expect(serviceStatus(dienst('kaeltebus'), at('2026-11-01T00:30:00Z'))).toEqual({
			state: 'later',
			opensAtHour: 20,
			when: 'today'
		});
	});

	it('1. April, 1:30: Fenster begann am 31.3. und läuft', () => {
		expect(serviceStatus(dienst('kaeltebus'), at('2027-03-31T23:30:00Z')).state).toBe('open');
	});

	it('30. April nach Fensterende: nächste Saison', () => {
		expect(serviceStatus(dienst('kaeltehilfetelefon'), at('2027-04-30T21:30:00Z'))).toEqual({
			state: 'season-starts',
			month: 10,
			day: 1
		});
	});

	it('Fensterende ist exklusiv: um 23:00 ist das Kältehilfetelefon zu', () => {
		const s = serviceStatus(dienst('kaeltehilfetelefon'), at('2026-11-16T22:00:00Z'));
		expect(s.state).toBe('later');
	});

	it('Fensterstart ist inklusiv: um 19:00 ist das Kältehilfetelefon offen', () => {
		expect(serviceStatus(dienst('kaeltehilfetelefon'), at('2026-11-16T18:00:00Z')).state).toBe(
			'open'
		);
	});

	it('Wärmebus (bis 24 Uhr) ist um 23:59 offen, um 0:00 zu', () => {
		expect(serviceStatus(dienst('waermebus'), at('2026-11-16T22:59:00Z')).state).toBe('open');
		expect(serviceStatus(dienst('waermebus'), at('2026-11-16T23:00:00Z')).state).toBe('later');
	});

	it('nach Fensterende am selben Abend: nächster Termin morgen', () => {
		expect(serviceStatus(dienst('kaeltehilfetelefon'), at('2026-11-16T22:30:00Z'))).toEqual({
			state: 'later',
			opensAtHour: 19,
			when: 'tomorrow'
		});
	});

	it('KARUNA am Samstag: nächster Werktag', () => {
		expect(serviceStatus(dienst('karuna'), at('2026-11-14T11:00:00Z'))).toEqual({
			state: 'later',
			opensAtHour: 9,
			when: 'next-weekday'
		});
	});

	it('KARUNA am Montagabend: morgen', () => {
		expect(serviceStatus(dienst('karuna'), at('2026-11-16T20:30:00Z'))).toEqual({
			state: 'later',
			opensAtHour: 9,
			when: 'tomorrow'
		});
	});

	it('Wärmebus meldet das Ende als 24, nicht als 0', () => {
		expect(serviceStatus(dienst('waermebus'), at('2026-11-16T20:30:00Z'))).toEqual({
			state: 'open',
			closesAtHour: 24
		});
	});

	it('KARUNA am Freitag nach 16 Uhr: nächster Werktag', () => {
		expect(serviceStatus(dienst('karuna'), at('2026-11-13T17:00:00Z'))).toEqual({
			state: 'later',
			opensAtHour: 9,
			when: 'next-weekday'
		});
	});

	it('KARUNA ist ganzjährig erreichbar (Dienstag im Juli, 10:00)', () => {
		expect(serviceStatus(dienst('karuna'), at('2026-07-14T08:00:00Z')).state).toBe('open');
	});
});

describe('isKaelteSaison', () => {
	it('gilt von Oktober bis April', () => {
		expect(isKaelteSaison(at('2026-10-01T10:00:00Z'))).toBe(true);
		expect(isKaelteSaison(at('2027-04-30T10:00:00Z'))).toBe(true);
	});

	it('gilt nicht von Mai bis September', () => {
		expect(isKaelteSaison(at('2027-05-01T10:00:00Z'))).toBe(false);
		expect(isKaelteSaison(at('2026-09-30T10:00:00Z'))).toBe(false);
	});

	it('rechnet in Berliner Zeit: 30.9. 23:30 UTC ist schon der 1.10.', () => {
		expect(isKaelteSaison(at('2026-09-30T23:30:00Z'))).toBe(true);
	});
});

describe('formatMonthDay', () => {
	it('formatiert deutsch', () => {
		expect(formatMonthDay({ month: 11, day: 1 }, 'de')).toBe('1. November');
	});

	it('formatiert englisch', () => {
		expect(formatMonthDay({ month: 11, day: 1 }, 'en')).toBe('November 1');
	});
});
