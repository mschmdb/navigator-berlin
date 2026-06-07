/**
 * Story 2.8 AC-3 / T1.2: Kiez-Markdown-Renderer (LOR-Bezirksregion) für /llms-full.txt.
 *
 * Pure function: nimmt typisiertes `KiezStats` + `KiezScore` + Bezirk-Zuordnung
 * + FAQ-Entries und liefert einen Markdown-Block pro Kiez.
 *
 * Shape identisch zu Bezirks-Stats (8 Cluster) deshalb DRY via
 * `internal/aggregate-renderer.ts`. Unterschied: H2-Heading "## Kiez {Name}",
 * Steckbrief enthält Bezirks-Zuordnung.
 *
 * Stigma-Lint (Memory `feedback_no_lebenswert`) wird auf das End-Markdown
 * angewendet. MSS-Werte werden mit kategorisch-neutralem Wording + Disclaimer
 * gerendert (Memory `feedback_no_lebenswert` + Story 1.30).
 */

import type { KiezStats } from '$lib/server/db/queries/get-kiez-stats.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';
import { lintForBannedWords } from '$lib/seo/banned-words.js';
import {
	formatKm2,
	formatNumberDe,
	renderAggregateClusters,
	renderFaqSection,
	renderScoreSection,
	type FaqEntry
} from './internal/aggregate-renderer.js';

export type KiezFaqEntry = FaqEntry;

export interface KiezRenderInput {
	readonly slug: string;
	readonly name: string;
	readonly bezirkName: string;
	readonly bezirkSlug: string;
	readonly einwohner: number;
	readonly flaecheHa: number;
	readonly stats: KiezStats | null;
	readonly score: KiezScore | null;
	readonly faq: readonly KiezFaqEntry[];
	/** KI-Profil-Absätze (Story 11.6/11.9). Optional; leer → keine Sektion. */
	readonly profile?: readonly string[];
}

function renderHeader(input: KiezRenderInput, lines: string[]): void {
	lines.push(`## Kiez ${input.name}`);
	lines.push('');
	lines.push(`- Bezirk: ${input.bezirkName}`);
	lines.push(`- Einwohner: ${formatNumberDe(input.einwohner)}`);
	lines.push(`- Fläche: ${formatKm2(input.flaecheHa)}`);
	lines.push(`- Slug: ${input.slug}`);
	lines.push('');
}

function renderProfileSection(profile: readonly string[] | undefined, lines: string[]): void {
	if (!profile || profile.length === 0) return;
	lines.push('### Profil');
	lines.push('');
	for (const para of profile) {
		lines.push(para);
		lines.push('');
	}
}

export function renderKiezMarkdown(input: KiezRenderInput): string {
	const lines: string[] = [];
	renderHeader(input, lines);
	renderProfileSection(input.profile, lines);

	if (input.stats === null) {
		lines.push('_Hinweis: aktuell keine Cross-Layer-Aggregat-Daten verfügbar._');
		lines.push('');
	} else {
		// KiezStats hat denselben Shape wie BezirkStats (`bezirk_slug` ist FK aber
		// keine Cluster-Spalte) — Cast ist safe weil renderAggregateClusters nur
		// die 8 Cluster-Felder liest, nicht `slug`/`bezirkSlug`.
		renderAggregateClusters(input.stats, lines);
	}

	if (input.score) {
		renderScoreSection(input.score, 'Kiez-Score', lines);
	}

	renderFaqSection(input.faq, lines);

	const raw = lines.join('\n');
	const { cleaned } = lintForBannedWords(raw);
	return cleaned;
}
