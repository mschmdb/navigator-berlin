import { describe, expect, it } from 'vitest';
import { buildRssXml, toRfc822 } from './build-rss.js';
import type { UpdateEntry } from '$lib/content/updates/types.js';

const entry: UpdateEntry = {
	slug: 'launch',
	filePath: '/_content/updates/2026-05-15-launch.md',
	frontmatter: {
		title_de: 'Launch · Test',
		summary_de: 'Erster Eintrag im Feed.',
		date: '2026-05-15',
		category: 'feature',
		lang: 'de'
	},
	body: 'Body'
};

describe('toRfc822', () => {
	it('konvertiert YYYY-MM-DD zu RFC-822', () => {
		const out = toRfc822('2026-05-15');
		// RFC-822: "Fri, 15 May 2026 00:00:00 GMT" (oder +0000)
		expect(out).toMatch(/15 May 2026/);
		expect(out).toMatch(/00:00:00/);
	});
});

describe('buildRssXml', () => {
	const buildTimestamp = '2026-05-16T10:00:00.000Z';
	const origin = 'https://navigator.berlin';

	it('rendert XML-Header + rss-Root mit version 2.0', () => {
		const xml = buildRssXml({ entries: [entry], origin, buildTimestamp });
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain('xmlns:atom=');
	});

	it('enthält Channel-Meta', () => {
		const xml = buildRssXml({ entries: [entry], origin, buildTimestamp });
		expect(xml).toContain('<title>Navigator Berlin · Updates</title>');
		expect(xml).toContain('<link>https://navigator.berlin/updates</link>');
		expect(xml).toContain('<language>de-DE</language>');
		expect(xml).toContain(
			'<atom:link href="https://navigator.berlin/updates/rss.xml" rel="self"'
		);
	});

	it('enthält Item mit title, link, guid, pubDate, category', () => {
		const xml = buildRssXml({ entries: [entry], origin, buildTimestamp });
		expect(xml).toContain('<title>Launch · Test</title>');
		expect(xml).toContain('<link>https://navigator.berlin/updates/launch</link>');
		expect(xml).toContain(
			'<guid isPermaLink="true">https://navigator.berlin/updates/launch</guid>'
		);
		expect(xml).toContain('<category>feature</category>');
		expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, 15 May 2026/);
	});

	it('escapt XML-Spezialzeichen in Title', () => {
		const escEntry: UpdateEntry = {
			...entry,
			frontmatter: { ...entry.frontmatter, title_de: 'Q & A <break>' }
		};
		const xml = buildRssXml({ entries: [escEntry], origin, buildTimestamp });
		expect(xml).toContain('<title>Q &amp; A &lt;break&gt;</title>');
	});

	it('cap auf max 50 Entries', () => {
		const many: UpdateEntry[] = Array.from({ length: 60 }, (_, i) => ({
			...entry,
			slug: `e${i}`,
			frontmatter: {
				...entry.frontmatter,
				date: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`
			}
		}));
		const xml = buildRssXml({ entries: many, origin, buildTimestamp });
		const itemMatches = xml.match(/<item>/g);
		expect(itemMatches?.length).toBe(50);
	});
});
