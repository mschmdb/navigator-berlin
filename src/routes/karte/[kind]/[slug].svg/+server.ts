import { error } from '@sveltejs/kit';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { mapSvg, type MapKind } from '$lib/place/maps.server';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

/** Karten der Kiez- und Bezirksseiten als statische SVG-Dateien (NAV-105). */
export const entries: EntryGenerator = async () => {
	const [kieze, bezirke] = await Promise.all([
		readKiezSlugsFromGeoJson(),
		readBezirkSlugsFromGeoJson()
	]);
	return [
		...kieze.map((slug) => ({ kind: 'kiez', slug })),
		...bezirke.flatMap((slug) => [
			{ kind: 'bezirk', slug },
			{ kind: 'lage', slug }
		])
	];
};

const KINDS: readonly MapKind[] = ['kiez', 'bezirk', 'lage'];

export const GET: RequestHandler = async ({ params }) => {
	const kind = params.kind as MapKind;
	if (!KINDS.includes(kind) || !/^[a-z0-9-]+$/.test(params.slug)) throw error(404);
	const svg = await mapSvg(kind, params.slug);
	if (!svg) throw error(404);
	return new Response(svg, {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=86400'
		}
	});
};
