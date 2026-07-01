import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { kiezScore } from '$lib/server/db/schema/index.js';
import { readRegionDisplayNames, type RegionDisplayNames } from '$lib/data/region-display-names.js';

// SSR statt prerender: Die Hitze-Subdomain reroutet `/` → `/hitze` per reroute-Hook.
// Prerenderte Seiten werden als statische Assets ausgeliefert und durchlaufen den
// reroute-Hook NICHT (SvelteKit-Docs). Damit der Host-basierte Reroute auf `/` greift,
// muss die Homepage serverseitig gerendert werden. Load ist soft (leere Arrays ohne DB).
export const prerender = false;

/**
 * Story 2.11: Hero-Landing-Move auf „/".
 *
 * Atlas-Page-Tree wurde nach `/explore` verschoben (Memory
 * `project_atlas_explore_route`). „/" ist SSR-Hero-Landing mit
 * redaktionellen Slots; Welcome-Overlay verworfen.
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

/** Voll-Score eines Featured-Kiez für den Live-Ring auf der Landing (Story Home-Modernize). */
export interface HomeFeaturedScore {
	readonly slug: string;
	readonly displayName: string;
	readonly composite: number | null;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
	/** Deep-Link auf die Karte am Kiez-Centroid (address=lng,lat&q=name); Fallback /explore. */
	readonly exploreHref: string;
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
	/** Featured-Kiez (höchster Composite) mit Voll-Score für den Live-Ring; null ohne DB. */
	readonly featured: HomeFeaturedScore | null;
}

/**
 * Featured-Kiez: höchster Composite wählt WELCHER Kiez gezeigt wird; der angezeigte Score wird
 * dann EXAKT so berechnet wie der explore-Inspector beim Deep-Link (getKiezScore am Centroid +
 * Mobility-Override), damit Home-Ring und Karten-Inspector denselben Wert zeigen (kein
 * Aggregat-vs-Punkt-Mismatch). Coords auf 5 Dezimalen gerundet = identische Inputs wie die URL.
 */
async function loadFeatured(fetchFn: typeof fetch): Promise<HomeFeaturedScore | null> {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getDb } = await import('$lib/server/db/index.js');
		const rows = await getDb()
			.select()
			.from(kiezScore)
			.orderBy(desc(sql`COALESCE(${kiezScore.composite}, -1)`))
			.limit(1);
		const r = rows[0];
		if (!r || typeof r.composite !== 'number') return null;

		const { getKiezProfile } = await import('$lib/data/get-kiez-profile.js');
		const { getLocale } = await import('$lib/paraglide/runtime.js');
		const profile = await getKiezProfile(getLocale(), r.slug, fetchFn);
		const displayName = profile.name || slugToDisplayName(r.slug);
		// Auf 5 Dezimalen runden = exakt die Coords, die im /explore?address=lng,lat landen.
		const lng = Number(profile.centroid[0].toFixed(5));
		const lat = Number(profile.centroid[1].toFixed(5));

		const { getOepnvStopIndex } = await import('$lib/data/get-oepnv-stop-index.js');
		const { findAllNearestStops } =
			await import('$lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.js');
		const { getKiezScore } = await import('$lib/data/get-kiez-score.js');
		const stopIndex = await getOepnvStopIndex(fetchFn);
		const stops = findAllNearestStops({ lat, lng }, stopIndex, 1000);
		const override = {
			nearestStops: {
				ubahn: stops.ubahn ? { distanceM: stops.ubahn.distanceM } : null,
				sbahn: stops.sbahn ? { distanceM: stops.sbahn.distanceM } : null,
				tram: stops.tram ? { distanceM: stops.tram.distanceM } : null,
				bus: stops.bus ? { distanceM: stops.bus.distanceM } : null
			}
		};
		const score = await getKiezScore(lat, lng, fetchFn, override);
		if (!score) return null;
		const dim = (d: string): number | null =>
			score.dimensions.find((x) => x.dimension === d)?.value ?? null;

		return {
			slug: r.slug,
			displayName,
			composite: score.overall ?? null,
			ruheLuft: dim('ruhe-luft'),
			gruenHitze: dim('gruen-hitze'),
			mobilitaet: dim('mobilitaet'),
			versorgung: dim('versorgung'),
			wohnschutz: dim('wohnschutz'),
			exploreHref: `/explore?address=${lng.toFixed(5)},${lat.toFixed(5)}&q=${encodeURIComponent(displayName)}`
		};
	} catch {
		return null;
	}
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

async function loadTopKieze(names: RegionDisplayNames): Promise<HomeTopKiez[]> {
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
			displayName: names.kiez.get(r.slug) ?? slugToDisplayName(r.slug),
			bezirkName: r.bezirkSlug
				? (names.bezirk.get(r.bezirkSlug) ?? slugToDisplayName(r.bezirkSlug))
				: null,
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

export const load: PageServerLoad = async ({ fetch }) => {
	const names = await readRegionDisplayNames();
	const [topKieze, updates, layerCount, featured] = await Promise.all([
		loadTopKieze(names),
		loadUpdates(),
		loadLayerCount(),
		loadFeatured(fetch)
	]);
	const data: HomePageData = { topKieze, updates, layerCount, featured };
	return data;
};
