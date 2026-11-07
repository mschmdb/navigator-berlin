import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { entries, load } from './+page.server.js';

type LoadResult = {
	bezirkeDaten?: { bezirke: { slug: string }[]; sources: { name: string }[] };
	entry: { slug: string; frontmatter: { title_en?: string; summary_en?: string } };
	bodyHtmlBefore: string;
	bodyHtml: string;
	bodyIsDeFallback: boolean;
	sections?: { id: string | null; heading: string | null; html: string }[];
	wahlDaten?: { bezirke: unknown[]; wahlen: unknown[]; berlin: unknown };
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
	it('Berlin in Quadraten: Abschnitte mit ID, Überschrift und Text, ohne Marker', () => {
		overwriteGetLocale(() => 'de');
		const { sections, bodyHtml } = run('berlin-in-quadraten');
		expect(sections?.map((s) => s.id)).toEqual([
			null,
			'anlaeufe',
			'hinschauen',
			's1',
			's2',
			's3',
			's4',
			's5',
			's6',
			'quellen'
		]);
		const s1 = sections?.find((s) => s.id === 's1');
		expect(s1?.heading).toBe('Ein Quadrat, eine Wahl');
		expect(s1?.html).toContain('Friedrichshain-Kreuzberg');
		expect(s1?.html).not.toContain('<h2');
		expect(JSON.stringify(sections)).not.toContain('abschnitt');
		expect(bodyHtml).toBe('');
	});

	it('Berlin in Quadraten: EN hat dieselben Abschnitte mit englischen Überschriften', () => {
		overwriteGetLocale(() => 'de');
		const de = run('berlin-in-quadraten').sections?.map((s) => s.id);
		overwriteGetLocale(() => 'en');
		const { sections } = run('berlin-in-quadraten');
		expect(sections?.map((s) => s.id)).toEqual(de);
		expect(sections?.find((s) => s.id === 's1')?.heading).toBe('One square, one election');
	});

	it('Berlin in Quadraten: Fußnote zu BTW 2021 steht in den Quellen (#194)', () => {
		const quellen = run('berlin-in-quadraten').sections?.find((s) => s.id === 'quellen');
		expect(quellen?.html).toContain('Wiederholungswahl vom Februar 2024');
	});

	it('Berlin in Quadraten: liefert die Wahldaten aller 12 Bezirke, andere Beiträge nicht', () => {
		const { wahlDaten } = run('berlin-in-quadraten');
		expect(wahlDaten?.bezirke).toHaveLength(12);
		expect(wahlDaten?.berlin).toBeDefined();
		expect(run('punkt-linie-kiez-bezirke').wahlDaten).toBeUndefined();
		expect(run('punkt-linie-kiez-bezirke').sections).toBeUndefined();
	});
});
