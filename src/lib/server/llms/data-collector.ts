/**
 * Story 2.8 AC-4 / User-Decision Variante B: On-the-Fly-Daten-Sammlung
 * für /llms.txt + /llms-full.txt.
 *
 * Konsumiert Postgres-Aggregat-Tabellen (Story 2.0) plus Manifest (für Layer-
 * Metadata) und liefert pre-rendered Markdown-Blöcke pro Page-Type, die der
 * Builder dann concatiniert.
 *
 * Graceful DB-Fallback: wenn `DATABASE_URL` fehlt oder DB-Connection failt,
 * werden leere Listen + Warning-Log zurückgegeben. Phase-1-Realität:
 * data:aggregate wird in CI nicht laufen, llms.txt soll trotzdem buildable sein
 * (mit reduziertem Inhalt = nur Static + Layer aus Manifest).
 *
 * Stigma-Lint passiert in den Renderern selbst.
 */

import type { Manifest } from '$lib/data/types.js';
import { getBezirkStats } from '$lib/server/db/queries/get-bezirk-stats.js';
import { getKiezStats } from '$lib/server/db/queries/get-kiez-stats.js';
import { getBezirkScore } from '$lib/server/db/queries/get-bezirk-score.js';
import { getKiezScore } from '$lib/server/db/queries/get-kiez-score.js';
import { renderBezirkMarkdown } from './bezirk-renderer.js';
import { renderKiezMarkdown } from './kiez-renderer.js';
import { renderLayerMarkdown } from './layer-renderer.js';
import {
	getLayerExplainEntry,
	type LayerExplain
} from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import type {
	LlmsBezirkEntry,
	LlmsKiezEntry,
	LlmsLayerEntry
} from '$lib/seo/llms-builder.js';

export interface LlmsCollectedData {
	readonly bezirke: readonly LlmsBezirkEntry[];
	readonly kieze: readonly LlmsKiezEntry[];
	readonly layer: readonly LlmsLayerEntry[];
}

/**
 * 12 Berliner Bezirke. Hartkodiert weil die Bezirksgrenzen sich nicht ändern
 * und das Manifest nur das `bezirke`-GeoJSON-Layer kennt, nicht die einzelnen
 * Slugs als Page-Routes. Story 2.3 (Bezirks-Page) zementiert dieselbe Liste.
 *
 * Einwohner + Fläche werden aus dem Bezirks-GeoJSON-Feature gelesen, der DB-
 * Aggregat ist optional (falls fehlt = Markdown ohne Cluster-Daten).
 */
const BERLIN_BEZIRK_SLUGS: readonly string[] = [
	'mitte',
	'friedrichshain-kreuzberg',
	'pankow',
	'charlottenburg-wilmersdorf',
	'spandau',
	'steglitz-zehlendorf',
	'tempelhof-schoeneberg',
	'neukoelln',
	'treptow-koepenick',
	'marzahn-hellersdorf',
	'lichtenberg',
	'reinickendorf'
];

const BEZIRK_DISPLAY_NAMES: Record<string, string> = {
	mitte: 'Mitte',
	'friedrichshain-kreuzberg': 'Friedrichshain-Kreuzberg',
	pankow: 'Pankow',
	'charlottenburg-wilmersdorf': 'Charlottenburg-Wilmersdorf',
	spandau: 'Spandau',
	'steglitz-zehlendorf': 'Steglitz-Zehlendorf',
	'tempelhof-schoeneberg': 'Tempelhof-Schöneberg',
	neukoelln: 'Neukölln',
	'treptow-koepenick': 'Treptow-Köpenick',
	'marzahn-hellersdorf': 'Marzahn-Hellersdorf',
	lichtenberg: 'Lichtenberg',
	reinickendorf: 'Reinickendorf'
};

function tryGet<T>(loader: () => Promise<T>): Promise<T | null> {
	return loader().catch((err) => {
		// eslint-disable-next-line no-console
		console.warn('[llms-data-collector] DB-fetch failed, falling back to null:', err instanceof Error ? err.message : err);
		return null;
	});
}

async function collectBezirke(): Promise<LlmsBezirkEntry[]> {
	const out: LlmsBezirkEntry[] = [];
	for (const slug of BERLIN_BEZIRK_SLUGS) {
		const stats = await tryGet(() => getBezirkStats(slug));
		const score = await tryGet(() => getBezirkScore(slug));
		const name = BEZIRK_DISPLAY_NAMES[slug] ?? slug;
		const markdown = renderBezirkMarkdown({
			slug,
			name,
			einwohner: 0, // Bezirks-GeoJSON-Load out-of-scope für Phase 1 (extra fetch)
			flaecheHa: 0,
			stats,
			score,
			faq: []
		});
		out.push({ slug, name, markdown });
	}
	return out;
}

