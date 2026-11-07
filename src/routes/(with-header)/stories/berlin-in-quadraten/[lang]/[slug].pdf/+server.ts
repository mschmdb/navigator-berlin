import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import type { Locale } from '$lib/paraglide/runtime.js';
import { renderWallPosterPdf } from '$lib/server/stories/poster-pdf.js';
import { WAHL_TYPEN } from '$lib/stories/wahl-quadrate/parteien.js';

export const prerender = true;

const LANGS = ['de', 'en'] as const satisfies readonly Locale[];
const PREFIX = 'alle-bezirke-';

/** Gesamtansicht AGH und BTW in 2 Sprachen: 4 PDFs, beim Build als Vektor erzeugt. */
export const entries: EntryGenerator = () =>
	LANGS.flatMap((lang) => WAHL_TYPEN.map((typ) => ({ lang, slug: `${PREFIX}${typ}` })));

export const GET: RequestHandler = async ({ params }) => {
	const lang = LANGS.find((l) => l === params.lang);
	const typ = WAHL_TYPEN.find((t) => params.slug === `${PREFIX}${t}`);
	if (!lang || !typ) throw error(404, 'Plakat nicht gefunden');
	const pdf = await renderWallPosterPdf(typ, lang);
	return new Response(new Uint8Array(pdf), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="berlin-in-quadraten-${params.slug}-${lang}.pdf"`
		}
	});
};
