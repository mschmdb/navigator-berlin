import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';
import type { Locale } from '$lib/paraglide/runtime.js';
import { renderOverviewPdf, renderPosterPdf } from '$lib/server/stories/poster-pdf.js';
import { loadBezirkeDaten } from '$lib/stories/punkt-linie-kiez/bezirke-daten.server.js';

export const prerender = true;

const LANGS = ['de', 'en'] as const satisfies readonly Locale[];

/** Der Slug des Gesamtplakats. Kein Bezirk heißt so. */
const OVERVIEW_SLUG = 'alle-bezirke';

/** 12 Bezirke plus Gesamtplakat in 2 Sprachen: 26 PDFs, beim Build als Vektor erzeugt. */
export const entries: EntryGenerator = () =>
	LANGS.flatMap((lang) =>
		[...loadBezirkeDaten().bezirke.map((b) => b.slug), OVERVIEW_SLUG].map((slug) => ({
			lang,
			slug
		}))
	);

const pdfResponse = (pdf: Buffer, filename: string): Response =>
	new Response(new Uint8Array(pdf), {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="${filename}"`
		}
	});

export const GET: RequestHandler = async ({ params }) => {
	const lang = LANGS.find((l) => l === params.lang);
	if (!lang) throw error(404, 'Poster nicht gefunden');
	const daten = loadBezirkeDaten();
	if (params.slug === OVERVIEW_SLUG) {
		const pdf = await renderOverviewPdf(daten.bezirke, daten.sources, lang);
		return pdfResponse(pdf, `punkt-linie-kiez-${OVERVIEW_SLUG}-${lang}.pdf`);
	}
	const item = daten.bezirke.find((b) => b.slug === params.slug);
	if (!item) throw error(404, 'Poster nicht gefunden');
	const pdf = await renderPosterPdf(item, daten.sources, lang);
	return pdfResponse(pdf, `punkt-linie-kiez-${item.slug}-${lang}.pdf`);
};
