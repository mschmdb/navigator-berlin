import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import type { Locale } from '$lib/paraglide/runtime.js';
import { bildSlugs, renderBild } from '$lib/server/stories/wahl-bilder.js';

export const prerender = true;

const LANGS = ['de', 'en'] as const satisfies readonly Locale[];

/** OG-Bild der Handbuch-Seite und je Bezirk und Wahlart ein Social-Bild, in 2 Sprachen. */
export const entries: EntryGenerator = () =>
	LANGS.flatMap((lang) => bildSlugs().map((slug) => ({ lang, slug })));

export const GET: RequestHandler = async ({ params }) => {
	const lang = LANGS.find((l) => l === params.lang);
	const png = lang ? await renderBild(params.slug, lang) : null;
	if (!png) throw error(404, 'Bild nicht gefunden');
	return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
