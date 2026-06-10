import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { kiezScore } from '$lib/server/db/schema/index.js';

export const prerender = true;

/**
 * Story 2.11: Hero-Landing-Move auf „/".
 *
 * Atlas-Page-Tree wurde nach `/explore` verschoben (Memory
 * `project_atlas_explore_route`). „/" wird jetzt statisch prerenderte
 * Hero-Landing mit redaktionellen Slots; Welcome-Overlay verworfen.
 *
 * Loader liefert Top-5-Kieze + Top-3-Updates damit Hero-Teaser-Slots
 * (home-top-kieze.svelte + home-updates-teaser.svelte) gefüllt sind. Beide
 * Datenquellen sind soft: bei DATABASE_URL-Fehlen → empty-arrays + die
 * Komponenten rendern sich selbst aus.
 */

const TOP_KIEZ_TEASER = 5;
const UPDATES_TEASER = 3;

export interface HomeTopKiez {
	readonly slug: string;
	readonly displayName: string;
	readonly bezirkName: string | null;
	readonly composite: number | null;
}

export interface HomeUpdateTeaser {
	readonly slug: string;
	readonly title: string;
	readonly date: string;
	readonly category: string;
	readonly summary: string;
}

export interface HomePageData {
	readonly topKieze: readonly HomeTopKiez[];
	readonly updates: readonly HomeUpdateTeaser[];
	/** Aktive Geo-Layer gesamt (MANIFEST). Derived statt hardcoded → bleibt nie stale. */
	readonly layerCount: number;
}

async function loadLayerCount(): Promise<number> {
	try {
		const { readFile } = await import('node:fs/promises');
		const { resolve } = await import('node:path');
		const raw = await readFile(resolve(process.cwd(), 'static/layers/MANIFEST.json'), 'utf-8');
		const manifest = JSON.parse(raw) as { layers: unknown[] };
		return manifest.layers.length;
	} catch {
		return 0;
	}
}

function slugToDisplayName(slug: string): string {
	return slug
		.split('-')
		.map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
		.join(' ');
}

async function loadTopKieze(): Promise<HomeTopKiez[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const { getDb } = await import('$lib/server/db/index.js');
		const rows = await getDb()
			.select()
			.from(kiezScore)
			.orderBy(desc(sql`COALESCE(${kiezScore.composite}, -1)`))
			.limit(TOP_KIEZ_TEASER);
		return rows.map((r) => ({
			slug: r.slug,
			displayName: slugToDisplayName(r.slug),
			bezirkName: r.bezirkSlug ? slugToDisplayName(r.bezirkSlug) : null,
			composite: typeof r.composite === 'number' ? r.composite : null
		}));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[home] WARN: kiez_score unavailable (${msg})\n`);
		return [];
	}
}

const UPDATE_MODULES = import.meta.glob('/_content/updates/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, unknown>;

async function loadUpdates(): Promise<HomeUpdateTeaser[]> {
	try {
		const { loadUpdatesFromModules } = await import('$lib/content/updates/load-updates.js');
		const entries = loadUpdatesFromModules(UPDATE_MODULES);
		return entries.slice(0, UPDATES_TEASER).map((e) => ({
			slug: e.slug,
			title: e.frontmatter.title_de,
			date: e.frontmatter.date,
			category: e.frontmatter.category,
			summary: e.frontmatter.summary_de
		}));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[home] WARN: updates unavailable (${msg})\n`);
		return [];
	}
}

export const load: PageServerLoad = async () => {
	const [topKieze, updates, layerCount] = await Promise.all([
		loadTopKieze(),
		loadUpdates(),
		loadLayerCount()
	]);
	const data: HomePageData = { topKieze, updates, layerCount };
	return data;
};
