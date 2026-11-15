import { error } from '@sveltejs/kit';
import { getKiezProfile } from '$lib/data/get-kiez-profile.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import { m } from '$lib/paraglide/messages.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { readEinwohnerStichtag } from '$lib/server/profile/meta-sources.js';
import { toCompositeRank, type CompositeRank } from '$lib/server/profile/composite-rank.js';
import type { NeighborEntry } from '$lib/data/kiez-neighbors.js';
import { getKiezNeighborLists } from '$lib/server/kiez-neighbors-index.js';
import { buildKiezContext } from '$lib/data/bezirk-kieze-view.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
import { bezirkSlugFromName } from '$lib/data/region-display-names.js';
import { loadBezirkRegions, loadKiezRegions } from '$lib/place/load-regions.server';
import { loadWahlBundle } from '$lib/place/wahl.server';
import type { RegionSnapshot } from '$lib/place/types';
import type { WahlBundle } from '$lib/place/wahl-types';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

/**
 * Kiezseite nach Themen (NAV-104/105): 143 vorgerenderte Seiten, je DE und `/en`.
 * Die Kapitel lesen gemessene Werte aller Kieze (Vergleich, Verteilung), die FAQ entsteht
 * aus denselben Werten. Prosa (`profileProse`) bleibt als eigener Einstiegstext.
 */
export const entries: EntryGenerator = async () => {
	const slugs = await readKiezSlugsFromGeoJson();
	return slugs.map((slug) => ({ slug }));
};

async function tryLoadKiezRank(slug: string) {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getKiezRank } = await import('$lib/server/db/queries/get-kiez-rank.js');
		return await getKiezRank(slug);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: kiez_rank unavailable (${msg})\n`);
		return null;
	}
}

/** Umriss aller Kieze des Bezirks: Karte im Einstieg. */
async function tryLoadBezirkOutline(parentBezirkName: string): Promise<RegionOutline | null> {
	if (!parentBezirkName) return null;
	try {
		const { readFile } = await import('node:fs/promises');
		const { resolve } = await import('node:path');
		const manifest = JSON.parse(
			await readFile(resolve(process.cwd(), 'static/layers/MANIFEST.json'), 'utf-8')
		) as { layers: { slug: string; filename: string }[] };
		const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
		const lorLayer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
		if (!bezirkeLayer || !lorLayer) return null;
		const [bezirkeRaw, lorRaw] = await Promise.all([
			readFile(resolve(process.cwd(), 'static/layers', bezirkeLayer.filename), 'utf-8'),
			readFile(resolve(process.cwd(), 'static/layers', lorLayer.filename), 'utf-8')
		]);
		const bezirkeFc = JSON.parse(bezirkeRaw) as {
			features: { properties?: Record<string, unknown> }[];
		};
		const lorFc = JSON.parse(lorRaw) as { features: { properties?: Record<string, unknown> }[] };
		const bezirkCodeToSlug = new Map<string, string>();
		for (const f of bezirkeFc.features) {
			const props = f.properties ?? {};
			if (typeof props.Schluessel_gesamt === 'string' && typeof props.Gemeinde_name === 'string') {
				bezirkCodeToSlug.set(
					props.Schluessel_gesamt.slice(-2),
					bezirkSlugFromName(props.Gemeinde_name)
				);
			}
		}
		return buildKiezContext({
			lorFeatureCollection: lorFc,
			bezirkCodeToSlug,
			scores: new Map(),
			bezirkSlug: bezirkSlugFromName(parentBezirkName)
		}).outline;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-page] WARN: bezirk outline failed (${msg})\n`);
		return null;
	}
}

export interface KiezPageData {
	readonly profile: {
		readonly slug: string;
		readonly name: string;
		readonly bezirk: string;
		readonly einwohner: number;
		readonly flaecheHa: number;
		readonly centroid: [number, number];
	};
	readonly bezirkSlug: string | null;
	readonly outline: RegionOutline | null;
	readonly neighbors: readonly NeighborEntry[];
	readonly similar: readonly NeighborEntry[];
	readonly profileProse: readonly string[];
	readonly profileLocale: Locale;
	readonly compositeRank: CompositeRank;
	readonly einwohnerStichtag: string | null;
	/** Alle 143 Kieze mit Score und Themenwerten. */
	readonly regions: readonly RegionSnapshot[];
	/** Eigener Bezirk mit seinen Themenwerten (Vergleich „Bezirk gesamt“). */
	readonly bezirkRegion: RegionSnapshot | null;
	readonly wahl: {
		readonly own: WahlBundle;
		readonly berlin: WahlBundle;
		readonly bezirk: WahlBundle | null;
	};
}

export const load: PageServerLoad = async ({ params, fetch }): Promise<KiezPageData> => {
	const slug = params.slug;
	let profile;
	try {
		profile = await getKiezProfile(getLocale() as 'de' | 'en', slug, fetch);
	} catch {
		throw error(404, m.kiez_page_not_found({ slug }, { locale: getLocale() }));
	}
	const bezirkSlug = profile.bezirk ? bezirkSlugFromName(profile.bezirk) : null;
	const { getLocalizedProfile } = await import('$lib/server/profile/get-profile.js');
	const [
		outline,
		neighborLists,
		rank,
		prose,
		einwohnerStichtag,
		regions,
		bezirke,
		wahlOwn,
		wahlBerlin,
		wahlBezirk
	] = await Promise.all([
		tryLoadBezirkOutline(profile.bezirk),
		getKiezNeighborLists(slug),
		tryLoadKiezRank(slug),
		getLocalizedProfile('kiez', slug, getLocale()),
		readEinwohnerStichtag(),
		loadKiezRegions(),
		loadBezirkRegions(),
		loadWahlBundle('kiez', slug),
		loadWahlBundle('berlin', null),
		bezirkSlug ? loadWahlBundle('bezirk', bezirkSlug) : Promise.resolve(null)
	]);
	return {
		profile: {
			slug: profile.slug,
			name: profile.name,
			bezirk: profile.bezirk,
			einwohner: profile.einwohner,
			flaecheHa: profile.flaecheHa,
			centroid: profile.centroid
		},
		bezirkSlug,
		outline,
		neighbors: neighborLists.neighbors,
		similar: neighborLists.similar,
		profileProse: prose.paragraphs,
		profileLocale: prose.locale,
		compositeRank: toCompositeRank(rank),
		einwohnerStichtag,
		regions,
		bezirkRegion: bezirke.find((b) => b.slug === bezirkSlug) ?? null,
		wahl: { own: wahlOwn, berlin: wahlBerlin, bezirk: wahlBezirk }
	};
};
