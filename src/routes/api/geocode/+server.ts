import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { proxyNominatim, reverseGeocode } from '$lib/server/geocode';
import type { Locale } from '$lib/data';

const QuerySchema = v.object({
	q: v.pipe(v.string(), v.minLength(2), v.maxLength(120))
});

const ReverseSchema = v.object({
	lat: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
	lng: v.pipe(v.number(), v.minValue(-180), v.maxValue(180))
});

const SUPPORTED_LANGS: Locale[] = ['de', 'en', 'tr', 'uk', 'ar', 'es', 'fr', 'it'];

function parseLang(header: string | null): Locale {
	if (!header) return 'de';
	const primary = header.split(',')[0]?.split(';')[0]?.trim().toLowerCase().split('-')[0];
	const match = SUPPORTED_LANGS.find((l) => l === primary);
	return match ?? 'de';
}

function parseReverseParam(raw: string | null): { lat: number; lng: number } | null {
	if (!raw) return null;
	const parts = raw.split(',').map((s) => parseFloat(s));
	if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null;
	return { lat: parts[0]!, lng: parts[1]! };
}

export const GET: RequestHandler = async ({ url, request }) => {
	const lang = parseLang(request.headers.get('accept-language'));
	const reverseRaw = url.searchParams.get('reverse');

	if (reverseRaw !== null) {
		const parsedRaw = parseReverseParam(reverseRaw);
		if (!parsedRaw) {
			return Response.json({ error: 'invalid_reverse' }, { status: 400 });
		}
		const parsed = v.safeParse(ReverseSchema, parsedRaw);
		if (!parsed.success) {
			return Response.json({ error: 'invalid_reverse' }, { status: 400 });
		}
		try {
			const suggestion = await reverseGeocode(parsed.output.lat, parsed.output.lng, lang);
			return Response.json(
				{ suggestion },
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
	}

	const params = { q: url.searchParams.get('q') ?? '' };
	const parsed = v.safeParse(QuerySchema, params);
	if (!parsed.success) {
		return Response.json({ error: 'invalid_query' }, { status: 400 });
	}
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
