import { describe, expect, it } from 'vitest';
import { isKiezScoreLayer } from './kiez-score-layer.js';

// Textbereinigung (spec-textbereinigung-layer-texte.md, Review-Fund 2. Runde):
// geteilter Helper statt zweier unabhängiger `slug.startsWith('kiez-score-')`-
// Kopien in `/layer/[slug]/+page.svelte` und `map-legend.svelte`.

describe('isKiezScoreLayer', () => {
	it.each([
		'kiez-score-gesamt',
		'kiez-score-ruhe-luft',
		'kiez-score-gruen-hitze',
		'kiez-score-mobilitaet',
		'kiez-score-versorgung',
		'kiez-score-wohnschutz',
		'kiez-score-kultur',
		'kiez-score-kriminalitaet'
	])('erkennt "%s" als Kiez-Score-Layer', (slug) => {
		expect(isKiezScoreLayer(slug)).toBe(true);
	});

	it.each(['laerm-2023', 'bezirke', 'kiez-scoreboard', 'kiez-score', ''])(
		'"%s" ist KEIN Kiez-Score-Layer (negativ)',
		(slug) => {
			expect(isKiezScoreLayer(slug)).toBe(false);
		}
	);
});
