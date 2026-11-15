import { describe, it, expect } from 'vitest';
import { gruenSatz, laermSatz, shareWord } from './share-phrases.js';

describe('shareWord', () => {
	it('nennt einfache Brüche in Worten', () => {
		expect(shareWord(0.8, 'de')).toBe('vier Fünftel');
		expect(shareWord(0.5, 'de')).toBe('die Hälfte');
		expect(shareWord(1 / 3, 'de')).toBe('ein Drittel');
		expect(shareWord(0.75, 'en')).toBe('three quarters');
	});
	it('nennt krumme Anteile in Prozent', () => {
		expect(shareWord(0.5217391304347826, 'de')).toBe('52 Prozent');
		expect(shareWord(0.5217391304347826, 'en')).toBe('52 percent');
	});
});

describe('gruenSatz', () => {
	it('Mehrheit: Urteil zuerst, dann Anteile (Reuterstraße)', () => {
		expect(gruenSatz({ mittel: 0.2, schlecht: 0.8 }, 'kiez', 'de')).toBe(
			'Laut Senat überwiegend schlecht. Vier Fünftel der Teilgebiete gelten als schlecht mit Grün versorgt, ein Fünftel als mittel.'
		);
		expect(gruenSatz({ mittel: 0.2, schlecht: 0.8 }, 'kiez', 'en')).toBe(
			'Mostly poor, according to the Senate. Four fifths of the subareas are rated as poorly served with green space, one fifth as moderately served.'
		);
	});

	it('krumme Anteile in Prozent (Neukölln)', () => {
		const dist = {
			gut: 0.5217391304347826,
			mittel: 0.15217391304347827,
			schlecht: 0.32608695652173914
		};
		expect(gruenSatz(dist, 'bezirk', 'de')).toBe(
			'Laut Senat überwiegend gut. 52 Prozent der Teilgebiete gelten als gut mit Grün versorgt, 33 Prozent als schlecht und 15 Prozent als mittel.'
		);
	});

	it('ganzer Kiez in einer Klasse, auch bei nur einem Teilgebiet', () => {
		expect(gruenSatz({ gut: 1 }, 'kiez', 'de')).toBe(
			'Laut Senat gut. Der ganze Kiez gilt als gut mit Grün versorgt.'
		);
		expect(gruenSatz({ gut: 1 }, 'bezirk', 'en')).toBe(
			'Good, according to the Senate. The whole Bezirk is rated as well served with green space.'
		);
	});

	it('Gleichstand: gemischt, Hälfte und andere Hälfte', () => {
		expect(gruenSatz({ gut: 0.5, schlecht: 0.5 }, 'kiez', 'de')).toBe(
			'Laut Senat gemischt. Die Hälfte der Teilgebiete gilt als gut mit Grün versorgt, die andere Hälfte als schlecht.'
		);
		expect(gruenSatz({ gut: 0.5, schlecht: 0.5 }, 'kiez', 'en')).toBe(
			'Mixed, according to the Senate. Half of the subareas are rated as well served with green space, the other half as poorly served.'
		);
	});

	it('drei gleiche Anteile: je ein Drittel', () => {
		const third = 1 / 3;
		expect(gruenSatz({ gut: third, mittel: third, schlecht: third }, 'kiez', 'de')).toBe(
			'Laut Senat gemischt. Je ein Drittel der Teilgebiete gilt als gut, mittel und schlecht mit Grün versorgt.'
		);
	});

	it('leere Verteilung ergibt keinen Satz', () => {
		expect(gruenSatz({}, 'kiez', 'de')).toBe('');
	});
});

describe('laermSatz', () => {
	it('Mehrheit gering', () => {
		expect(laermSatz({ gering: 0.8, mittel: 0.2 }, 'kiez', 'de')).toBe(
			'Eher ruhig. Vier Fünftel der Teilgebiete liegen in der Lärmklasse gering, ein Fünftel in der Klasse mittel.'
		);
		expect(laermSatz({ gering: 0.8, mittel: 0.2 }, 'kiez', 'en')).toBe(
			'Fairly quiet. Four fifths of the subareas are in the noise class low, one fifth in the class medium.'
		);
	});
	it('Rohwert niedrig gilt als gering', () => {
		expect(laermSatz({ niedrig: 1 }, 'bezirk', 'de')).toBe(
			'Eher ruhig. Der ganze Bezirk liegt in der Lärmklasse gering.'
		);
	});
	it('ohne Mehrheit gemischt', () => {
		expect(laermSatz({ hoch: 0.4, mittel: 0.4, gering: 0.2 }, 'kiez', 'de')).toBe(
			'Gemischt. Zwei Fünftel der Teilgebiete liegen in der Lärmklasse mittel, zwei Fünftel in der Klasse hoch und ein Fünftel in der Klasse gering.'
		);
	});
});
