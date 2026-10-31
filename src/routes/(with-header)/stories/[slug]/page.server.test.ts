import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { entries, load } from './+page.server.js';

type LoadResult = {
	bezirkeDaten?: { bezirke: { slug: string }[]; sources: { name: string }[] };
	entry: { slug: string; frontmatter: { title_en?: string; summary_en?: string } };
	bodyHtmlBefore: string;
	bodyHtml: string;
	bodyIsDeFallback: boolean;
};

function run(slug: string): LoadResult {
	return load({ params: { slug } } as never) as unknown as LoadResult;
}

function allSlugs(): string[] {
	return (entries() as { slug: string }[]).map((e) => e.slug);
}

describe('stories/[slug] load', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('entries() liefert den ersten Beitrag und keinen .en-Slug', () => {
		const slugs = allSlugs();
		expect(slugs).toContain('berlin-data-stories');
		expect(slugs.filter((s) => /\.[a-z]{2}$/.test(s))).toEqual([]);
	});

	it('DE rendert den deutschen Body', () => {
		overwriteGetLocale(() => 'de');
		const result = run('berlin-data-stories');
		expect(result.bodyHtml).toContain('Punkt, Linie, Kiez');
		expect(result.bodyIsDeFallback).toBe(false);
	});

	it('EN rendert den englischen Body', () => {
		overwriteGetLocale(() => 'en');
		const result = run('berlin-data-stories');
		expect(result.bodyHtml).toContain('Atlas and Kiez Finder show Berlin as a map');
		expect(result.bodyHtml).not.toContain('Im Atlas und im Kiez-Finder');
		expect(result.bodyIsDeFallback).toBe(false);
	});

	it('teilt den Punkt-Linie-Kiez-Text am Marker: Kandinsky davor, Leseanleitung danach', () => {
		overwriteGetLocale(() => 'de');
		const result = run('punkt-linie-kiez-bezirke');
		expect(result.bodyHtmlBefore).toContain('Kandinsky');
		expect(result.bodyHtmlBefore).not.toContain('So liest du das Bild');
		expect(result.bodyHtml).toContain('So liest du das Bild');
		expect(result.bodyHtml).not.toContain('visual');
	});

	it('ohne Marker bleibt der Text vor dem Bild leer', () => {
		expect(run('berlin-data-stories').bodyHtmlBefore).toBe('');
	});

	it('gibt den Markdown-Body nicht an den Client', () => {
		expect(run('berlin-data-stories').entry).toMatchObject({ body: '' });
	});

	it('jeder Beitrag hat title_en, summary_en und einen englischen Body (Parität)', () => {
		overwriteGetLocale(() => 'en');
		for (const slug of allSlugs()) {
			const { entry, bodyIsDeFallback } = run(slug);
			expect(entry.frontmatter.title_en, `${slug} title_en`).toBeTruthy();
			expect(entry.frontmatter.summary_en, `${slug} summary_en`).toBeTruthy();
			expect(bodyIsDeFallback, `${slug} .en.md`).toBe(false);
		}
	});

	it('unbekannter Slug wirft 404', () => {
		expect(() => run('gibt-es-nicht')).toThrowError(
			expect.objectContaining({ status: 404 }) as never
		);
	});

	it('liefert für visual die Daten der 12 Bezirke ohne Kieze', () => {
		const result = run('punkt-linie-kiez-bezirke');
		expect(result.bezirkeDaten?.bezirke).toHaveLength(12);
		expect(result.bezirkeDaten?.sources.length).toBeGreaterThan(0);
		expect(JSON.stringify(result.bezirkeDaten)).not.toContain('adlershof');
	});

	it('liefert ohne visual keine Daten', () => {
		expect(run('berlin-data-stories').bezirkeDaten).toBeUndefined();
	});
});
