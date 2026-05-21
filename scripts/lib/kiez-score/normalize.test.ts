import { describe, expect, it } from 'vitest';
import {
	normalizeOrdinal3,
	normalizeOrdinal4,
	normalizeMssStatus4,
	normalizeDistance,
	normalizeNumericInverted,
	normalizePresence,
	normalizeKitaProKind
} from './normalize.js';

describe('normalizeOrdinal3', () => {
	it('mapped gering → 100', () => {
		expect(normalizeOrdinal3('gering')).toBe(100);
	});
	it('mapped mittel → 50', () => {
		expect(normalizeOrdinal3('mittel')).toBe(50);
	});
	it('mapped hoch → 0 (höhere Belastung schlechter)', () => {
		expect(normalizeOrdinal3('hoch')).toBe(0);
	});
	it('liefert null für unbekannten Wert', () => {
		expect(normalizeOrdinal3('sehr hoch')).toBeNull();
		expect(normalizeOrdinal3('')).toBeNull();
		expect(normalizeOrdinal3(null)).toBeNull();
		expect(normalizeOrdinal3(42)).toBeNull();
	});
});

describe('normalizeOrdinal4', () => {
	it('mapped 4 Stufen aufsteigend (gering=0 .. sehr hoch=100)', () => {
		expect(normalizeOrdinal4('gering')).toBe(0);
		expect(normalizeOrdinal4('mittel')).toBe(33);
		expect(normalizeOrdinal4('hoch')).toBe(66);
		expect(normalizeOrdinal4('sehr hoch')).toBe(100);
	});
	it('akzeptiert Umweltatlas-Aliase (Story 1.22): schlecht=gering, gut=hoch, sehr gut=sehr hoch', () => {
		expect(normalizeOrdinal4('schlecht')).toBe(0);
		expect(normalizeOrdinal4('sehr schlecht')).toBe(0);
		expect(normalizeOrdinal4('niedrig')).toBe(0);
		expect(normalizeOrdinal4('gut')).toBe(66);
		expect(normalizeOrdinal4('sehr gut')).toBe(100);
	});
	it('liefert null für unbekannten Wert', () => {
		expect(normalizeOrdinal4('exzellent')).toBeNull();
		expect(normalizeOrdinal4(null)).toBeNull();
	});
});

describe('normalizeMssStatus4', () => {
	it('mapped MSS Status-Stufen (sehr niedrig=0, niedrig=33, mittel=66, hoch=100)', () => {
		expect(normalizeMssStatus4('sehr niedrig')).toBe(0);
		expect(normalizeMssStatus4('niedrig')).toBe(33);
		expect(normalizeMssStatus4('mittel')).toBe(66);
		expect(normalizeMssStatus4('hoch')).toBe(100);
	});
	it('liefert null für unbekannten / out-of-concept Wert', () => {
		expect(normalizeMssStatus4('Ausreißer')).toBeNull();
		expect(normalizeMssStatus4(undefined)).toBeNull();
	});
});

describe('normalizeDistance', () => {
	it('0m → 100', () => {
		expect(normalizeDistance(0, 1000)).toBe(100);
	});
	it('threshold/2 → 50', () => {
		expect(normalizeDistance(500, 1000)).toBe(50);
	});
	it('threshold → 0', () => {
		expect(normalizeDistance(1000, 1000)).toBe(0);
	});
	it('über threshold → 0 (clamp)', () => {
		expect(normalizeDistance(2000, 1000)).toBe(0);
	});
	it('null / negativ / NaN → null', () => {
		expect(normalizeDistance(null, 1000)).toBeNull();
		expect(normalizeDistance(-10, 1000)).toBeNull();
		expect(normalizeDistance(Number.NaN, 1000)).toBeNull();
	});
	it('threshold 0 oder negativ → null (Guard)', () => {
		expect(normalizeDistance(100, 0)).toBeNull();
		expect(normalizeDistance(100, -1)).toBeNull();
	});
});

describe('normalizeNumericInverted', () => {
	// PET-Hitzebelastung: geringe Temperatur = besser. bestAt=29 (komfortabel) → 100, worstAt=41 (extrem) → 0.
	it('Wert <= bestAt → 100', () => {
		expect(normalizeNumericInverted(29, 29, 41)).toBe(100);
		expect(normalizeNumericInverted(20, 29, 41)).toBe(100);
	});
	it('Wert >= worstAt → 0', () => {
		expect(normalizeNumericInverted(41, 29, 41)).toBe(0);
		expect(normalizeNumericInverted(45, 29, 41)).toBe(0);
	});
	it('linear invertiert dazwischen (Mittelpunkt → 50)', () => {
		expect(normalizeNumericInverted(35, 29, 41)).toBe(50);
	});
	it('liefert null für nicht-numerische / ungültige Eingaben', () => {
		expect(normalizeNumericInverted('36', 29, 41)).toBeNull();
		expect(normalizeNumericInverted(null, 29, 41)).toBeNull();
		expect(normalizeNumericInverted(Number.NaN, 29, 41)).toBeNull();
	});
	it('liefert null bei degeneriertem Band (worstAt <= bestAt)', () => {
		expect(normalizeNumericInverted(30, 41, 29)).toBeNull();
		expect(normalizeNumericInverted(30, 30, 30)).toBeNull();
	});
});

describe('normalizePresence', () => {
	it('true → 100, false → 0', () => {
		expect(normalizePresence(true)).toBe(100);
		expect(normalizePresence(false)).toBe(0);
	});
});

describe('normalizeKitaProKind', () => {
	it('>= bestAt → 100 (geclampt)', () => {
		expect(normalizeKitaProKind(0.35, 0.35)).toBe(100);
		expect(normalizeKitaProKind(0.5, 0.35)).toBe(100);
	});
	it('<= 0 → 0 (kein Platzangebot)', () => {
		expect(normalizeKitaProKind(0, 0.35)).toBe(0);
	});
	it('linear dazwischen', () => {
		expect(normalizeKitaProKind(0.175, 0.35)).toBe(50);
	});
	it('null (kein Nenner) → null', () => {
		expect(normalizeKitaProKind(null, 0.35)).toBeNull();
	});
	it('bestAt <= 0 → null', () => {
		expect(normalizeKitaProKind(0.2, 0)).toBeNull();
	});
});
