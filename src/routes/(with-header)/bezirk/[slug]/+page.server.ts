import { error } from '@sveltejs/kit';
import { getBezirkProfile } from '$lib/data/get-bezirk-profile.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import { m } from '$lib/paraglide/messages.js';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { readBezirkComposite, readEinwohnerStichtag } from '$lib/server/profile/meta-sources.js';
import { toCompositeRank, type CompositeRank } from '$lib/server/profile/composite-rank.js';
import { loadBezirkRegions, loadKiezRegions } from '$lib/place/load-regions.server';
import { loadNeighborBezirkSlugs } from '$lib/place/bezirk-context.server';
import { loadWahlBundle } from '$lib/place/wahl.server';
import { loadPageFaq } from '$lib/place/faq.server';
import type { PageFaqItem } from '$lib/place/faq-items';
import { mapImage } from '$lib/place/maps.server';
import type { MapImage } from '$lib/place/types';
import { packRegions, packWahl, type PackedRegions, type PackedWahl } from '$lib/place/pack';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

/**
 * Bezirksseite nach Themen (NAV-104/105): 12 vorgerenderte Seiten, je DE und `/en`.
 * Der Bezirk steht unter den 12 Bezirken, seine Kieze erscheinen als Spanne je Kapitel.
 */
export const entries: EntryGenerator = async () => {
	const slugs = await readBezirkSlugsFromGeoJson();
	return slugs.map((slug) => ({ slug }));
};

async function tryLoadBezirkRank(slug: string) {
	if (!process.env.DATABASE_URL) return null;
	try {
		const { getBezirkRank } = await import('$lib/server/db/queries/get-bezirk-rank.js');
		return await getBezirkRank(slug);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[bezirk-page] WARN: bezirk_rank unavailable (${msg})\n`);
		return null;
	}
}

export interface BezirkPageData {
	readonly profile: {
		readonly slug: string;
		readonly name: string;
		readonly einwohner: number;
		readonly flaecheHa: number;
		readonly centroid: [number, number];
	};
	readonly einwohnerStichtag: string | null;
	readonly bezirkComposite: number | null;
	/** Geprüfte FAQ aus `renderPlaceFaq` (dieselbe Quelle wie faq_qna). */
	readonly faq: readonly PageFaqItem[];
	readonly profileProse: readonly string[];
	readonly profileLocale: Locale;
	readonly compositeRank: CompositeRank;
	/** Karte der Kieze im Bezirk und Lage in Berlin, je als SVG-Datei. */
	readonly map: MapImage | null;
	readonly locationMap: MapImage | null;
	/** Die Kieze dieses Bezirks mit Themenwerten (Spanne je Kapitel). */
	readonly kieze: PackedRegions;
	readonly neighborSlugs: readonly string[];
	/** Alle 12 Bezirke. */
	readonly bezirke: PackedRegions;
	readonly wahl: { readonly own: PackedWahl; readonly berlin: PackedWahl };
}

export const load: PageServerLoad = async ({ params, fetch }): Promise<BezirkPageData> => {
	const slug = params.slug;
	let profile;
	try {
		profile = await getBezirkProfile(getLocale() as 'de' | 'en', slug, fetch);
	} catch {
		throw error(404, m.bezirk_page_not_found({ slug }, { locale: getLocale() }));
	}
	const { getLocalizedProfile } = await import('$lib/server/profile/get-profile.js');
	const [
		rank,
		prose,
		faq,
		einwohnerStichtag,
		bezirkComposite,
		map,
		locationMap,
		kieze,
		bezirke,
		wahlOwn,
		wahlBerlin
	] = await Promise.all([
		tryLoadBezirkRank(slug),
		getLocalizedProfile('bezirk', slug, getLocale()),
		loadPageFaq('bezirk', slug, profile.name, getLocale() as 'de' | 'en'),
		readEinwohnerStichtag(),
		readBezirkComposite(slug),
		mapImage('bezirk', slug, slug),
		mapImage('lage', slug, slug),
		loadKiezRegions(),
		loadBezirkRegions(),
		loadWahlBundle('bezirk', slug),
		loadWahlBundle('berlin', null)
	]);
	const ownKieze = kieze.filter((k) => k.parentSlug === slug);
	const neighborSlugs = await loadNeighborBezirkSlugs(
		slug,
		profile.name,
		ownKieze.map((k) => k.slug)
	);
	return {
		profile: {
			slug: profile.slug,
			name: profile.name,
			einwohner: profile.einwohner,
			flaecheHa: profile.flaecheHa,
			centroid: profile.centroid
		},
		einwohnerStichtag,
		bezirkComposite,
		faq,
		profileProse: prose.paragraphs,
		profileLocale: prose.locale,
		compositeRank: toCompositeRank(rank),
		map,
		locationMap,
		kieze: packRegions(ownKieze),
		neighborSlugs,
		bezirke: packRegions(bezirke),
		wahl: { own: packWahl(wahlOwn), berlin: packWahl(wahlBerlin) }
	};
};
