import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { readKiezSlugsFromGeoJson } from '$lib/seo/sources/kiez-slugs.js';
import { readBezirkSlugsFromGeoJson } from '$lib/seo/sources/bezirk-slugs.js';
import { getKiezProfile } from '$lib/data/get-kiez-profile.js';
import { bezirkSlugFromName } from '$lib/data/region-display-names.js';
import { bezirkAnchorId } from '$lib/data/region-overview.js';
import { loadRegionOverview } from './region-overview-loader.js';

const staticFetch: typeof fetch = async (input) => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
	try {
		const body = await readFile(resolve(process.cwd(), 'static', `.${url}`), 'utf-8');
		return new Response(body, { status: 200 });
	} catch {
		return new Response('nicht gefunden', { status: 404 });
	}
};

describe('loadRegionOverview', () => {
	it('liefert alle Bezirke und Kieze, deckungsgleich mit den Slug-Quellen der Routen', async () => {
		const overview = await loadRegionOverview(staticFetch, { scope: 'kieze' });
		expect(overview.map((b) => b.slug).sort()).toEqual(await readBezirkSlugsFromGeoJson());
		expect(overview.flatMap((b) => b.kieze.map((k) => k.slug)).sort()).toEqual(
			await readKiezSlugsFromGeoJson()
		);
	});

	it('Anker-Slug auf /kieze gleicht dem Bezirk-Slug der Kiez-Seite, für alle 12 Bezirke', async () => {
		const overview = await loadRegionOverview(staticFetch, { scope: 'kieze' });
		expect(overview).toHaveLength(12);
		for (const bezirk of overview) {
			const kiez = bezirk.kieze[0]!;
			const profile = await getKiezProfile('de', kiez.slug, staticFetch);
			expect(bezirkSlugFromName(profile.bezirk), bezirk.name).toBe(bezirk.slug);
			expect(bezirkAnchorId(bezirk.slug)).toBe(`bezirk-${bezirk.slug}`);
		}
	});

	it('lädt Einwohner nur auf Anfrage und meldet bei echten Daten keine Lücken', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const without = await loadRegionOverview(staticFetch, { scope: 'kieze' });
		expect(without.every((b) => b.einwohner === null)).toBe(true);
		await loadRegionOverview(staticFetch, { scope: 'bezirke', withEinwohner: true });
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it('ordnet einen bekannten Kiez dem richtigen Bezirk zu', async () => {
		const overview = await loadRegionOverview(staticFetch, { scope: 'kieze' });
		const bezirkOf = (slug: string) =>
			overview.find((b) => b.kieze.some((k) => k.slug === slug))?.slug;
		expect(bezirkOf('moabit-west')).toBe('mitte');
		expect(overview.every((b) => b.kieze.length > 0)).toBe(true);
	});

	it('hat alle Bezirke mit Einwohnerzahl und Score', async () => {
		const overview = await loadRegionOverview(staticFetch, {
			scope: 'bezirke',
			withEinwohner: true
		});
		expect(overview).toHaveLength((await readBezirkSlugsFromGeoJson()).length);
		for (const bezirk of overview) {
			expect(bezirk.einwohner).toBeGreaterThan(0);
			expect(typeof bezirk.composite).toBe('number');
		}
	});
});
