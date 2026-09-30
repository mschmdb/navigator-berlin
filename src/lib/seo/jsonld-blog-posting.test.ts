import { describe, expect, it } from 'vitest';
import { buildBlogPosting, buildBlogIndex } from './jsonld-blog-posting.js';
import type { UpdateEntry } from '$lib/content/updates/types.js';

const entry: UpdateEntry = {
	slug: 'launch',
	filePath: '/_content/updates/2026-05-15-launch.md',
	frontmatter: {
		title_de: 'Launch · Test',
		summary_de: 'Erster Eintrag.',
		date: '2026-05-15',
		category: 'feature',
		tags: ['launch', 'demo'],
		lang: 'de'
	},
	body: 'Body'
};

const origin = 'https://navigator.berlin';

describe('buildBlogPosting', () => {
	it('hat @context und @type BlogPosting', () => {
		const obj = buildBlogPosting({ entry, origin });
		expect(obj['@context']).toBe('https://schema.org');
		expect(obj['@type']).toBe('BlogPosting');
	});

	it('hat headline, datePublished, dateModified, description, articleSection, inLanguage', () => {
		const obj = buildBlogPosting({ entry, origin });
		expect(obj.headline).toBe('Launch · Test');
		expect(obj.datePublished).toBe('2026-05-15');
		expect(obj.dateModified).toBe('2026-05-15');
		expect(obj.description).toBe('Erster Eintrag.');
		expect(obj.articleSection).toBe('feature');
		expect(obj.inLanguage).toBe('de-DE');
	});

	it('hat author + publisher als Organization', () => {
		const obj = buildBlogPosting({ entry, origin });
		expect(obj.author['@type']).toBe('Organization');
		expect(obj.author.name).toBe('Navigator Berlin');
	});

	it('hat mainEntityOfPage = WebPage mit @id', () => {
		const obj = buildBlogPosting({ entry, origin });
		expect(obj.mainEntityOfPage['@type']).toBe('WebPage');
		expect(obj.mainEntityOfPage['@id']).toBe('https://navigator.berlin/updates/launch');
	});

	// Code-review fix: inLanguage muss über localeToBcp47 kommen statt einem
	// hartcodierten 'de'|'en'-Ternary -- hier die EN-Fassung eines Eintrags.
	it('inLanguage = en-US wenn frontmatter.lang = en', () => {
		const enEntry: UpdateEntry = {
			...entry,
			frontmatter: { ...entry.frontmatter, lang: 'en' }
		};
		const obj = buildBlogPosting({ entry: enEntry, origin });
		expect(obj.inLanguage).toBe('en-US');
	});

	it('hat keywords aus tags (komma-getrennt)', () => {
		const obj = buildBlogPosting({ entry, origin });
		expect(obj.keywords).toBe('launch, demo');
	});

	it('laesst keywords weg wenn keine tags', () => {
		const noTags: UpdateEntry = {
			...entry,
			frontmatter: { ...entry.frontmatter, tags: undefined }
		};
		const obj = buildBlogPosting({ entry: noTags, origin });
		expect(obj.keywords).toBeUndefined();
	});
});

describe('buildBlogIndex', () => {
	it('hat @type Blog mit blogPost-Liste', () => {
		const obj = buildBlogIndex({ entries: [entry], origin });
		expect(obj['@type']).toBe('Blog');
		expect(obj.blogPost).toHaveLength(1);
		expect(obj.blogPost[0]['@type']).toBe('BlogPosting');
	});

	it('cap auf 10 Posts in Index', () => {
		const many: UpdateEntry[] = Array.from({ length: 15 }, (_, i) => ({
			...entry,
			slug: `e${i}`,
			frontmatter: {
				...entry.frontmatter,
				date: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`
			}
		}));
		const obj = buildBlogIndex({ entries: many, origin });
		expect(obj.blogPost).toHaveLength(10);
	});

	it('inLanguage ist de-DE (baseLocale) über localeToBcp47', () => {
		const obj = buildBlogIndex({ entries: [entry], origin });
		expect(obj.inLanguage).toBe('de-DE');
	});
});

describe('BlogPosting und Blog-Index in der Seiten-Locale (i18n C4d)', () => {
	const enEntry: UpdateEntry = {
		...entry,
		frontmatter: {
			...entry.frontmatter,
			title_en: 'Launch test',
			summary_en: 'First entry.'
		},
		bodyEn: 'English body.'
	};

	it('EN: englischer Titel, Summary, /en-URL und en-US', () => {
		const obj = buildBlogPosting({ entry: enEntry, origin, locale: 'en' });
		expect(obj.headline).toBe('Launch test');
		expect(obj.description).toBe('First entry.');
		expect(obj.inLanguage).toBe('en-US');
		expect(obj.mainEntityOfPage['@id']).toBe('https://navigator.berlin/en/updates/launch');
	});

	it('EN ohne EN-Felder: DE-Text, inLanguage de-DE, /en-URL', () => {
		const obj = buildBlogPosting({ entry, origin, locale: 'en' });
		expect(obj.headline).toBe('Launch · Test');
		expect(obj.description).toBe('Erster Eintrag.');
		expect(obj.inLanguage).toBe('de-DE');
		expect(obj.mainEntityOfPage['@id']).toBe('https://navigator.berlin/en/updates/launch');
	});

	it('EN: fehlt nur die Summary oder nur der Body, bleibt inLanguage de-DE', () => {
		const noSummary: UpdateEntry = {
			...enEntry,
			frontmatter: { ...enEntry.frontmatter, summary_en: undefined }
		};
		const noBody: UpdateEntry = { ...enEntry, bodyEn: undefined };
		expect(buildBlogPosting({ entry: noSummary, origin, locale: 'en' }).inLanguage).toBe('de-DE');
		expect(buildBlogPosting({ entry: noBody, origin, locale: 'en' }).inLanguage).toBe('de-DE');
	});

	it('DE bleibt ohne locale-Argument unverändert', () => {
		const obj = buildBlogPosting({ entry: enEntry, origin });
		expect(obj.headline).toBe('Launch · Test');
		expect(obj.mainEntityOfPage['@id']).toBe('https://navigator.berlin/updates/launch');
	});

	it('Blog-Index EN: /en/updates, en-US, englische Posts', () => {
		const obj = buildBlogIndex({
			entries: [enEntry],
			origin,
			locale: 'en',
			description: 'Data updates, features, methodology changes.'
		});
		expect(obj.url).toBe('https://navigator.berlin/en/updates');
		expect(obj.inLanguage).toBe('en-US');
		expect(obj.description).toBe('Data updates, features, methodology changes.');
		expect(obj.blogPost[0]?.headline).toBe('Launch test');
		expect(obj.blogPost[0]?.mainEntityOfPage['@id']).toBe(
			'https://navigator.berlin/en/updates/launch'
		);
	});
});
