/**
 * Prompt `compare_kieze` (DE+EN): „Vergleiche diese zwei Kieze".
 *
 * Bittet das LLM, zweimal `get_kiez_profile` aufzurufen + Dimensionen zu
 * vergleichen.
 */

import type { PromptLocale, PromptTemplate } from './prompt-types.js';

function render(args: Record<string, string | undefined>, locale: PromptLocale): string {
	const slugA = args.slug_a ?? '<kiez-a>';
	const slugB = args.slug_b ?? '<kiez-b>';
	if (locale === 'en') {
		return [
			'Compare two Berlin Kieze (LOR Bezirksregionen) side by side.',
			'',
			`Kiez A: ${slugA}`,
			`Kiez B: ${slugB}`,
			'',
			'Procedure:',
			'1. Call get_kiez_profile for both slugs.',
			'2. Compare population, area, and Bezirk membership.',
			'3. List the data sources used for each Kiez (data_sources field).',
			'4. Note where data is missing for one Kiez but present for the other.',
			'5. Cite source, updated_at, license for every comparative claim.'
		].join('\n');
	}
	return [
		'Vergleiche zwei Berliner Kieze (LOR-Bezirksregionen) nebeneinander.',
		'',
		`Kiez A: ${slugA}`,
		`Kiez B: ${slugB}`,
		'',
		'Vorgehen:',
		'1. Rufe get_kiez_profile für beide Slugs auf.',
		'2. Vergleiche Einwohnerzahl, Fläche, Bezirks-Zugehörigkeit.',
		'3. Liste die genutzten Datenquellen pro Kiez (Feld data_sources).',
		'4. Markiere, wo ein Datensatz für einen Kiez vorhanden ist, für den anderen aber fehlt.',
		'5. Zitiere bei jeder vergleichenden Aussage source, updated_at und license.',
		'',
		'Vermeide pauschale Wertungen oder Rankings ohne Beleg. Bleib sachlich.'
	].join('\n');
}

export const compareKiezePrompt: PromptTemplate = {
	name: 'compare_kieze',
	description:
		'Compare two Berlin Kieze (LOR Bezirksregionen) by slug using get_kiez_profile, with cited differences across population, area, and data coverage.',
	arguments: [
		{ name: 'slug_a', description: 'Slug of the first Kiez.', required: true },
		{ name: 'slug_b', description: 'Slug of the second Kiez.', required: true }
	],
	render
};
