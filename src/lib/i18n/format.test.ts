import { describe, it, expect } from 'vitest';
import {
	formatPercent,
	formatPercentagePointsDelta,
	formatCount,
	formatWahlDate,
	formatShortDate,
	formatDecimal
} from './format.js';

describe('formatPercent', () => {
	it('formatiert de mit Komma und Leerzeichen vor %', () => {
		expect(formatPercent(0.282, { locale: 'de' })).toBe('28,2 %');
	});

	it('formatiert en mit Punkt und ohne Leerzeichen vor %', () => {
		expect(formatPercent(0.282, { locale: 'en' })).toBe('28.2%');
	});

	it('rundet ganzzahlig bei decimals: 0', () => {
		expect(formatPercent(0.2849, { locale: 'de', decimals: 0 })).toBe('28 %');
		expect(formatPercent(0.2849, { locale: 'en', decimals: 0 })).toBe('28%');
	});

	it('vermeidet -0,0 bei sehr kleinen negativen Werten nahe 0', () => {
		expect(formatPercent(-0.0001, { locale: 'de' })).toBe('0,0 %');
	});

	// Review-Fund: `Math.round(pct * 10) / 10` vor dem `toFixed` rundete
	// Grenzwerte anders als ein direktes `toFixed(1)` (die vormalige,
	// byte-genau zu erhaltende Rundung an allen 6 Alt-Call-Sites).
	it('rundet exakt wie toFixed(1), nicht via Math.round(pct*10)/10 (Grenzwerte)', () => {
		expect(formatPercent(0.0015, { locale: 'de' })).toBe('0,1 %');
		expect(formatPercent(0.0045, { locale: 'de' })).toBe('0,4 %');
		expect(formatPercent(0.0015, { locale: 'en' })).toBe('0.1%');
		expect(formatPercent(0.0045, { locale: 'en' })).toBe('0.4%');
	});
});

describe('formatPercentagePointsDelta', () => {
	it('formatiert positive Deltas de mit Pp.', () => {
		expect(formatPercentagePointsDelta(10.2, { locale: 'de' })).toBe('+10,2 Pp.');
	});

	it('formatiert positive Deltas en mit pp', () => {
		expect(formatPercentagePointsDelta(10.2, { locale: 'en' })).toBe('+10.2 pp');
	});

	it('nutzt ein echtes Minuszeichen (U+2212) für negative Deltas, in beiden Locales', () => {
		expect(formatPercentagePointsDelta(-3.4, { locale: 'de' })).toBe('−3,4 Pp.');
		expect(formatPercentagePointsDelta(-3.4, { locale: 'en' })).toBe('−3.4 pp');
	});

	// Review-Fund: DE bleibt Byte-identisch zum alten `formatDeltaLabel`
	// (Vorzeichen aus dem UNGERUNDETEN Delta, auch wenn das auf "0,0" rundet).
	it('DE: sehr kleine negative Deltas runden auf "0,0" MIT Vorzeichen (Alt-Verhalten, bewusst erhalten)', () => {
		expect(formatPercentagePointsDelta(-0.04, { locale: 'de' })).toBe('−0,0 Pp.');
	});

	// EN: Vorzeichen folgt dem GERUNDETEN Wert -- ein auf "0.0" gerundetes
	// Delta zeigt kein Vorzeichen (kein neu eingeführtes "-0.0 pp"/"+0.0 pp").
	it('EN: sehr kleine Deltas nahe 0 runden auf "0.0" OHNE Vorzeichen', () => {
		expect(formatPercentagePointsDelta(-0.04, { locale: 'en' })).toBe('0.0 pp');
		expect(formatPercentagePointsDelta(0.03, { locale: 'en' })).toBe('0.0 pp');
	});
});

describe('formatCount', () => {
	it('formatiert Tausendertrennzeichen de', () => {
		expect(formatCount(1234, { locale: 'de' })).toBe('1.234');
	});

	it('formatiert Tausendertrennzeichen en', () => {
		expect(formatCount(1234, { locale: 'en' })).toBe('1,234');
	});
});

