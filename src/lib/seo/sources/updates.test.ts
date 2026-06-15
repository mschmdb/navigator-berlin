import { describe, expect, it } from 'vitest';
import { buildUpdatesSitemapEntries } from './updates.js';
import type { UpdateEntry } from '$lib/content/updates/types.js';

const fixtureEntry = (slug: string, date: string): UpdateEntry => ({
	slug,
	filePath: `/_content/updates/${date}-${slug}.md`,
	frontmatter: {
		title_de: `Update ${slug}`,
		summary_de: `Summary ${slug}.`,
		date,
		category: 'feature',
		lang: 'de'
	},
	body: 'Body'
});

const ORIGIN = 'https://navigator.berlin';

describe('buildUpdatesSitemapEntries', () => {
	it('leere Liste → leere Sitemap-Entries', () => {
		expect(buildUpdatesSitemapEntries({ entries: [], origin: ORIGIN })).toEqual([]);
	});

	it('liefert Index + per-Entry Detail-URLs', () => {
		const entries = [fixtureEntry('launch', '2026-05-15'), fixtureEntry('mss-2025', '2026-04-20')];
		const out = buildUpdatesSitemapEntries({ entries, origin: ORIGIN });
		const locs = out.map((e) => e.loc);
		expect(locs).toContain('https://navigator.berlin/updates');
		expect(locs).toContain('https://navigator.berlin/updates/launch');
		expect(locs).toContain('https://navigator.berlin/updates/mss-2025');
	});

	it('Index hat priority 0.6 und lastmod = neuestes Entry-Datum', () => {
		const entries = [fixtureEntry('launch', '2026-05-15'), fixtureEntry('mss-2025', '2026-04-20')];
		const out = buildUpdatesSitemapEntries({ entries, origin: ORIGIN });
		const index = out.find((e) => e.loc === 'https://navigator.berlin/updates');
		expect(index?.priority).toBeCloseTo(0.6, 5);
		expect(index?.lastmod).toBe('2026-05-15');
	});

	it('Detail-Entries haben priority 0.7 und lastmod = entry-date', () => {
		const entries = [fixtureEntry('launch', '2026-05-15')];
		const out = buildUpdatesSitemapEntries({ entries, origin: ORIGIN });
		const detail = out.find((e) => e.loc === 'https://navigator.berlin/updates/launch');
		expect(detail?.priority).toBeCloseTo(0.7, 5);
		expect(detail?.lastmod).toBe('2026-05-15');
	});
});
