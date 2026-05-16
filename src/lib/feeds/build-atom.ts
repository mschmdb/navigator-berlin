import type { UpdateEntry } from '$lib/content/updates/types.js';
import { escapeXml } from './escape-xml.js';
import { sortByDateDesc } from '$lib/content/updates/load-updates.js';

/**
 * Story 2.13 AC-6: Atom 1.0 Feed Builder.
 * Spec: RFC 4287 (https://datatracker.ietf.org/doc/html/rfc4287)
 */

export interface BuildAtomInput {
	readonly entries: readonly UpdateEntry[];
	readonly origin: string;
	readonly buildTimestamp: string;
	readonly maxItems?: number;
}

const MAX_ITEMS_DEFAULT = 50;

export function buildAtomXml(input: BuildAtomInput): string {
	const max = input.maxItems ?? MAX_ITEMS_DEFAULT;
	const sorted = sortByDateDesc(input.entries).slice(0, max);
	const origin = input.origin.replace(/\/+$/, '');

	const entries = sorted.map((entry) => renderEntry(entry, origin)).join('\n');

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<feed xmlns="http://www.w3.org/2005/Atom">',
		`\t<id>${origin}/updates/atom.xml</id>`,
		`\t<title>Navigator Berlin · Updates</title>`,
		`\t<updated>${escapeXml(input.buildTimestamp)}</updated>`,
		`\t<author>`,
		`\t\t<name>Navigator Berlin</name>`,
		`\t</author>`,
		`\t<link rel="self" type="application/atom+xml" href="${origin}/updates/atom.xml" />`,
		`\t<link rel="alternate" type="text/html" href="${origin}/updates" />`,
		entries,
		'</feed>',
		''
	].join('\n');
}

function renderEntry(entry: UpdateEntry, origin: string): string {
	const id = `${origin}/updates/${entry.slug}`;
	const dateIso = `${entry.frontmatter.date}T00:00:00.000Z`;
	return [
		'\t<entry>',
		`\t\t<id>${id}</id>`,
		`\t\t<title>${escapeXml(entry.frontmatter.title_de)}</title>`,
		`\t\t<updated>${dateIso}</updated>`,
		`\t\t<published>${dateIso}</published>`,
		`\t\t<link rel="alternate" type="text/html" href="${id}" />`,
		`\t\t<summary type="text">${escapeXml(entry.frontmatter.summary_de)}</summary>`,
		`\t\t<category term="${escapeXml(entry.frontmatter.category)}" />`,
		'\t</entry>'
	].join('\n');
}
