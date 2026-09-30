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
});
