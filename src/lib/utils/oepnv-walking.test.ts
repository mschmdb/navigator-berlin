import { describe, it, expect } from 'vitest';
import {
	walkingDistanceM,
	walkingTimeMin,
	walkingSeverity,
	MAX_WALKING_DISTANCE_M,
	WALKING_SPEED_M_PER_MIN,
	DETOUR_FACTOR
} from './oepnv-walking.js';

describe('walkingDistanceM', () => {
	it('returns 0 for identical coordinates', () => {
		expect(walkingDistanceM(52.52, 13.405, 52.52, 13.405)).toBe(0);
	});

	it('applies detour factor 1.3 to crow-flight distance', () => {
		// Berlin: Frankfurter Tor ≈ 52.5159, 13.4544; Strausberger Platz ≈ 52.5187, 13.4178
		// Haversine ≈ 2475m; × 1.3 ≈ 3217m
		const d = walkingDistanceM(52.5159, 13.4544, 52.5187, 13.4178);
		expect(d).toBeGreaterThan(3100);
		expect(d).toBeLessThan(3350);
	});

	it('returns rounded integer meters', () => {
		const d = walkingDistanceM(52.5159, 13.4544, 52.5187, 13.4178);
		expect(Number.isInteger(d)).toBe(true);
	});

	it('handles short Berlin walking distance (~100m)', () => {
		// Nudge 0.0009° lat ≈ 100m
		const d = walkingDistanceM(52.52, 13.405, 52.5209, 13.405);
		// Haversine ≈ 100m, × 1.3 = 130m
		expect(d).toBeGreaterThan(120);
		expect(d).toBeLessThan(140);
	});

	it('handles long distance without overflow', () => {
		// Berlin to Hamburg ≈ 255km
		const d = walkingDistanceM(52.52, 13.405, 53.55, 9.99);
		expect(d).toBeGreaterThan(250_000);
		expect(d).toBeLessThan(400_000);
	});

	it('is symmetric A→B = B→A', () => {
		const a = walkingDistanceM(52.5159, 13.4544, 52.5187, 13.4178);
		const b = walkingDistanceM(52.5187, 13.4178, 52.5159, 13.4544);
		expect(a).toBe(b);
	});
});

describe('walkingTimeMin', () => {
	it('returns 0 for 0 meters', () => {
		expect(walkingTimeMin(0)).toBe(0);
	});

	it('rounds up partial minutes', () => {
		// 80 m/min → 81m = 2 min (ceil)
		expect(walkingTimeMin(81)).toBe(2);
		expect(walkingTimeMin(80)).toBe(1);
		expect(walkingTimeMin(1)).toBe(1);
	});

	it('computes 320m → 4 min (ceil)', () => {
		expect(walkingTimeMin(320)).toBe(4);
	});

	it('computes 600m threshold → 8 min (ceil 7.5)', () => {
		expect(walkingTimeMin(600)).toBe(8);
	});

	it('returns integer', () => {
		expect(Number.isInteger(walkingTimeMin(523))).toBe(true);
	});
});

describe('walkingSeverity', () => {
	it('classifies ≤300m as success (sehr nah)', () => {
		expect(walkingSeverity(0)).toBe('success');
		expect(walkingSeverity(120)).toBe('success');
		expect(walkingSeverity(300)).toBe('success');
	});

	it('classifies 301-500m as success-soft (gut erreichbar)', () => {
		expect(walkingSeverity(301)).toBe('success-soft');
		expect(walkingSeverity(400)).toBe('success-soft');
		expect(walkingSeverity(500)).toBe('success-soft');
	});

	it('classifies 501-600m as warning (Rand-Lage)', () => {
		expect(walkingSeverity(501)).toBe('warning');
		expect(walkingSeverity(600)).toBe('warning');
	});
});

describe('constants', () => {
	it('exposes MAX_WALKING_DISTANCE_M as 600', () => {
		expect(MAX_WALKING_DISTANCE_M).toBe(600);
	});

	it('exposes WALKING_SPEED_M_PER_MIN as 80', () => {
		expect(WALKING_SPEED_M_PER_MIN).toBe(80);
	});

	it('exposes DETOUR_FACTOR as 1.3', () => {
		expect(DETOUR_FACTOR).toBe(1.3);
	});
});
