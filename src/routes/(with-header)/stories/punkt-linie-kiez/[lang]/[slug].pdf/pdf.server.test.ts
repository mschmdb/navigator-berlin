import { describe, expect, it } from 'vitest';
import { entries, GET } from './+server.js';

const call = (lang: string, slug: string): Promise<Response> =>
	Promise.resolve(GET({ params: { lang, slug } } as never)) as Promise<Response>;

describe('stories/punkt-linie-kiez/[lang]/[slug].pdf', () => {
	it('entries deckt 12 Bezirke in DE und EN ab: 24 Dateien', async () => {
		const list = (await (entries as () => { lang: string; slug: string }[])()) as {
			lang: string;
			slug: string;
		}[];
		expect(list).toHaveLength(24);
		expect(new Set(list.map((e) => `${e.lang}/${e.slug}`)).size).toBe(24);
		expect(list.filter((e) => e.lang === 'de')).toHaveLength(12);
		expect(list.filter((e) => e.lang === 'en')).toHaveLength(12);
	});

	it('liefert application/pdf mit %PDF, Bezirksname und Dateiname', async () => {
		const res = await call('de', 'friedrichshain-kreuzberg');
		expect(res.headers.get('content-type')).toBe('application/pdf');
		expect(res.headers.get('content-disposition')).toContain(
			'punkt-linie-kiez-friedrichshain-kreuzberg-de.pdf'
		);
		const buf = Buffer.from(await res.arrayBuffer());
		expect(buf.subarray(0, 4).toString()).toBe('%PDF');
		const text = buf.toString('latin1').toLowerCase();
		const hex = Buffer.from('﻿friedrichshain-kreuzberg', 'utf16le').swap16().toString('hex');
		expect(text.includes('friedrichshain-kreuzberg') || text.includes(hex)).toBe(true);
	});

	it('liefert die englische Fassung', async () => {
		const res = await call('en', 'mitte');
		expect(res.headers.get('content-disposition')).toContain('punkt-linie-kiez-mitte-en.pdf');
	});

	it('antwortet mit 404 bei unbekannter Sprache oder Bezirk', async () => {
		await expect(call('fr', 'mitte')).rejects.toMatchObject({ status: 404 });
		await expect(call('de', 'nirgendwo')).rejects.toMatchObject({ status: 404 });
	});
});
