import { describe, expect, it } from 'vitest';
import { buildStoriesIndex, buildStoryPosting, storyImagePath } from './jsonld-story.js';
import type { StoryEntry } from '$lib/content/stories/types.js';

const ORIGIN = 'https://navigator.berlin';

const full: StoryEntry = {
	slug: 'x',
	filePath: '/_content/stories/2026-10-31-x.md',
	frontmatter: {
		title: 'Titel',
		title_en: 'Title',
		summary: 'Kurz.',
		summary_en: 'Short.',
		date: '2026-10-31',
		series: 'Punkt, Linie, Kiez'
	},
	body: 'Text',
	bodyEn: 'Text EN'
};
const deOnly: StoryEntry = {
	...full,
	slug: 'y',
	frontmatter: { title: 'Nur DE', summary: 'Kurz.', date: '2026-10-01' },
	bodyEn: undefined
};

describe('buildStoryPosting', () => {
	it('DE: BlogPosting mit URL ohne Präfix', () => {
		const out = buildStoryPosting({ entry: full, origin: ORIGIN });
		expect(out['@type']).toBe('BlogPosting');
		expect(out.headline).toBe('Titel');
		expect(out.inLanguage).toBe('de-DE');
		expect(out.mainEntityOfPage['@id']).toBe('https://navigator.berlin/stories/x');
		expect(out.datePublished).toBe('2026-10-31');
		expect(out.keywords).toBe('Punkt, Linie, Kiez');
	});

	it('EN: englischer Text und /en-URL', () => {
		const out = buildStoryPosting({ entry: full, origin: ORIGIN, locale: 'en' });
		expect(out.headline).toBe('Title');
		expect(out.inLanguage).toBe('en-US');
		expect(out.mainEntityOfPage['@id']).toBe('https://navigator.berlin/en/stories/x');
	});

	it('EN ohne Übersetzung bleibt inLanguage de-DE', () => {
		const out = buildStoryPosting({ entry: deOnly, origin: ORIGIN, locale: 'en' });
		expect(out.inLanguage).toBe('de-DE');
		expect(out).not.toHaveProperty('keywords');
	});
});

describe('buildStoryPosting mit entferntem Body', () => {
	it('hasEnglishBody=true: EN bleibt en-US', () => {
		const stripped: StoryEntry = { ...full, body: '', bodyEn: undefined, hasEnglishBody: true };
		expect(buildStoryPosting({ entry: stripped, origin: ORIGIN, locale: 'en' }).inLanguage).toBe(
			'en-US'
		);
	});

	it('hasEnglishBody=false: EN fällt auf de-DE', () => {
		const stripped: StoryEntry = { ...full, body: '', bodyEn: undefined, hasEnglishBody: false };
		expect(buildStoryPosting({ entry: stripped, origin: ORIGIN, locale: 'en' }).inLanguage).toBe(
			'de-DE'
		);
	});

	it('ohne Body und ohne hasEnglishBody: EN fällt auf de-DE', () => {
		const stripped: StoryEntry = { ...full, bodyEn: undefined };
		expect(buildStoryPosting({ entry: stripped, origin: ORIGIN, locale: 'en' }).inLanguage).toBe(
			'de-DE'
		);
	});
});

describe('buildStoriesIndex', () => {
	it('Blog mit Beiträgen, neueste zuerst, ohne verschachtelten @context', () => {
		const out = buildStoriesIndex({
			entries: [deOnly, full],
			origin: ORIGIN,
			name: 'Berlin Data Stories',
			description: 'Beschreibung'
		});
		expect(out['@type']).toBe('Blog');
		expect(out.url).toBe('https://navigator.berlin/stories');
		expect(out.blogPost.map((p) => p.headline)).toEqual(['Titel', 'Nur DE']);
		expect(out.blogPost[0]).not.toHaveProperty('@context');
	});
});

describe('Bild der Data Stories', () => {
	const withVisual: StoryEntry = {
		...full,
		frontmatter: { ...full.frontmatter, visual: 'punkt-linie-kiez-bezirke' }
	};
	const withPreview: StoryEntry = {
		...full,
		slug: 'p',
		frontmatter: { ...full.frontmatter, preview: 'punkt-linie-kiez-bezirke' }
	};

	it('nimmt das Stories-Bild bei visual oder preview, sonst das Home-Bild', () => {
		expect(storyImagePath(withVisual)).toBe('/og/page/stories.png');
		expect(storyImagePath(withPreview)).toBe('/og/page/stories.png');
		expect(storyImagePath(full)).toBe('/og/page/home.png');
	});

	it('trägt das Bild im BlogPosting, ein explizites Bild gewinnt', () => {
		expect(buildStoryPosting({ entry: withVisual, origin: ORIGIN }).image).toBe(
			'https://navigator.berlin/og/page/stories.png'
		);
		expect(buildStoryPosting({ entry: full, origin: ORIGIN }).image).toBe(
			'https://navigator.berlin/og/page/home.png'
		);
		expect(buildStoryPosting({ entry: full, origin: ORIGIN, image: 'https://x/y.png' }).image).toBe(
			'https://x/y.png'
		);
	});

	it('trägt das Stories-Bild im Blog der Übersicht', () => {
		const out = buildStoriesIndex({
			entries: [withPreview, full],
			origin: ORIGIN,
			name: 'n',
			description: 'd'
		});
		expect(out.image).toBe('https://navigator.berlin/og/page/stories.png');
		expect(out.blogPost.map((b) => b.image)).toEqual([
			'https://navigator.berlin/og/page/stories.png',
			'https://navigator.berlin/og/page/home.png'
		]);
	});
});
