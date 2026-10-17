import { describe, expect, it } from 'vitest';
import { isRedundantDescription } from './redundant-description.js';

describe('isRedundantDescription (#90, /daten)', () => {
	it.each([
		['Apotheke', 'Apotheke'],
		['S-Bahn-Stationen', 'S-Bahn-Station'],
		['Post', 'Post- oder Paketstelle'],
		['Spielplätze', 'Spielplatz']
	])('%s / %s gilt als Dopplung', (name, description) => {
		expect(isRedundantDescription(name, description)).toBe(true);
	});

	it.each([
		['Lärmbelastung 2023', 'Strategische Lärmkarte, Tag-Abend-Nacht-Pegel je Fassadenpunkt'],
		['Trinkbrunnen', 'Öffentliche Trinkbrunnen der Berliner Wasserbetriebe'],
		['Kitas', 'Kindertagesstätten mit Plätzen']
	])('%s / %s ergänzt etwas und bleibt', (name, description) => {
		expect(isRedundantDescription(name, description)).toBe(false);
	});

	it('leere Beschreibung gilt als Dopplung', () => {
		expect(isRedundantDescription('Apotheke', '  ')).toBe(true);
	});
});
