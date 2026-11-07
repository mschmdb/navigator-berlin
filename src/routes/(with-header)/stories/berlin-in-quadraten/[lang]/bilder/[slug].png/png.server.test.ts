import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { entries, GET } from './+server.js';

const call = (lang: string, slug: string): Promise<Response> =>
	Promise.resolve(GET({ params: { lang, slug } } as never)) as Promise<Response>;

describe('stories/berlin-in-quadraten/[lang]/bilder/[slug].png', () => {
	it('entries: OG-Bild plus 12 Bezirke × 2 Wahlarten, je Sprache', async () => {
		const list = await (entries as () => Promise<{ lang: string; slug: string }[]>)();
		expect(list).toHaveLength(2 * (1 + 24));
		expect(new Set(list.map((e) => `${e.lang}/${e.slug}`)).size).toBe(50);
		expect(list).toContainEqual({ lang: 'en', slug: 'og' });
		expect(list).toContainEqual({ lang: 'de', slug: 'friedrichshain-kreuzberg-agh' });
		expect(list).toContainEqual({ lang: 'de', slug: 'marzahn-hellersdorf-btw' });
	});

	it('OG-Bild 1200 × 630', async () => {
		const res = await call('de', 'og');
		expect(res.headers.get('content-type')).toBe('image/png');
		const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
		expect([meta.width, meta.height]).toEqual([1200, 630]);
	});

	it('Social-Bild 1080 × 1350', async () => {
		const res = await call('en', 'treptow-koepenick-btw');
		const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
		expect([meta.width, meta.height]).toEqual([1080, 1350]);
	});

	it('antwortet mit 404 bei unbekanntem Bild', async () => {
		await expect(call('fr', 'og')).rejects.toMatchObject({ status: 404 });
		await expect(call('de', 'nirgendwo-agh')).rejects.toMatchObject({ status: 404 });
		await expect(call('de', 'mitte-ew')).rejects.toMatchObject({ status: 404 });
	});
});
