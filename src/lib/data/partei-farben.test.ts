import { describe, expect, it } from 'vitest';
import {
	PARTEI_FARBEN,
	parteiColor,
	parteiPattern,
	contrastRatio,
	wcagAaPasses,
	INSPECTOR_BG,
	type ParteiKurzname
} from './partei-farben.js';

describe('PARTEI_FARBEN', () => {
	it('definiert alle 10 seed-Parteien', () => {
		const required: ParteiKurzname[] = [
			'SPD',
			'CDU',
			'CSU',
			'GRÜNE',
			'FDP',
			'AfD',
			'Die Linke',
			'BSW',
			'FREIE WÄHLER',
			'Sonstige'
		];
		for (const k of required) {
			expect(PARTEI_FARBEN[k]).toBeDefined();
			expect(PARTEI_FARBEN[k].hex).toMatch(/^#[0-9A-F]{6}$/i);
		}
	});

	it('Pattern-Variants verfügbar pro Partei (Achromatopsie-Fallback)', () => {
		for (const k of Object.keys(PARTEI_FARBEN) as ParteiKurzname[]) {
			expect(['solid', 'stripes', 'dots', 'diagonal', 'diagonal-reverse']).toContain(
				PARTEI_FARBEN[k].pattern
			);
		}
	});

	it('keine Color-Kollision zwischen Major-Parteien', () => {
		const major: ParteiKurzname[] = ['SPD', 'CDU', 'GRÜNE', 'FDP', 'AfD', 'Die Linke', 'BSW'];
		const seen = new Set<string>();
		for (const k of major) {
			expect(seen.has(PARTEI_FARBEN[k].hex.toLowerCase())).toBe(false);
			seen.add(PARTEI_FARBEN[k].hex.toLowerCase());
		}
	});

	it('höchstens eine Major-Partei nutzt das texturlose "solid"-Pattern (Achromatopsie-Regression)', () => {
		// 'solid' ist eine reine Flächenfarbe ohne innere Struktur -- zwei
		// 'solid'-Parteien sind für Achromatopsie schlechter unterscheidbar als
		// zwei Parteien mit demselben texturierten Pattern (stripes/dots/
		// diagonal behalten wenigstens eine sichtbare Struktur).
		const major: ParteiKurzname[] = ['SPD', 'CDU', 'GRÜNE', 'FDP', 'AfD', 'Die Linke', 'BSW'];
		const solidCount = major.filter((k) => PARTEI_FARBEN[k].pattern === 'solid').length;
		expect(solidCount).toBeLessThanOrEqual(1);
	});

	it('Review-Fund #16: unter den FINDER_PARTIES ist jedes Pattern höchstens 2x vergeben, ein Doppel muss sich in Streifen-Richtung/-Form unterscheiden', () => {
		// FINDER_PARTIES statt Object.keys(PARTEI_FARBEN): Boundary begrenzt die
		// Eindeutigkeits-Anforderung auf die 7 Tab-/Small-Multiples-Parteien.
		const finderParties: ParteiKurzname[] = [
			'SPD',
			'CDU',
			'GRÜNE',
			'FDP',
			'AfD',
			'Die Linke',
			'BSW'
		];
		const byPattern = new Map<string, ParteiKurzname[]>();
		for (const k of finderParties) {
			const list = byPattern.get(PARTEI_FARBEN[k].pattern) ?? [];
			list.push(k);
			byPattern.set(PARTEI_FARBEN[k].pattern, list);
		}
		for (const [pattern, parteien] of byPattern) {
			expect(parteien.length, `Pattern "${pattern}" bei ${parteien.join('/')}`).toBeLessThanOrEqual(
				2
			);
		}
		// FDP ('diagonal') und Die Linke ('diagonal-reverse') sind dieselbe Form
		// (45°-Streifen) in Gegenrichtung -- explizit als verschieden geprüft,
		// die frühere Kollision (beide 'diagonal') ist damit aufgelöst.
		expect(PARTEI_FARBEN.FDP.pattern).toBe('diagonal');
		expect(PARTEI_FARBEN['Die Linke'].pattern).toBe('diagonal-reverse');
		expect(PARTEI_FARBEN.FDP.pattern).not.toBe(PARTEI_FARBEN['Die Linke'].pattern);
		// Bestands-Doppel bleiben unangetastet (Defer in deferred-work.md).
		expect(PARTEI_FARBEN.CDU.pattern).toBe('stripes');
		expect(PARTEI_FARBEN.AfD.pattern).toBe('stripes');
		expect(PARTEI_FARBEN['GRÜNE'].pattern).toBe('dots');
		expect(PARTEI_FARBEN.BSW.pattern).toBe('dots');
	});
});

describe('parteiColor', () => {
	it('liefert Hex für bekannte Partei', () => {
		expect(parteiColor('SPD')).toBe(PARTEI_FARBEN.SPD.hex);
		expect(parteiColor('Die Linke')).toBe(PARTEI_FARBEN['Die Linke'].hex);
	});

	it('fallback Sonstige für unbekannte', () => {
		expect(parteiColor('Tierschutzpartei')).toBe(PARTEI_FARBEN.Sonstige.hex);
	});

	it('case-insensitive lookup', () => {
		expect(parteiColor('spd')).toBe(PARTEI_FARBEN.SPD.hex);
		expect(parteiColor('GRÜne')).toBe(PARTEI_FARBEN['GRÜNE'].hex);
	});
});

describe('parteiPattern', () => {
	it('liefert Pattern-Token pro Partei', () => {
		expect(parteiPattern('SPD')).toBe(PARTEI_FARBEN.SPD.pattern);
	});

	it('fallback solid bei unbekannter', () => {
		expect(parteiPattern('XYZ')).toBe(PARTEI_FARBEN.Sonstige.pattern);
	});
});

describe('contrastRatio (WCAG)', () => {
	it('Schwarz auf Weiß = 21:1', () => {
		expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
	});

	it('Weiß auf Weiß = 1:1', () => {
		expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 2);
	});

	it('case-insensitive hex parsing', () => {
		expect(contrastRatio('#000', '#FFF')).toBeCloseTo(21, 1);
	});
});

describe('wcagAaPasses', () => {
	it('Schwarz/Weiß passes für large text + normal text', () => {
		expect(wcagAaPasses('#000', '#FFF', 'normal')).toBe(true);
		expect(wcagAaPasses('#000', '#FFF', 'large')).toBe(true);
	});

	it('niedriger Kontrast fails', () => {
		expect(wcagAaPasses('#777777', '#999999', 'normal')).toBe(false);
	});

	it('large-text-threshold (3:1) niedriger als normal (4.5:1)', () => {
		expect(wcagAaPasses('#666666', '#F5F3EA', 'large')).toBe(true);
		expect(wcagAaPasses('#999999', '#F5F3EA', 'normal')).toBe(false);
	});
});

describe('Partei-Farben WCAG-AA gegen Inspector-BG', () => {
	it('jede Partei-Farbe erfüllt 3:1 (large text) gegen INSPECTOR_BG', () => {
		for (const k of Object.keys(PARTEI_FARBEN) as ParteiKurzname[]) {
			const passes = wcagAaPasses(PARTEI_FARBEN[k].hex, INSPECTOR_BG, 'large');
			expect(passes, `${k} (${PARTEI_FARBEN[k].hex}) contrast vs ${INSPECTOR_BG}`).toBe(true);
		}
	});
});
