import { describe, expect, it } from 'vitest';
import { buildAtomXml } from './build-atom.js';
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

const origin = 'https://navigator.berlin';
const buildTimestamp = '2026-05-16T10:00:00.000Z';

describe('buildAtomXml', () => {
	it('rendert Atom-1.0-Root', () => {
		const xml = buildAtomXml({ entries: [entry], origin, buildTimestamp });
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
	});

	it('enthält Feed-Meta', () => {
		const xml = buildAtomXml({ entries: [entry], origin, buildTimestamp });
		expect(xml).toContain('<id>https://navigator.berlin/updates/atom.xml</id>');
		expect(xml).toContain('<title>Navigator Berlin · Updates</title>');
		expect(xml).toContain('<updated>2026-05-16T10:00:00.000Z</updated>');
		expect(xml).toContain('<author>');
		expect(xml).toContain('<name>Navigator Berlin</name>');
		expect(xml).toContain(
			'<link rel="self" type="application/atom+xml" href="https://navigator.berlin/updates/atom.xml"'
		);
		expect(xml).toContain(
			'<link rel="alternate" type="text/html" href="https://navigator.berlin/updates"'
		);
	});

	it('enthält Entry mit id, title, updated, published, link, summary, category', () => {
		const xml = buildAtomXml({ entries: [entry], origin, buildTimestamp });
		expect(xml).toContain('<id>https://navigator.berlin/updates/launch</id>');
		expect(xml).toContain('<title>Launch · Test</title>');
		expect(xml).toMatch(/<updated>2026-05-15T00:00:00\.000Z<\/updated>/);
		expect(xml).toMatch(/<published>2026-05-15T00:00:00\.000Z<\/published>/);
		expect(xml).toContain('<category term="feature"');
		expect(xml).toContain('<summary type="text">Erster Eintrag im Feed.</summary>');
	});

	it('escapt Spezialzeichen', () => {
		const esc: UpdateEntry = {
			...entry,
			frontmatter: { ...entry.frontmatter, title_de: 'A & B' }
		};
		const xml = buildAtomXml({ entries: [esc], origin, buildTimestamp });
		expect(xml).toContain('<title>A &amp; B</title>');
	});
});
