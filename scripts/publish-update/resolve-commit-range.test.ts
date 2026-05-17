import { describe, expect, it } from 'vitest';
import { parseRangeArgs } from './resolve-commit-range.js';

describe('parseRangeArgs', () => {
	it('git-range expression bleibt untouched', () => {
		expect(parseRangeArgs(['HEAD~7..HEAD'])).toEqual({
			kind: 'range',
			expr: 'HEAD~7..HEAD'
		});
		expect(parseRangeArgs(['abc1234..def5678'])).toEqual({
			kind: 'range',
			expr: 'abc1234..def5678'
		});
	});

	it('--since=YYYY-MM-DD wird in range gewandelt', () => {
		const r = parseRangeArgs(['--since=2026-05-09']);
		expect(r).toEqual({
			kind: 'range',
			expr: '--since=2026-05-09'
		});
	});

	it('--commit=<sha> = single-commit', () => {
		expect(parseRangeArgs(['--commit=abc1234'])).toEqual({
			kind: 'commit',
			sha: 'abc1234'
		});
	});

	it('default ohne args: --since=letzte 24h', () => {
		const r = parseRangeArgs([]);
		expect(r.kind).toBe('range');
		if (r.kind !== 'range') throw new Error('unreachable');
		expect(r.expr).toMatch(/^--since=\d{4}-\d{2}-\d{2}$/);
	});

	it('mehrere args: nimmt erstes erkanntes', () => {
		expect(parseRangeArgs(['HEAD~3..HEAD', '--ignored'])).toEqual({
			kind: 'range',
			expr: 'HEAD~3..HEAD'
		});
	});

	it('bail bei leerem oder invalidem range', () => {
		expect(parseRangeArgs(['--commit='])).toEqual({
			kind: 'error',
			message: '--commit= requires a sha'
		});
		expect(parseRangeArgs(['--since='])).toEqual({
			kind: 'error',
			message: '--since= requires YYYY-MM-DD'
		});
		expect(parseRangeArgs(['--since=invalid-date'])).toEqual({
			kind: 'error',
			message: '--since= requires YYYY-MM-DD'
		});
	});
});
