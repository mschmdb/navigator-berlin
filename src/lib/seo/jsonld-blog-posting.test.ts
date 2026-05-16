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
});
