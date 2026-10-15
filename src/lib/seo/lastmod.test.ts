import { describe, expect, it } from 'vitest';
import {
	isYearPlaceholder,
	lastmodOfLayer,
	latestLastmod,
	profileLastmod,
	validLastmod
} from './lastmod.js';

describe('validLastmod', () => {
	it('gibt gültige ISO-Daten unverändert zurück', () => {
		expect(validLastmod('2026-09-03')).toBe('2026-09-03');
		expect(validLastmod('2026-10-14T08:00:00.000Z')).toBe('2026-10-14T08:00:00.000Z');
	});

	it('akzeptiert ISO-Datetime mit Zeitzone (Z oder Offset)', () => {
		expect(validLastmod('2026-10-14T08:00:00+02:00')).toBe('2026-10-14T08:00:00+02:00');
		expect(validLastmod('2026-10-14T08:00Z')).toBe('2026-10-14T08:00Z');
	});

	it('lehnt Nicht-W3C-Formate ab', () => {
		for (const value of [
			'1',
			'Oct 14 2026',
			'2026-10-14 12:00',
			'2026-10-14T08:00:00',
			'2026-02-30',
			'2026-02-29',
			'2026-10-14T25:00:00Z'
		]) {
			expect(validLastmod(value), value).toBeUndefined();
		}
	});

	it('akzeptiert Schaltjahr-Tage', () => {
		expect(validLastmod('2028-02-29')).toBe('2028-02-29');
	});

	it('liefert undefined für fehlende oder ungültige Werte', () => {
		expect(validLastmod(undefined)).toBeUndefined();
		expect(validLastmod(null)).toBeUndefined();
		expect(validLastmod('')).toBeUndefined();
		expect(validLastmod('gestern')).toBeUndefined();
		expect(validLastmod('2026-13-45')).toBeUndefined();
	});
});

describe('latestLastmod', () => {
	it('wählt das späteste gültige Datum', () => {
		expect(latestLastmod(['2026-09-03', '2026-10-14T00:00:00.000Z', '2026-01-01'])).toBe(
			'2026-10-14T00:00:00.000Z'
		);
	});

	it('überspringt ungültige und fehlende Werte', () => {
		expect(latestLastmod([undefined, 'kaputt', '2026-05-01', null])).toBe('2026-05-01');
	});

	it('vergleicht nach Zeitwert, nicht als String (gemischte Formate)', () => {
		// 08:00+02:00 = 06:00Z, früher als 07:00Z, obwohl der String größer ist
		expect(latestLastmod(['2026-10-14T08:00:00+02:00', '2026-10-14T07:00:00Z'])).toBe(
			'2026-10-14T07:00:00Z'
		);
		expect(latestLastmod(['2026-10-14T00:00:00.000Z', '2026-10-13T23:59:59-12:00'])).toBe(
			'2026-10-13T23:59:59-12:00'
		);
	});

	it('liefert undefined ohne gültigen Wert', () => {
		expect(latestLastmod([])).toBeUndefined();
		expect(latestLastmod([undefined, 'kaputt'])).toBeUndefined();
	});
});

describe('profileLastmod', () => {
	const scores = '2026-10-14T08:00:00.000Z';

	it('DE: späteres von generatedAt und Scores-Datum', () => {
		expect(profileLastmod({ generatedAt: '2026-09-03T12:00:00.000Z' }, 'de', scores)).toBe(scores);
		expect(profileLastmod({ generatedAt: '2026-11-01T00:00:00.000Z' }, 'de', scores)).toBe(
			'2026-11-01T00:00:00.000Z'
		);
	});

	it('EN: translatedAt zählt mit, DE ignoriert es', () => {
		const dates = {
			generatedAt: '2026-06-07T12:00:00.000Z',
			translatedAt: '2026-11-02T00:00:00.000Z'
		};
		expect(profileLastmod(dates, 'en', scores)).toBe('2026-11-02T00:00:00.000Z');
		expect(profileLastmod(dates, 'de', scores)).toBe(scores);
	});

	it('nutzt nur das Scores-Datum, wenn das Profil keine Daten hat', () => {
		expect(profileLastmod(undefined, 'de', scores)).toBe(scores);
	});

	it('lässt lastmod weg, wenn keine Quelle ein gültiges Datum liefert', () => {
		expect(profileLastmod(undefined, 'de', undefined)).toBeUndefined();
		expect(profileLastmod({ generatedAt: 'kaputt' }, 'en', 'kaputt')).toBeUndefined();
	});
});

describe('isYearPlaceholder', () => {
	it('erkennt YYYY-01-01 in allen Schreibweisen', () => {
		for (const value of ['2022-01-01', '2022-01-01T00:00:00Z', '2022-01-01T00:00:00.000Z']) {
			expect(isYearPlaceholder(value), value).toBe(true);
		}
	});

	it('lässt echte Daten durch', () => {
		for (const value of ['2022-05-15', '2022-01-02', '2022-01-01T08:30:00.000Z', 'kaputt']) {
			expect(isYearPlaceholder(value), value).toBe(false);
		}
	});
});

describe('lastmodOfLayer', () => {
	const now = new Date('2026-10-15T12:00:00Z');

	it('Jahres-Platzhalter verliert gegen fetchedAt', () => {
		expect(lastmodOfLayer('2022-01-01T00:00:00.000Z', '2026-10-14T08:00:00.000Z', now)).toBe(
			'2026-10-14T08:00:00.000Z'
		);
	});

	it('echtes sourceUpdatedAt bleibt, auch wenn fetchedAt später ist', () => {
		expect(lastmodOfLayer('2022-05-15', '2026-10-14', now)).toBe('2022-05-15');
	});

	it('fehlendes oder ungültiges sourceUpdatedAt: fetchedAt', () => {
		expect(lastmodOfLayer(undefined, '2026-10-14', now)).toBe('2026-10-14');
		expect(lastmodOfLayer('kaputt', '2026-10-14', now)).toBe('2026-10-14');
	});

	it('beide ungültig: kein lastmod', () => {
		expect(lastmodOfLayer('kaputt', 'auch kaputt', now)).toBeUndefined();
		expect(lastmodOfLayer(undefined, undefined, now)).toBeUndefined();
	});

	it('Zukunftsdaten fallen weg', () => {
		expect(lastmodOfLayer('2027-03-01', '2026-10-14', now)).toBe('2026-10-14');
		expect(lastmodOfLayer('2022-05-15', '2027-03-01', now)).toBe('2022-05-15');
		expect(lastmodOfLayer('2027-03-01', '2027-04-01', now)).toBeUndefined();
	});

	it('Platzhalter ohne verwertbares fetchedAt bleibt als letzter Ausweg', () => {
		expect(lastmodOfLayer('2022-01-01', undefined, now)).toBe('2022-01-01');
	});
});
