import { ogSvg, OG_SIZE, socialSvg, SOCIAL_SIZE } from '$lib/stories/wahl-quadrate/bilder-svg.js';
import type { Lang } from '$lib/stories/wahl-quadrate/grau.js';
import { WAHL_TYPEN } from '$lib/stories/wahl-quadrate/parteien.js';
import { jostMeasure } from './jost.js';
import { svgToPng } from './raster.js';
import { loadStoriesWahl } from './wahl-daten.js';

const fonts = () => ({ black: jostMeasure(900), regular: jostMeasure(400) });

export const OG_SLUG = 'og';

/** Bild-Slugs: `og` und `<bezirk>-<wahltyp>` für jedes Social-Bild. */
export function bildSlugs(): string[] {
	return [
		OG_SLUG,
		...loadStoriesWahl().bezirke.flatMap((b) => WAHL_TYPEN.map((t) => `${b.slug}-${t}`))
	];
}

/** PNG zu einem Slug aus `bildSlugs`, `null` bei unbekanntem Slug. */
export async function renderBild(slug: string, lang: Lang): Promise<Buffer | null> {
	const data = loadStoriesWahl();
	if (slug === OG_SLUG) return svgToPng(ogSvg({ data, lang, fonts: fonts() }).svg, OG_SIZE.width);
	const typ = WAHL_TYPEN.find((t) => slug.endsWith(`-${t}`));
	if (!typ) return null;
	const bezirk = slug.slice(0, -(typ.length + 1));
	if (!data.bezirke.some((b) => b.slug === bezirk)) return null;
	const { svg } = socialSvg({ data, bezirk, typ, lang, fonts: fonts() });
	return svgToPng(svg, SOCIAL_SIZE.width);
}
