/**
 * Prompt `explain_layer` (DE+EN): „Erkläre den Layer X".
 *
 * Bittet das LLM, `get_layer_metadata` aufzurufen + die Methodik + Lizenz +
 * Update-Frequenz für Laien zu erklären.
 */

import type { PromptLocale, PromptTemplate } from './prompt-types.js';

function render(args: Record<string, string | undefined>, locale: PromptLocale): string {
	const slug = args.slug ?? '<layer-slug>';
	if (locale === 'en') {
		return [
			`Explain the data layer "${slug}" of navigator.berlin to a non-expert reader.`,
			'',
			'Procedure:',
			'1. Call get_layer_metadata with the slug.',
			'2. State the source authority, license, and last update.',
			'3. Summarize the methodology in plain language: what is measured, at which spatial level, and which simplifications were applied.',
			'4. Name known coverage gaps or omissions if present.',
			'5. Always include source URL and license URL so the reader can verify.'
		].join('\n');
	}
	return [
		`Erkläre den Datenlayer "${slug}" von navigator.berlin für eine fachfremde Leserin.`,
		'',
		'Vorgehen:',
		'1. Rufe get_layer_metadata mit dem Slug auf.',
		'2. Nenne Herausgeber, Lizenz und letzten Stand.',
		'3. Fasse die Methodik laienverständlich zusammen: was wird gemessen, auf welcher Aggregationsebene, welche Vereinfachungen.',
		'4. Benenne bekannte Datenlücken oder Auslassungen, wenn vorhanden.',
		'5. Liefere immer source_url und license_url, damit die Leserin nachprüfen kann.'
	].join('\n');
}

export const explainLayerPrompt: PromptTemplate = {
	name: 'explain_layer',
	description:
		'Explain a single navigator.berlin data layer (by slug) to a non-expert: source, license, methodology, gaps, citations.',
	arguments: [
		{ name: 'slug', description: 'Layer slug, e.g. `laerm-2023` or `wohnlagen-2024`.', required: true }
	],
	render
};
