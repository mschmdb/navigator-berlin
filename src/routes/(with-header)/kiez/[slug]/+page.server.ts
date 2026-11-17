import { error } from '@sveltejs/kit';
import { getKiezProfile } from '$lib/data/get-kiez-profile.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import { m } from '$lib/paraglide/messages.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { readEinwohnerStichtag } from '$lib/server/profile/meta-sources.js';
import { toCompositeRank, type CompositeRank } from '$lib/server/profile/composite-rank.js';
import type { NeighborEntry } from '$lib/data/kiez-neighbors.js';
import { getKiezNeighborLists } from '$lib/server/kiez-neighbors-index.js';
import { bezirkSlugFromName } from '$lib/data/region-display-names.js';
import { loadBezirkRegions, loadKiezRegions } from '$lib/place/load-regions.server';
import { loadWahlBundle } from '$lib/place/wahl.server';
import { loadPageFaq } from '$lib/place/faq.server';
import type { PageFaqItem } from '$lib/place/faq-items';
import type { MapImage, RegionSnapshot } from '$lib/place/types';
import { mapImage } from '$lib/place/maps.server';
import { packRegions, packWahl, type PackedRegions, type PackedWahl } from '$lib/place/pack';
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
	/** Karte der Kieze im Bezirk als SVG-Datei. */
	readonly map: MapImage | null;
	readonly neighbors: readonly NeighborEntry[];
	readonly similar: readonly NeighborEntry[];
	/** Geprüfte FAQ aus `renderPlaceFaq` (dieselbe Quelle wie faq_qna). */
	readonly faq: readonly PageFaqItem[];
	readonly profileProse: readonly string[];
	readonly profileLocale: Locale;
	readonly compositeRank: CompositeRank;
	readonly einwohnerStichtag: string | null;
	/** Alle 143 Kieze mit Score und Themenwerten, spaltenweise gepackt (`unpackRegions`). */
	readonly regions: PackedRegions;
	/** Eigener Bezirk mit seinen Themenwerten (Vergleich „Bezirk gesamt“). */
	readonly bezirkRegion: RegionSnapshot | null;
	readonly wahl: {
		readonly own: PackedWahl;
		readonly berlin: PackedWahl;
		readonly bezirk: PackedWahl | null;
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
		map,
		neighborLists,
		rank,
		prose,
		faq,
		einwohnerStichtag,
		regions,
		bezirke,
		wahlOwn,
		wahlBerlin,
		wahlBezirk
	] = await Promise.all([
		bezirkSlug ? mapImage('kiez', slug, bezirkSlug) : Promise.resolve(null),
		getKiezNeighborLists(slug),
		tryLoadKiezRank(slug),
		getLocalizedProfile('kiez', slug, getLocale()),
		loadPageFaq('kiez', slug, profile.name, getLocale() as 'de' | 'en'),
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
		map,
		neighbors: neighborLists.neighbors,
		similar: neighborLists.similar,
		faq,
		profileProse: prose.paragraphs,
		profileLocale: prose.locale,
		compositeRank: toCompositeRank(rank),
		einwohnerStichtag,
		regions: packRegions(regions),
		bezirkRegion: bezirke.find((b) => b.slug === bezirkSlug) ?? null,
		wahl: {
			own: packWahl(wahlOwn),
			berlin: packWahl(wahlBerlin),
			bezirk: wahlBezirk ? packWahl(wahlBezirk) : null
		}
	};
};
