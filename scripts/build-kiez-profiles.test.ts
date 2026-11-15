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

describe('SYSTEM_PROMPT Grün und ÖPNV (NAV-108)', () => {
	it('verlangt die Senats-Klassen der Grünversorgung wörtlich', () => {
		expect(SYSTEM_PROMPT).toMatch(/gruenversorgung[^\n]*gut\/mittel\/schlecht/);
		expect(SYSTEM_PROMPT).toMatch(/Der Senat stuft die Grünversorgung als/);
	});
	it('trennt Grünversorgung und Grün-&-Hitze-Score', () => {
		expect(SYSTEM_PROMPT).toMatch(/kein bloßes „Grün“/);
	});
	it('verbietet eigene Klassen für die Haltestellendichte und erfundene Verkehrsmittel', () => {
		expect(SYSTEM_PROMPT).toMatch(/Haltestellendichte[^\n]*keine eigene Klasse/);
		expect(SYSTEM_PROMPT).toMatch(/Verkehrsmittel[^\n]*nur[^\n]*Halte/);
	});
});
