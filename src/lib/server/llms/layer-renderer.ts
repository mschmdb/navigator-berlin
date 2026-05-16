/**
 * Story 2.8 AC-3 / T1.3: Layer-Detail-Markdown-Renderer für /llms-full.txt.
 *
 * Pure function: nimmt typisierte Layer-Metadata (aus MANIFEST.json plus
 * LayerExplain) und liefert einen Markdown-Block pro Layer.
 *
 * Format:
 * - H2 `## Layer {Name}`
 * - Steckbrief mit Slug, Lizenz, Stand, Bundle, Feature-Count
 * - H3 `Beschreibung` (long-Description)
 * - H3 `Werte-Skala` (optional, valueScaleExplain)
 *
 * Stigma-Lint applied (Memory `feedback_no_lebenswert`).
 */

import { lintForBannedWords } from '$lib/seo/banned-words.js';

export interface LayerRenderInput {
	readonly slug: string;
	readonly name: string;
	readonly short: string;
	readonly long: string;
	readonly unit?: string;
	readonly valueScaleExplain?: string;
	readonly license: string;
	readonly sourceUpdatedAt: string;
	readonly bundleGroup: string;
	readonly featureCount: number;
}

const NUMBER_DE = new Intl.NumberFormat('de-DE');

function formatDate(iso: string): string {
	return iso.slice(0, 10);
}

export function renderLayerMarkdown(input: LayerRenderInput): string {
	const lines: string[] = [];
	lines.push(`## Layer ${input.name}`);
	lines.push('');
	lines.push(`- Slug: ${input.slug}`);
	lines.push(`- Kurz: ${input.short}`);
	lines.push(`- Bundle: ${input.bundleGroup}`);
	lines.push(`- Lizenz: ${input.license}`);
	lines.push(`- Stand: ${formatDate(input.sourceUpdatedAt)}`);
	lines.push(`- Features: ${NUMBER_DE.format(input.featureCount)}`);
	if (input.unit) {
		lines.push(`- Einheit: ${input.unit}`);
	}
	lines.push('');

	lines.push('### Beschreibung');
	lines.push('');
	lines.push(input.long);
	lines.push('');

	if (input.valueScaleExplain) {
		lines.push('### Werte-Skala');
		lines.push('');
		lines.push(input.valueScaleExplain);
		lines.push('');
	}

	const raw = lines.join('\n');
	const { cleaned } = lintForBannedWords(raw);
	return cleaned;
}
