import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { proxyNominatim } from '$lib/server/geocode';
import type { Locale } from '$lib/data';

const QuerySchema = v.object({
	q: v.pipe(v.string(), v.minLength(2), v.maxLength(120))
});

const SUPPORTED_LANGS: Locale[] = ['de', 'en', 'tr', 'uk', 'ar', 'es', 'fr', 'it'];

function parseLang(header: string | null): Locale {
	if (!header) return 'de';
	const primary = header.split(',')[0]?.split(';')[0]?.trim().toLowerCase().split('-')[0];
	const match = SUPPORTED_LANGS.find((l) => l === primary);
	return match ?? 'de';
}

export const GET: RequestHandler = async ({ url, request }) => {
	const params = { q: url.searchParams.get('q') ?? '' };
	const parsed = v.safeParse(QuerySchema, params);
	if (!parsed.success) {
		return Response.json({ error: 'invalid_query' }, { status: 400 });
	}
	const lang = parseLang(request.headers.get('accept-language'));
	try {
		const suggestions = await proxyNominatim(parsed.output.q, lang);
		return Response.json(
			{ suggestions },
			{
				status: 200,
				headers: { 'Cache-Control': 'private, max-age=300' }
			}
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'unknown';
		if (msg.includes('aborted')) {
			return Response.json({ error: 'timeout' }, { status: 504 });
		}
		return Response.json({ error: 'upstream_error', detail: msg }, { status: 502 });
	}
};
