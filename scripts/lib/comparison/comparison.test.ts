import { describe, it, expect } from 'vitest';
import { mean, median } from './comparison.js';

describe('mean', () => {
	it('berechnet den Mittelwert', () => {
		expect(mean([10, 20, 30])).toBe(20);
	});
	it('ignoriert null-Werte', () => {
		expect(mean([10, null, 30])).toBe(20);
	});
	it('rundet nicht selbst (roher Float)', () => {
		expect(mean([1, 2])).toBe(1.5);
	});
	it('liefert null bei leerer/komplett-null Liste', () => {
		expect(mean([])).toBeNull();
		expect(mean([null, null])).toBeNull();
	});
});

describe('median', () => {
	it('odd: mittlerer Wert', () => {
		expect(median([30, 10, 20])).toBe(20);
	});
	it('even: Mittel der beiden mittleren', () => {
		expect(median([10, 20, 30, 40])).toBe(25);
	});
	it('ignoriert null-Werte', () => {
		expect(median([10, null, 30, 20])).toBe(20);
	});
	it('single value', () => {
		expect(median([42])).toBe(42);
	});
	it('liefert null bei leerer Liste', () => {
		expect(median([])).toBeNull();
	});
});
