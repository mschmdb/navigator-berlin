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

describe('updates/[slug] load (i18n C4d)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('entries() liefert mindestens einen Slug und keinen .en-Slug', () => {
		const slugs = allSlugs();
		expect(slugs.length).toBeGreaterThan(0);
		expect(slugs.filter((s) => /\.[a-z]{2}$/.test(s))).toEqual([]);
	});

	it('DE rendert den deutschen Body', () => {
		overwriteGetLocale(() => 'de');
		expect(run('launch').bodyHtml).toContain('Was sich ändert');
	});

	it('EN rendert den englischen Body', () => {
		overwriteGetLocale(() => 'en');
		expect(run('launch').bodyHtml).toContain('What changes');
		expect(run('launch').bodyHtml).not.toContain('Was sich ändert');
	});

	it('jeder Eintrag hat title_en, summary_en und einen englischen Body (Parität)', () => {
		overwriteGetLocale(() => 'en');
		for (const slug of allSlugs()) {
			const { entry, bodyHtml, bodyIsDeFallback } = run(slug);
			expect(entry.frontmatter.title_en, `${slug} title_en`).toBeTruthy();
			expect(entry.frontmatter.summary_en, `${slug} summary_en`).toBeTruthy();
			expect(bodyIsDeFallback, `${slug} .en.md`).toBe(false);
			expect(bodyHtml.length).toBeGreaterThan(0);
		}
	});

	it('DE meldet nie einen Body-Fallback', () => {
		overwriteGetLocale(() => 'de');
		expect(run('launch').bodyIsDeFallback).toBe(false);
	});

	it('liefert weder Markdown-Body noch bodyEn aus', () => {
		overwriteGetLocale(() => 'en');
		const { entry } = run('launch') as unknown as { entry: Record<string, unknown> };
		expect(entry.body).toBe('');
		expect(entry.bodyEn).toBeUndefined();
	});

	it('interne Links im EN-Body tragen den /en-Präfix, Feed-Links nicht', () => {
		overwriteGetLocale(() => 'en');
		for (const slug of allSlugs()) {
			const { bodyHtml } = run(slug);
			const hrefs = [...bodyHtml.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1] ?? '');
			const wrong = hrefs.filter(
				(h) =>
					!h.startsWith('/en/') &&
					!/^\/updates\/(rss\.xml|atom\.xml|feed\.json)$/.test(h) &&
					h !== '/webmcp-manifest.json'
			);
			expect(wrong, slug).toEqual([]);
		}
	});

	it('unbekannter Slug wirft 404', () => {
		expect(() => run('gibt-es-nicht')).toThrow();
	});
});
