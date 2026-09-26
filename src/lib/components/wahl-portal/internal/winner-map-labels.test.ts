import { describe, expect, it } from 'vitest';
import {
	buildAnsichtAnnouncement,
	buildFigureLabel,
	buildWinnerTableColumns
} from './winner-map-labels.js';

describe('buildFigureLabel', () => {
	it('Sieger-Modus: „Karte der stärksten Partei…"', () => {
		expect(
			buildFigureLabel({
				ebeneLabel: 'Kiez',
				jahr: 2023,
				repeatElection: false,
				aktivePartei: null
			})
		).toBe('Karte der stärksten Partei je Gebiet, Ebene Kiez, 2023');
	});

	it('Partei-Modus: nennt die Partei statt „stärkste Partei" (Review-Fund #6)', () => {
		expect(
			buildFigureLabel({
				ebeneLabel: 'Kiez',
				jahr: 2023,
				repeatElection: false,
				aktivePartei: 'SPD'
			})
		).toBe('Karte: Anteil SPD je Gebiet, Ebene Kiez, 2023');
	});

	it('hängt einen Wiederholungswahl-Hinweis an', () => {
		expect(
			buildFigureLabel({
				ebeneLabel: 'Bezirk',
				jahr: 2023,
				repeatElection: true,
				aktivePartei: null
			})
		).toContain('(Wiederholungswahl)');
	});

	it('lässt das Jahr weg, wenn keins bekannt ist', () => {
		expect(
			buildFigureLabel({
				ebeneLabel: 'Kiez',
				jahr: null,
				repeatElection: false,
				aktivePartei: null
			})
		).toBe('Karte der stärksten Partei je Gebiet, Ebene Kiez');
	});

	it('EN: Sieger-Modus, Partei-Modus, Wiederholungswahl-Hinweis', () => {
		expect(
			buildFigureLabel(
				{ ebeneLabel: 'Kiez', jahr: 2023, repeatElection: false, aktivePartei: null },
				{ locale: 'en' }
			)
		).toBe('Map of the leading party by area, level Kiez, 2023');
		expect(
			buildFigureLabel(
				{ ebeneLabel: 'Kiez', jahr: 2023, repeatElection: true, aktivePartei: 'SPD' },
				{ locale: 'en' }
			)
		).toBe('Map: SPD share by area, level Kiez, 2023 (repeat election)');
	});
});

describe('buildAnsichtAnnouncement (Review-Fund #6)', () => {
	it('Gewinner-Tab', () => {
		expect(buildAnsichtAnnouncement(null)).toBe('Ansicht: Stärkste Partei');
	});

	it('Partei-Tab nennt die Partei', () => {
		expect(buildAnsichtAnnouncement('CDU')).toBe('Ansicht: Anteil CDU');
	});

	it('EN: Gewinner-Tab und Partei-Tab', () => {
		expect(buildAnsichtAnnouncement(null, { locale: 'en' })).toBe('View: Leading party');
		expect(buildAnsichtAnnouncement('CDU', { locale: 'en' })).toBe('View: CDU share');
	});
});

describe('buildWinnerTableColumns', () => {
	it('liefert Gebiet/Partei/Anteil-Spalten', () => {
		const columns = buildWinnerTableColumns();
		expect(columns.map((c) => c.key)).toEqual(['gebiet', 'partei', 'anteil']);
	});

	it('EN: übersetzt die Spalten-Labels', () => {
		const columns = buildWinnerTableColumns({ locale: 'en' });
		expect(columns.map((c) => c.label)).toEqual(['Area', 'Party', 'Share']);
	});

	it('Partei-Spalte zeigt „Sonstige"/„Other" nur in der Anzeige, sortiert aber am rohen Datenschlüssel', () => {
		const columns = buildWinnerTableColumns({ locale: 'en' });
		const parteiColumn = columns.find((c) => c.key === 'partei')!;
		expect(parteiColumn.accessor({ gebiet: 'A', partei: 'Sonstige', anteil: 0.1 })).toBe(
			'Sonstige'
		);
		expect(parteiColumn.format?.('Sonstige')).toBe('Other');
	});
});
