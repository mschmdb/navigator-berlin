import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { greyNames, partyName } from './namen';
import { ORDER } from '$lib/stories/wahl-quadrate/parteien';

afterEach(() => overwriteGetLocale(() => 'de'));

describe('namen', () => {
	it('nennt jede Partei auf Deutsch, Grau als „Grau“', () => {
		overwriteGetLocale(() => 'de');
		for (const k of ORDER) expect(partyName(k)).not.toBe('');
		expect(partyName('gruene')).toBe('Grüne');
		expect(partyName('rest')).toBe('Grau');
	});

	it('nennt die Parteien auf Englisch', () => {
		overwriteGetLocale(() => 'en');
		expect(partyName('linke')).toBe('The Left');
		expect(partyName('rest')).toBe('Grey');
	});

	it('liefert Namen für die Grau-Caption inklusive Freie Wähler und Tierschutzpartei', () => {
		overwriteGetLocale(() => 'de');
		const n = greyNames();
		expect(n.fw).toBe('Freie Wähler');
		expect(n.tier).toBe('Tierschutzpartei');
		expect(n.fdp).toBe('FDP');
	});
});
