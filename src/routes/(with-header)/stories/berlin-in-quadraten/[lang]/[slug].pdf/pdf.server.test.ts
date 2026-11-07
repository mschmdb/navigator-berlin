import { describe, expect, it } from 'vitest';
import { entries, GET } from './+server.js';

const call = (lang: string, slug: string): Promise<Response> =>
	Promise.resolve(GET({ params: { lang, slug } } as never)) as Promise<Response>;

describe('stories/berlin-in-quadraten/[lang]/[slug].pdf', () => {
	it('entries: Gesamtansicht AGH und BTW in DE und EN', async () => {
		const list = await (entries as () => Promise<{ lang: string; slug: string }[]>)();
		expect(list.map((e) => `${e.lang}/${e.slug}`).sort()).toEqual([
			'de/alle-bezirke-agh',
			'de/alle-bezirke-btw',
			'en/alle-bezirke-agh',
			'en/alle-bezirke-btw'
		]);
	});

	it('liefert das Plakat als PDF zum Herunterladen', async () => {
		const res = await call('de', 'alle-bezirke-agh');
		expect(res.headers.get('content-type')).toBe('application/pdf');
		expect(res.headers.get('content-disposition')).toContain(
			'berlin-in-quadraten-alle-bezirke-agh-de.pdf'
		);
		const buf = Buffer.from(await res.arrayBuffer());
		expect(buf.subarray(0, 4).toString()).toBe('%PDF');
	});

	it('antwortet mit 404 bei unbekannter Sprache oder Wahlart', async () => {
		await expect(call('fr', 'alle-bezirke-agh')).rejects.toMatchObject({ status: 404 });
		await expect(call('de', 'alle-bezirke-ew')).rejects.toMatchObject({ status: 404 });
		await expect(call('de', 'mitte')).rejects.toMatchObject({ status: 404 });
	});
});