describe('formatWahlDate', () => {
	it('formatiert de als DD.MM.YYYY in Europe/Berlin, identisch zu formatBerlinDate', () => {
		expect(formatWahlDate('2026-09-20T23:55:55.000Z', { locale: 'de' })).toBe('21.09.2026');
	});

	it('formatiert en als D MMMM YYYY (ausgeschriebener Monat, ICU-stabil) in Europe/Berlin', () => {
		expect(formatWahlDate('2026-09-20T23:55:55.000Z', { locale: 'en' })).toBe('21 September 2026');
	});

	it('gibt den Roh-String zurück, wenn er kein valides Datum ist', () => {
		expect(formatWahlDate('nicht-valide', { locale: 'de' })).toBe('nicht-valide');
	});
});

describe('formatShortDate', () => {
	it('formatiert de mit abgekürztem Monat (byte-identisch zum Alt-Verhalten der Updates-Teaser)', () => {
		expect(formatShortDate('2026-05-15', { locale: 'de' })).toBe('15. Mai 2026');
	});

	it('formatiert en mit abgekürztem Monat', () => {
		expect(formatShortDate('2026-05-15', { locale: 'en' })).toBe('15 May 2026');
	});

	it('gibt den Roh-String zurück, wenn er kein valides Datum ist', () => {
		expect(formatShortDate('nicht-valide', { locale: 'de' })).toBe('nicht-valide');
	});

	// Review-Fund (i18n Block B2): die alte `home-updates-teaser.svelte`-
	// Formatierung erzwang NIE eine Zeitzone (Host-Zeitzone) -- ein
	// hinzugefügtes `timeZone: 'Europe/Berlin'` hätte das Datum je nach
	// Host-TZ (z. B. UTC in Production) auf den Vor-/Folgetag springen
	// lassen. Test host-TZ-unabhängig: vergleicht gegen denselben nativen
	// `toLocaleDateString`-Aufruf OHNE `timeZone`-Option statt einen fest
	// erwarteten Kalendertag zu behaupten.
	it('erzwingt keine Zeitzone (Datum nahe Mitternacht UTC, Alt-Verhalten)', () => {
		const iso = '2026-05-15T23:30:00.000Z';
		const expectedDe = new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
		expect(formatShortDate(iso, { locale: 'de' })).toBe(expectedDe);
		const expectedEn = new Date(iso).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
		expect(formatShortDate(iso, { locale: 'en' })).toBe(expectedEn);
	});
});

// i18n Block B3a: ersetzt verstreute `new Intl.NumberFormat('de-DE', {
// maximumFractionDigits: ... })`-Aufrufe in den Atlas-Formattern.
describe('formatDecimal', () => {
	it('formatiert de mit Komma-Dezimaltrennzeichen und Tausenderpunkt', () => {
		expect(formatDecimal(24.567, { locale: 'de', maximumFractionDigits: 1 })).toBe('24,6');
		expect(formatDecimal(10000, { locale: 'de', maximumFractionDigits: 0 })).toBe('10.000');
	});

	it('formatiert en mit Punkt-Dezimaltrennzeichen und Tausenderkomma', () => {
		expect(formatDecimal(24.567, { locale: 'en', maximumFractionDigits: 1 })).toBe('24.6');
		expect(formatDecimal(10000, { locale: 'en', maximumFractionDigits: 0 })).toBe('10,000');
	});

	it('fällt ohne locale auf getLocale() zurück (Default-Verhalten wie andere format.ts-Helper)', () => {
		expect(formatDecimal(1000)).toBe('1.000');
	});

	// Review-Fund: `Intl.NumberFormat` wirft ein RangeError, wenn
	// `minimumFractionDigits` > `maximumFractionDigits` -- `formatDistance`
	// ruft genau so auf (`minimumFractionDigits: 1` ohne eigenes `max`).
	it('wirft kein RangeError bei minimumFractionDigits > maximumFractionDigits', () => {
		expect(() =>
			formatDecimal(1.5, { locale: 'de', minimumFractionDigits: 4, maximumFractionDigits: 1 })
		).not.toThrow();
		expect(formatDecimal(1.5, { locale: 'de', minimumFractionDigits: 4, maximumFractionDigits: 1 })).toBe(
			'1,5000'
		);
	});
});
