import type { UpdateEntry } from '$lib/content/updates/types.js';
import { escapeXml } from './escape-xml.js';
import { sortByDateDesc } from '$lib/content/updates/load-updates.js';

/**
 * Story 2.13 AC-5: RSS 2.0 Feed Builder für Update-Entries.
 * Spec: https://www.rssboard.org/rss-specification
 *
 * Phase 1: DE-only Feed (memory `project_i18n_phase_1_de_only`).
 */

export interface BuildRssInput {
	readonly entries: readonly UpdateEntry[];
	readonly origin: string;
	readonly buildTimestamp: string;
	/** Optional Cap. Default 50 Entries pro Spec-Empfehlung. */
	readonly maxItems?: number;
}

const MAX_ITEMS_DEFAULT = 50;

const RFC822_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const RFC822_MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

/**
 * Konvertiert ISO-`YYYY-MM-DD` zu RFC-822 `"Day, DD Mon YYYY 00:00:00 +0000"`.
 * Datum wird als UTC-Mitternacht interpretiert.
 */
export function toRfc822(isoDate: string): string {
	const d = new Date(`${isoDate}T00:00:00.000Z`);
	if (Number.isNaN(d.getTime())) {
		throw new Error(`toRfc822: ungültiges Datum ${isoDate}`);
	}
	const day = RFC822_DAYS[d.getUTCDay()];
	const date = String(d.getUTCDate()).padStart(2, '0');
	const month = RFC822_MONTHS[d.getUTCMonth()];
	const year = d.getUTCFullYear();
	return `${day}, ${date} ${month} ${year} 00:00:00 +0000`;
}

export function buildRssXml(input: BuildRssInput): string {
	const max = input.maxItems ?? MAX_ITEMS_DEFAULT;
	const sorted = sortByDateDesc(input.entries).slice(0, max);
	const origin = input.origin.replace(/\/+$/, '');

	const items = sorted
		.map((entry) => renderItem(entry, origin))
		.join('\n');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		'\t<channel>',
		`\t\t<title>Navigator Berlin · Updates</title>`,
		`\t\t<link>${origin}/updates</link>`,
		`\t\t<description>Daten-Updates, Features, Methodik-Änderungen.</description>`,
		`\t\t<language>de-DE</language>`,
		`\t\t<atom:link href="${origin}/updates/rss.xml" rel="self" type="application/rss+xml" />`,
		`\t\t<lastBuildDate>${escapeXml(input.buildTimestamp)}</lastBuildDate>`,
		items,
		'\t</channel>',
		'</rss>',
		''
	].join('\n');
}

function renderItem(entry: UpdateEntry, origin: string): string {
	const link = `${origin}/updates/${entry.slug}`;
	return [
		'\t\t<item>',
		`\t\t\t<title>${escapeXml(entry.frontmatter.title_de)}</title>`,
		`\t\t\t<link>${escapeXml(link)}</link>`,
		`\t\t\t<guid isPermaLink="true">${escapeXml(link)}</guid>`,
		`\t\t\t<pubDate>${toRfc822(entry.frontmatter.date)}</pubDate>`,
		`\t\t\t<description><![CDATA[${entry.frontmatter.summary_de}]]></description>`,
		`\t\t\t<category>${escapeXml(entry.frontmatter.category)}</category>`,
		'\t\t</item>'
	].join('\n');
}
