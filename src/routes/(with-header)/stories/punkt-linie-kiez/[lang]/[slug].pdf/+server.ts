import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import type { Locale } from '$lib/paraglide/runtime.js';
import { renderPosterPdf } from '$lib/server/stories/poster-pdf.js';
import { loadBezirkeDaten } from '$lib/stories/punkt-linie-kiez/bezirke-daten.server.js';

export const prerender = true;

const LANGS = ['de', 'en'] as const satisfies readonly Locale[];

/** 12 Bezirke in 2 Sprachen: 24 Poster, beim Build als Vektor-PDF erzeugt. */
export const entries: EntryGenerator = () =>
	LANGS.flatMap((lang) => loadBezirkeDaten().bezirke.map((b) => ({ lang, slug: b.slug })));

export const GET: RequestHandler = async ({ params }) => {
	const lang = LANGS.find((l) => l === params.lang);
	const daten = loadBezirkeDaten();
	const item = daten.bezirke.find((b) => b.slug === params.slug);
	if (!lang || !item) throw error(404, 'Poster nicht gefunden');
	const pdf = await renderPosterPdf(item, daten.sources, lang);
	return new Response(new Uint8Array(pdf), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="punkt-linie-kiez-${item.slug}-${lang}.pdf"`
		}
	});
};
