import { describe, it, expect } from 'vitest';
import { addressOverviewPrompt } from './address-overview.js';

describe('address-overview prompt', () => {
	it('hat snake_case-name', () => {
		expect(addressOverviewPrompt.name).toBe('address_overview');
	});

	it('rendert DE-Variante mit Adresse', () => {
		const rendered = addressOverviewPrompt.render(
			{ address: 'Pariser Platz 1, 10117 Berlin' },
			'de'
		);
		expect(rendered).toContain('Pariser Platz 1, 10117 Berlin');
		expect(rendered).toMatch(/cross_layer_query/);
		expect(rendered).toMatch(/Quellen|source/i);
		// no-em-dashes Guard
		expect(rendered).not.toContain('—');
	});

	it('rendert EN-Variante mit Adresse', () => {
		const rendered = addressOverviewPrompt.render(
			{ address: 'Brandenburg Gate, 10117 Berlin' },
			'en'
		);
		expect(rendered).toContain('Brandenburg Gate');
		expect(rendered).toMatch(/cross_layer_query/);
		expect(rendered).toMatch(/sources?/i);
	});

	it('keine „lebenswert"-Vokabel', () => {
		const de = addressOverviewPrompt.render({ address: 'X' }, 'de');
		const en = addressOverviewPrompt.render({ address: 'X' }, 'en');
		expect(de.toLowerCase()).not.toContain('lebenswert');
		expect(en.toLowerCase()).not.toContain('lebenswert');
	});

	it('snapshot DE', () => {
		expect(
			addressOverviewPrompt.render({ address: 'Pariser Platz 1, 10117 Berlin' }, 'de')
		).toMatchInlineSnapshot(`
			"Du analysierst eine Berliner Adresse für eine Nutzerin oder einen Nutzer.

			Adresse: Pariser Platz 1, 10117 Berlin

			Vorgehen:
			1. Rufe das Tool cross_layer_query mit den Koordinaten der Adresse auf.
			2. Wenn die Adresse zu einem Kiez gehört, ergänze mit get_kiez_profile.
			3. Fasse zusammen, was an der Adresse besonders ist: Lärm, Luftqualität, Grünversorgung, Mobilität, Wohnlage.
			4. Zitiere bei jeder Aussage die Quelle aus dem Tool-Output (source, updated_at, license).

			Bleib sachlich und beleg jede Bewertung mit einer Datenquelle."
		`);
	});

	it('snapshot EN', () => {
		expect(
			addressOverviewPrompt.render({ address: 'Brandenburg Gate, 10117 Berlin' }, 'en')
		).toMatchInlineSnapshot(`
			"You are analyzing a Berlin address for a user.

			Address: Brandenburg Gate, 10117 Berlin

			Procedure:
			1. Call the cross_layer_query tool with the address coordinates.
			2. If the address belongs to a Kiez, enrich with get_kiez_profile.
			3. Summarize what is notable about the address: noise, air quality, green coverage, mobility, residential quality.
			4. Cite the source for every claim using the tool output fields (source, updated_at, license)."
		`);
	});
});
