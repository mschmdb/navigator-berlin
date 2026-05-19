import { describe, it, expect } from 'vitest';
import { diffHeaders, isDrift, formatDriftReport } from './schema-validator.js';

describe('schema-validator', () => {
	it('keine Drift bei identischen Headers', () => {
		const diff = diffHeaders(['a', 'b', 'c'], ['a', 'b', 'c']);
		expect(diff.missing).toEqual([]);
		expect(diff.added).toEqual([]);
		expect(diff.matched).toBe(3);
		expect(isDrift(diff)).toBe(false);
	});

	it('erkennt fehlende Spalten', () => {
		const diff = diffHeaders(['a', 'b', 'c'], ['a', 'b']);
		expect(diff.missing).toEqual(['c']);
		expect(diff.added).toEqual([]);
		expect(isDrift(diff)).toBe(true);
	});

	it('erkennt neu dazugekommene Spalten', () => {
		const diff = diffHeaders(['a', 'b'], ['a', 'b', 'd']);
		expect(diff.missing).toEqual([]);
		expect(diff.added).toEqual(['d']);
		expect(isDrift(diff)).toBe(true);
	});

	it('erkennt umbenannte Spalten als drop+add', () => {
		const diff = diffHeaders(['old'], ['new']);
		expect(diff.missing).toEqual(['old']);
		expect(diff.added).toEqual(['new']);
	});

	it('formatDriftReport listet beide Seiten', () => {
		const diff = diffHeaders(['x'], ['y']);
		const report = formatDriftReport(diff);
		expect(report).toContain('Missing');
		expect(report).toContain('- x');
		expect(report).toContain('Added');
		expect(report).toContain('+ y');
	});

	it('formatDriftReport bei No-Drift', () => {
		const diff = diffHeaders(['a'], ['a']);
		expect(formatDriftReport(diff)).toBe('No drift.');
	});
});
