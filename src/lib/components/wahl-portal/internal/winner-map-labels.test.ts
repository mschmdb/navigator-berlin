import { describe, expect, it } from 'vitest';
import {
	buildAnsichtAnnouncement,
	buildFigureLabel,
	buildWinnerTableColumns
} from './winner-map-labels.js';

describe('buildFigureLabel', () => {
	it('Sieger-Modus: „Karte der stärksten Partei…"', () => {
		expect(
			buildFigureLabel({ ebeneLabel: 'Kiez', jahr: 2023, repeatElection: false, aktivePartei: null })
		).toBe('Karte der stärksten Partei je Gebiet, Ebene Kiez, 2023');
	});

	it('Partei-Modus: nennt die Partei statt „stärkste Partei" (Review-Fund #6)', () => {
		expect(
			buildFigureLabel({ ebeneLabel: 'Kiez', jahr: 2023, repeatElection: false, aktivePartei: 'SPD' })
		).toBe('Karte: Anteil SPD je Gebiet, Ebene Kiez, 2023');
	});

	it('hängt einen Wiederholungswahl-Hinweis an', () => {
		expect(
			buildFigureLabel({ ebeneLabel: 'Bezirk', jahr: 2023, repeatElection: true, aktivePartei: null })
		).toContain('(Wiederholungswahl)');
	});

	it('lässt das Jahr weg, wenn keins bekannt ist', () => {
		expect(
			buildFigureLabel({ ebeneLabel: 'Kiez', jahr: null, repeatElection: false, aktivePartei: null })
		).toBe('Karte der stärksten Partei je Gebiet, Ebene Kiez');
	});
});

describe('buildAnsichtAnnouncement (Review-Fund #6)', () => {
	it('Gewinner-Tab', () => {
		expect(buildAnsichtAnnouncement(null)).toBe('Ansicht: Stärkste Partei');
	});

	it('Partei-Tab nennt die Partei', () => {
		expect(buildAnsichtAnnouncement('CDU')).toBe('Ansicht: Anteil CDU');
	});
});

describe('buildWinnerTableColumns', () => {
	it('liefert Gebiet/Partei/Anteil-Spalten', () => {
		const columns = buildWinnerTableColumns();
		expect(columns.map((c) => c.key)).toEqual(['gebiet', 'partei', 'anteil']);
	});
});
