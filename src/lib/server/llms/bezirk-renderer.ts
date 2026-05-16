/**
 * Story 2.8 AC-3 / T1.1: Bezirks-Markdown-Renderer für /llms-full.txt.
 *
 * Pure function: nimmt ein typisiertes Aggregat aus `getBezirkStats` +
 * `getBezirkScore` + FAQ-Entries und liefert einen Markdown-Block pro Bezirk.
 *
 * Stigma-Lint (Memory `feedback_no_lebenswert`) wird auf das End-Markdown
 * angewendet: alle Treffer der Familie „lebenswert/lebensqualität" werden durch
 * `[REDAKTIONSFEHLER]` ersetzt. Aufrufer können `lintForBannedWords` separat
 * triggern um Hits in den Build-Log zu schreiben.
 *
 * Format-Konventionen:
 * - H2 `## Bezirk {Name}`
 * - Steckbrief als Bullet-Liste (Einwohner, Fläche, Slug)
 * - Cluster-Sektionen H3 (Lärm, Luft, Grün, Klima, Wohnen, ÖPNV, Bildung, Heritage)
 * - Quellen-Attribution per Wert: `(Quelle: {layer}, Stand {date})`
 * - Bezirks-Score-Section H3 mit Composite + 5 Dimensionen
 * - FAQ-Section H3, jeweils Q als Bold + A als Absatz
 * - Keine em-dashes (Memory), kein „lebenswert"
 */

import type { BezirkStats } from '$lib/server/db/queries/get-bezirk-stats.js';
import type { BezirkScore } from '$lib/server/db/queries/get-bezirk-score.js';
import { lintForBannedWords } from '$lib/seo/banned-words.js';
import {
	formatKm2,
	formatNumberDe,
	renderAggregateClusters,
	renderFaqSection,
	renderScoreSection,
	type FaqEntry
} from './internal/aggregate-renderer.js';

export type BezirkFaqEntry = FaqEntry;

export interface BezirkRenderInput {
	readonly slug: string;
	readonly name: string;
	readonly einwohner: number;
	readonly flaecheHa: number;
	readonly stats: BezirkStats | null;
	readonly score: BezirkScore | null;
	readonly faq: readonly BezirkFaqEntry[];
}

function renderHeader(input: BezirkRenderInput, lines: string[]): void {
	lines.push(`## Bezirk ${input.name}`);
	lines.push('');
	lines.push(`- Einwohner: ${formatNumberDe(input.einwohner)}`);
	lines.push(`- Fläche: ${formatKm2(input.flaecheHa)}`);
	lines.push(`- Slug: ${input.slug}`);
	lines.push('');
}

export function renderBezirkMarkdown(input: BezirkRenderInput): string {
	const lines: string[] = [];
	renderHeader(input, lines);

	if (input.stats === null) {
		lines.push('_Hinweis: aktuell keine Cross-Layer-Aggregat-Daten verfügbar._');
		lines.push('');
	} else {
		renderAggregateClusters(input.stats, lines);
	}

	if (input.score) {
		renderScoreSection(input.score, 'Bezirks-Score', lines);
	}

	renderFaqSection(input.faq, lines);

	const raw = lines.join('\n');
	const { cleaned } = lintForBannedWords(raw);
	return cleaned;
}
