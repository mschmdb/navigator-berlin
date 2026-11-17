/**
 * Umriss-Karten der Kiez- und Bezirksseiten: Quelle für die SVG-Dateien unter
 * `/karte/[kind]/[slug].svg` und für Breite und Höhe der Bilder auf den Seiten.
 */
import { buildBezirkKiezeView } from '$lib/data/bezirk-kieze-view.js';
import { normalizeSlug } from '$lib/data/internal/slug.js';
import { readLayer } from '$lib/server/kiez-neighbors-index.js';
import type { RegionOutline } from '$lib/seo/region-outline-svg.js';
import { readBerlinBezirkeOutline } from './bezirk-context.server';
import { loadBezirkRegions, loadKiezRegions } from './load-regions.server';
import { renderScoreMapSvg } from './score-map-svg';
import type { MapImage } from './types';

export type MapKind = 'kiez' | 'bezirk' | 'lage';

const outlineCache = new Map<string, Promise<RegionOutline | null>>();

/** Umriss der Kieze eines Bezirks, einmal pro Prozess und Bezirk. */
export function loadBezirkKiezeOutline(bezirkSlug: string): Promise<RegionOutline | null> {
	let hit = outlineCache.get(bezirkSlug);
	if (!hit) {
		hit = (async () => {
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
		})().catch((err) => {
			outlineCache.delete(bezirkSlug);
			const msg = err instanceof Error ? err.message : String(err);
			process.stderr.write(`[place-maps] WARN: outline ${bezirkSlug} failed (${msg})\n`);
			return null;
		});
		outlineCache.set(bezirkSlug, hit);
	}
	return hit;
}

function outlineFor(kind: MapKind, bezirkSlug: string): Promise<RegionOutline | null> {
	return kind === 'lage' ? readBerlinBezirkeOutline() : loadBezirkKiezeOutline(bezirkSlug);
}

/** Bildangaben für die Seite; `null`, wenn kein Umriss da ist. */
export async function mapImage(
	kind: MapKind,
	slug: string,
	bezirkSlug: string
): Promise<MapImage | null> {
	const outline = await outlineFor(kind, bezirkSlug);
	if (!outline) return null;
	return { src: `/karte/${kind}/${slug}.svg`, width: outline.width, height: outline.height };
}

/** Die SVG-Datei selbst. Kiez: Kieze des Bezirks, der eigene umrandet. */
export async function mapSvg(kind: MapKind, slug: string): Promise<string | null> {
	if (kind === 'lage') {
		const outline = await readBerlinBezirkeOutline();
		if (!outline) return null;
		const bezirke = await loadBezirkRegions();
		const names = new Map(bezirke.map((b) => [b.slug, { name: b.name, composite: null }]));
		return renderScoreMapSvg({ outline, scores: names, ownSlug: slug, plain: true });
	}
	const kieze = await loadKiezRegions();
	const bezirkSlug = kind === 'bezirk' ? slug : kieze.find((k) => k.slug === slug)?.parentSlug;
	if (!bezirkSlug) return null;
	const outline = await loadBezirkKiezeOutline(bezirkSlug);
	if (!outline) return null;
	const scores = new Map(kieze.map((k) => [k.slug, { name: k.name, composite: k.dims.composite }]));
	return renderScoreMapSvg({ outline, scores, ownSlug: kind === 'kiez' ? slug : null });
}
