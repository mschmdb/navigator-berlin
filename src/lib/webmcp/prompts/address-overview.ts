/**
 * Prompt `address_overview` (DE+EN): „Was ist an dieser Adresse besonders?"
 *
 * Bittet das LLM, `cross_layer_query` + `get_kiez_profile` aufzurufen und
 * eine zitierte Zusammenfassung zu liefern.
 */

import type { PromptLocale, PromptTemplate } from './prompt-types.js';

function render(args: Record<string, string | undefined>, locale: PromptLocale): string {
	const address = args.address ?? '<address>';
	if (locale === 'en') {
		return [
			'You are analyzing a Berlin address for a user.',
			'',
			`Address: ${address}`,
			'',
			'Procedure:',
			'1. Call the cross_layer_query tool with the address coordinates.',
			'2. If the address belongs to a Kiez, enrich with get_kiez_profile.',
			'3. Summarize what is notable about the address: noise, air quality, green coverage, mobility, residential quality.',
			'4. Cite the source for every claim using the tool output fields (source, updated_at, license).'
		].join('\n');
	}
	return [
		'Du analysierst eine Berliner Adresse für eine Nutzerin oder einen Nutzer.',
		'',
		`Adresse: ${address}`,
		'',
		'Vorgehen:',
		'1. Rufe das Tool cross_layer_query mit den Koordinaten der Adresse auf.',
		'2. Wenn die Adresse zu einem Kiez gehört, ergänze mit get_kiez_profile.',
		'3. Fasse zusammen, was an der Adresse besonders ist: Lärm, Luftqualität, Grünversorgung, Mobilität, Wohnlage.',
		'4. Zitiere bei jeder Aussage die Quelle aus dem Tool-Output (source, updated_at, license).',
		'',
		'Bleib sachlich und beleg jede Bewertung mit einer Datenquelle.'
	].join('\n');
}

export const addressOverviewPrompt: PromptTemplate = {
	name: 'address_overview',
	description:
		'Summarize what is notable about a Berlin address (noise, air, green, mobility, housing) using cross_layer_query and get_kiez_profile, with full source citations.',
	arguments: [
		{
			name: 'address',
			description: 'Human-readable address string or display name.',
			required: true
		}
	],
	render
};
