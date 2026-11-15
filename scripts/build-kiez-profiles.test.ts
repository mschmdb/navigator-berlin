import { describe, expect, it } from 'vitest';
import { SYSTEM_PROMPT } from './build-kiez-profiles.js';

describe('SYSTEM_PROMPT Ränge', () => {
	it('erklärt geteilte Ränge über rangGeteiltMit', () => {
		expect(SYSTEM_PROMPT).toContain('rangGeteiltMit');
		expect(SYSTEM_PROMPT).toMatch(/geteilter Platz/);
	});

	it('erlaubt Ordinalwörter nur bei ungeteiltem Rang', () => {
		expect(SYSTEM_PROMPT).toMatch(/Ordinalw[öo]rter[^\n]*nur[^\n]*ungeteilt/i);
	});

	it('nennt keine feste Gesamtzahl, sondern total', () => {
		expect(SYSTEM_PROMPT).not.toMatch(/von 143/);
	});
});
