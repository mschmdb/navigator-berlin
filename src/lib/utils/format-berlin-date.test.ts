import { describe, it, expect } from 'vitest';
import { formatBerlinDate } from './format-berlin-date.js';

describe('formatBerlinDate', () => {
	it('formatiert einen UTC-späten-Abend-Zeitstempel als den FOLGETAG in Berliner Ortszeit, unabhängig von der Prozess-TZ', () => {
		// 2026-09-20T23:55:55Z ist in Europe/Berlin (CEST, UTC+2) bereits
		// 21.09.2026 01:55:55 -- der Tag, an dem die Wahl war. Muss auch dann
		// "21.09.2026" liefern, wenn der Prozess selbst in UTC läuft (z.B.
		// Coolify-Default), nicht "20.09.2026".
		expect(formatBerlinDate('2026-09-20T23:55:55.000Z')).toBe('21.09.2026');
	});

	it('formatiert einen späten-Abend-UTC-Zeitstempel im Winter (CET, UTC+1) korrekt', () => {
		expect(formatBerlinDate('2026-01-15T23:30:00.000Z')).toBe('16.01.2026');
	});

	it('gibt den Roh-String zurück, wenn er kein valides Datum ist', () => {
		expect(formatBerlinDate('nicht-valide')).toBe('nicht-valide');
	});
});
