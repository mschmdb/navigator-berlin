import { error } from '@sveltejs/kit';
import { getBezirkProfile } from '$lib/data/get-bezirk-profile.js';
import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
import { m } from '$lib/paraglide/messages.js';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { readBezirkComposite, readEinwohnerStichtag } from '$lib/server/profile/meta-sources.js';
import { toCompositeRank, type CompositeRank } from '$lib/server/profile/composite-rank.js';
import { buildBezirkKiezeView } from '$lib/data/bezirk-kieze-view.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
import { loadBezirkRegions, loadKiezRegions } from '$lib/place/load-regions.server';
import {
	loadNeighborBezirkSlugs,
	readBerlinBezirkeOutline
} from '$lib/place/bezirk-context.server';
import { loadWahlBundle } from '$lib/place/wahl.server';
import type { RegionSnapshot } from '$lib/place/types';
import type { WahlBundle } from '$lib/place/wahl-types';
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

/** Umriss der Kieze des Bezirks für die Karte im Einstieg (Farben kommen aus den Scores). */
async function tryLoadKiezeOutline(bezirkSlug: string): Promise<RegionOutline | null> {
	try {
		const { readLayer } = await import('$lib/server/kiez-neighbors-index.js');
		const { normalizeSlug } = await import('$lib/data/internal/slug.js');
		const [lorFc, bezirkeFc] = await Promise.all([
			readLayer('lor-bezirksregion'),
			readLayer('bezirke')
		]);
		const bezirkCodeToSlug = new Map<string, string>();
		for (const f of bezirkeFc.features) {
			const p = f.properties ?? {};
			if (typeof p.Schluessel_gesamt === 'string' && typeof p.Gemeinde_name === 'string') {
				bezirkCodeToSlug.set(p.Schluessel_gesamt.slice(-2), normalizeSlug(p.Gemeinde_name));
			}
		}
		return buildBezirkKiezeView({
			lorFeatureCollection: lorFc,
			bezirkCodeToSlug,
			scores: new Map(),
			ranks: new Map(),
			bezirkSlug
		}).outline;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[bezirk-page] WARN: kieze outline failed (${msg})\n`);
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
	readonly profileProse: readonly string[];
	readonly profileLocale: Locale;
	readonly compositeRank: CompositeRank;
	readonly outline: RegionOutline | null;
	readonly berlinMap: RegionOutline | null;
	/** Die Kieze dieses Bezirks mit Themenwerten (Spanne je Kapitel). */
	readonly kieze: readonly RegionSnapshot[];
	readonly neighborSlugs: readonly string[];
	/** Alle 12 Bezirke. */
	readonly bezirke: readonly RegionSnapshot[];
	readonly wahl: { readonly own: WahlBundle; readonly berlin: WahlBundle };
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
		einwohnerStichtag,
		bezirkComposite,
		outline,
		berlinMap,
		kieze,
		bezirke,
		wahlOwn,
		wahlBerlin
	] = await Promise.all([
		tryLoadBezirkRank(slug),
		getLocalizedProfile('bezirk', slug, getLocale()),
		readEinwohnerStichtag(),
		readBezirkComposite(slug),
		tryLoadKiezeOutline(slug),
		readBerlinBezirkeOutline(),
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
		profileProse: prose.paragraphs,
		profileLocale: prose.locale,
		compositeRank: toCompositeRank(rank),
		outline,
		berlinMap,
		kieze: ownKieze,
		neighborSlugs,
		bezirke,
		wahl: { own: wahlOwn, berlin: wahlBerlin }
	};
};
