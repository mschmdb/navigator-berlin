import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { kiezScore } from '$lib/server/db/schema/index.js';
import {
	fallbackNameFromSlug,
	readRegionDisplayNames,
	type RegionDisplayNames
} from '$lib/data/region-display-names.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import { buildWahlFallbackList } from '$lib/data/wahl-slug.js';
import {
	buildFeaturedScore,
	type HomeFeaturedScore
} from '$lib/components/home/internal/featured-score.js';
import {
	mapHomeUpdateEntry,
	type HomeUpdateTeaser
} from '$lib/content/updates/map-home-update-entry.js';

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

export type { HomeFeaturedScore } from '$lib/components/home/internal/featured-score.js';

export interface HomePageData {
	readonly topKieze: readonly HomeTopKiez[];
	readonly updates: readonly HomeUpdateTeaser[];
	/** Aktive Geo-Layer gesamt (MANIFEST). Derived statt hardcoded → bleibt nie stale. */
	readonly layerCount: number;
	/** Featured-Kiez (höchster Composite) mit Voll-Score für den Live-Ring; null ohne DB. */
	readonly featured: HomeFeaturedScore | null;
	/** Gesamtzahl der Wahlen (DB, sonst `buildWahlFallbackList()`-Fallback) für den
	 * Wahl-Teaser-Übersichtslink (i18n Block B2 Review-Fund: war hardcoded `23`). */
	readonly wahlCount: number;
}

/**
 * Featured-Kiez: der Kiez mit dem höchsten Composite. #102: Ring und Legende zeigen die
 * Werte aus `kiez_score`, also exakt die Zahlen der Rangliste und der Kiez-Seite. Der Link
 * öffnet die Karte am Kiez-Mittelpunkt; der Inspector zeigt dort den Punkt-Score der
 * Adresse, der vom Kiez-Wert abweichen darf (gewollt, Punkt statt Fläche).
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
		const profile = await getKiezProfile(getLocale(), r.slug, fetchFn);
		const displayName = profile.name || fallbackNameFromSlug(r.slug);
		return buildFeaturedScore(r, displayName, [profile.centroid[0], profile.centroid[1]]);
	} catch {
		return null;
	}
}

/**
 * Gesamtzahl der Wahlen für den „Alle N Wahlen"-Link (i18n Block B2
 * Review-Fund: die Zahl war zuvor hardcoded `23` in `home-wahl-teaser.svelte`).
 * DB-los identisch zum Fallback in `berlin-wahlen/+page.server.ts`.
 */
async function loadWahlCount(): Promise<number> {
	if (!process.env.DATABASE_URL) return buildWahlFallbackList().length;
	try {
		const { getWahlList } = await import('$lib/server/db/queries/wahl/get-wahl-list.js');
		const list = await getWahlList();
		return list.length;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[home] WARN: wahl count unavailable (${msg})\n`);
		return buildWahlFallbackList().length;
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
			displayName: names.kiez.get(r.slug) ?? fallbackNameFromSlug(r.slug),
			bezirkName: r.bezirkSlug
				? (names.bezirk.get(r.bezirkSlug) ?? fallbackNameFromSlug(r.bezirkSlug))
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

/**
 * i18n Block B2, Entscheidung Matze 26.09. 2A: `title_en`/`summary_en` wo
 * vorhanden, sonst DE-Fallback -- siehe `mapHomeUpdateEntry` (eigenes,
 * getestetes Modul: SvelteKit erlaubt in `+page.server.ts` nur
 * `load`/`prerender`/etc. als Export, ein zusätzlicher Named-Export lässt
 * den Build fehlschlagen).
 */
async function loadUpdates(locale: Locale): Promise<HomeUpdateTeaser[]> {
	try {
		const { loadUpdatesFromModules } = await import('$lib/content/updates/load-updates.js');
		const entries = loadUpdatesFromModules(UPDATE_MODULES);
		return entries.slice(0, UPDATES_TEASER).map((e) => mapHomeUpdateEntry(e, locale));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[home] WARN: updates unavailable (${msg})\n`);
		return [];
	}
}

export const load: PageServerLoad = async ({ fetch }) => {
	const locale = getLocale();
	const names = await readRegionDisplayNames();
	const [topKieze, updates, layerCount, featured, wahlCount] = await Promise.all([
		loadTopKieze(names),
		loadUpdates(locale),
		loadLayerCount(),
		loadFeatured(fetch),
		loadWahlCount()
	]);
	const data: HomePageData = { topKieze, updates, layerCount, featured, wahlCount };
	return data;
};