/**
 * Kiez-Slugs liest aus Postgres `kiez_stats`-Tabelle (Story 2.0 hat 143 BZR).
 * Bei fehlender DB = leere Liste (akzeptabel in CI).
 */
async function collectKieze(): Promise<LlmsKiezEntry[]> {
	const { getDb } = await import('$lib/server/db/index.js');
	const { kiezStats } = await import('$lib/server/db/schema/index.js');
	let rows: { slug: string; bezirkSlug: string }[] = [];
	try {
		const all = await getDb().select({ slug: kiezStats.slug, bezirkSlug: kiezStats.bezirkSlug }).from(kiezStats);
		rows = all;
	} catch (err) {
		// eslint-disable-next-line no-console
		console.warn('[llms-data-collector] kiez-stats list failed, empty list:', err instanceof Error ? err.message : err);
		return [];
	}

	const out: LlmsKiezEntry[] = [];
	for (const [i, row] of rows.entries()) {
		const stats = await tryGet(() => getKiezStats(row.slug));
		const score = await tryGet(() => getKiezScore(row.slug));
		const name = row.slug
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
		const bezirkName = BEZIRK_DISPLAY_NAMES[row.bezirkSlug] ?? row.bezirkSlug;
		const markdown = renderKiezMarkdown({
			slug: row.slug,
			name,
			bezirkName,
			bezirkSlug: row.bezirkSlug,
			einwohner: 0,
			flaecheHa: 0,
			stats,
			score,
			faq: []
		});
		// Ranking: bis Story 2.9a Scores liefert, sortieren wir alphabetisch nach Bezirks-Alphabet
		const topRank = score?.composite !== undefined ? -score.composite : i;
		out.push({ slug: row.slug, name, bezirkSlug: row.bezirkSlug, markdown, topRank });
	}
	return out;
}

function explainForLayer(slug: string): LayerExplain | null {
	const exp = getLayerExplainEntry(slug);
	if (!exp.short && !exp.long) return null;
	return exp;
}

function humanizeSlug(slug: string): string {
	return slug
		.split('-')
		.map((p) => (p.length <= 4 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1)))
		.join(' ');
}

function collectLayer(manifest: Manifest): LlmsLayerEntry[] {
	const out: LlmsLayerEntry[] = [];
	for (const layer of manifest.layers) {
		const exp = explainForLayer(layer.slug);
		const name = exp?.short ? humanizeSlug(layer.slug) : humanizeSlug(layer.slug);
		const short = exp?.short ?? `Datenebene ${layer.slug}`;
		const long = exp?.long ?? exp?.short ?? `Datenebene ${layer.slug}.`;
		const markdown = renderLayerMarkdown({
			slug: layer.slug,
			name,
			short,
			long,
			unit: exp?.unit,
			valueScaleExplain: exp?.valueScaleExplain,
			license: layer.license,
			sourceUpdatedAt: layer.sourceUpdatedAt ?? layer.fetchedAt,
			bundleGroup: layer.bundleGroup,
			featureCount: layer.featureCount
		});
		out.push({ slug: layer.slug, name, short, markdown });
	}
	return out;
}

/**
 * Sammelt alle Daten für /llms.txt + /llms-full.txt zur Prerender-Zeit.
 *
 * Graceful: DB-Failures gehen als leere Listen durch, das Build bricht NICHT.
 * Aufrufer kann auf leere Listen reagieren (z.B. minimaler llms.txt mit nur
 * Static + Layer-Section).
 */
export async function collectLlmsData(manifest: Manifest): Promise<LlmsCollectedData> {
	let bezirke: LlmsBezirkEntry[] = [];
	let kieze: LlmsKiezEntry[] = [];

	try {
		bezirke = await collectBezirke();
	} catch (err) {
		// eslint-disable-next-line no-console
		console.warn('[llms-data-collector] bezirke collection failed:', err instanceof Error ? err.message : err);
	}

	try {
		kieze = await collectKieze();
	} catch (err) {
		// eslint-disable-next-line no-console
		console.warn('[llms-data-collector] kieze collection failed:', err instanceof Error ? err.message : err);
	}

	const layer = collectLayer(manifest);

	return { bezirke, kieze, layer };
}
