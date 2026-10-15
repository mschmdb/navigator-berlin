import { describe, expect, it } from 'vitest';
import { loadUpdatesFromModules } from '$lib/content/updates/load-updates.js';
import { buildAtomXml } from './build-atom.js';
import { buildJsonFeed } from './build-json-feed.js';
import { buildRssXml } from './build-rss.js';

const de = `---
title_de: Deutscher Titel
title_en: English title
summary_de: Deutsche Zusammenfassung.
summary_en: English summary.
date: 2026-05-15
category: feature
---

Deutscher Body.
`;

const entries = loadUpdatesFromModules({
	'/_content/updates/2026-05-15-a.md': de,
	'/_content/updates/2026-05-15-a.en.md': 'English body.'
});
const origin = 'https://navigator.berlin';

describe('Feeds mit .en.md-Schwester', () => {
	it('RSS enthält genau einen DE-Eintrag ohne .en-Duplikat', () => {
		const xml = buildRssXml({ entries, origin, buildTimestamp: '2026-05-16T00:00:00.000Z' });
		expect(xml.match(/<item>/g)).toHaveLength(1);
		expect(xml).toContain('Deutscher Titel');
		expect(xml).not.toContain('English');
		expect(xml).not.toContain('/updates/a.en');
	});

	it('Atom enthält genau einen DE-Eintrag ohne .en-Duplikat', () => {
		const xml = buildAtomXml({ entries, origin, buildTimestamp: '2026-05-16T00:00:00.000Z' });
		expect(xml.match(/<entry>/g)).toHaveLength(1);
		expect(xml).toContain('Deutscher Titel');
		expect(xml).not.toContain('English');
		expect(xml).not.toContain('/updates/a.en');
	});

	it('JSON Feed enthält genau einen DE-Eintrag ohne .en-Duplikat', () => {
		const feed = buildJsonFeed({ entries, origin });
		const json = JSON.stringify(feed);
		expect(feed.items).toHaveLength(1);
		expect(feed.items[0]?.title).toBe('Deutscher Titel');
		expect(json).not.toContain('English');
		expect(json).not.toContain('a.en');
	});

	it('Atom <updated> nutzt updated, <published> bleibt date', () => {
		const updated = loadUpdatesFromModules({
			'/_content/updates/2026-05-15-a.md': de.replace(
				'category: feature',
				'category: feature\nupdated: 2026-06-01'
			),
			'/_content/updates/2026-05-15-a.en.md': 'English body.'
		});
		const xml = buildAtomXml({
			entries: updated,
			origin,
			buildTimestamp: '2026-07-01T00:00:00.000Z'
		});
		expect(xml).toContain('<updated>2026-06-01T00:00:00.000Z</updated>');
		expect(xml).toContain('<published>2026-05-15T00:00:00.000Z</published>');
	});

	it('JSON Feed date_modified nutzt updated, sonst date', () => {
		const updated = loadUpdatesFromModules({
			'/_content/updates/2026-05-15-a.md': de.replace(
				'category: feature',
				'category: feature\nupdated: 2026-06-01'
			),
			'/_content/updates/2026-05-15-a.en.md': 'English body.'
		});
		expect(buildJsonFeed({ entries: updated, origin }).items[0]?.date_modified).toBe(
			'2026-06-01T00:00:00.000Z'
		);
		expect(buildJsonFeed({ entries, origin }).items[0]?.date_modified).toBe(
			'2026-05-15T00:00:00.000Z'
		);
	});
});
