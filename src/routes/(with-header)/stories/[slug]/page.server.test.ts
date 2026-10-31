import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { entries, load } from './+page.server.js';

type LoadResult = {
	entry: { slug: string; frontmatter: { title_en?: string; summary_en?: string } };
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
		expect(result.bodyHtml).toContain('The atlas shows Berlin as a map');
		expect(result.bodyHtml).not.toContain('Der Atlas');
		expect(result.bodyIsDeFallback).toBe(false);
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
});
