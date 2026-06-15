import { describe, expect, it } from 'vitest';
import {
	extractSlugFromPath,
	parseUpdateModule,
	sortByDateDesc,
	latestUpdates,
	loadUpdatesFromModules
} from './load-updates.js';
import type { UpdateEntry } from './types.js';

const fixtureA = `---
title_de: A-Update neu
summary_de: Neueste Änderung an Datensatz A.
date: 2026-05-15
category: daten-update
---

# Body A

Erster Absatz.
`;

const fixtureB = `---
title_de: B-Update älter
summary_de: Frühere Änderung an Datensatz B.
date: 2026-04-01
category: feature
tags: [feature, dashboard]
---

Body B.
`;

describe('extractSlugFromPath', () => {
	it('strippt Date-Prefix + .md-Endung', () => {
		expect(extractSlugFromPath('/_content/updates/2026-05-15-launch.md')).toBe('launch');
		expect(extractSlugFromPath('/_content/updates/2026-04-01-stolpersteine-sync.md')).toBe(
			'stolpersteine-sync'
		);
	});

	it('wirft bei Filename ohne Date-Prefix', () => {
		expect(() => extractSlugFromPath('/_content/updates/launch.md')).toThrow(/YYYY-MM-DD/);
	});

	it('wirft bei .en.md-Suffix (Phase 1 DE-only)', () => {
		// Phase 1: EN-Variante nicht implementiert
		const slug = extractSlugFromPath('/_content/updates/2026-05-15-launch.md');
		expect(slug).toBe('launch');
	});
});

describe('parseUpdateModule', () => {
	it('parsed Frontmatter + Body korrekt', () => {
		const entry = parseUpdateModule('/_content/updates/2026-05-15-launch.md', fixtureA);
		expect(entry.slug).toBe('launch');
		expect(entry.frontmatter.title_de).toBe('A-Update neu');
		expect(entry.frontmatter.category).toBe('daten-update');
		expect(entry.body).toContain('# Body A');
		expect(entry.body).toContain('Erster Absatz.');
	});

	it('parsed Tags-Array korrekt', () => {
		const entry = parseUpdateModule('/_content/updates/2026-04-01-feat.md', fixtureB);
		expect(entry.frontmatter.tags).toEqual(['feature', 'dashboard']);
	});

	it('wirft mit Datei-Pfad-Kontext bei Frontmatter-Verstoß', () => {
		const bad = `---\ntitle_de: ok\n---\n\nbody\n`;
		expect(() => parseUpdateModule('/_content/updates/2026-05-15-bad.md', bad)).toThrow(
			/2026-05-15-bad\.md/
		);
	});
});

describe('sortByDateDesc', () => {
	it('sortiert neuestes Datum zuerst', () => {
		const a = parseUpdateModule('/_content/updates/2026-05-15-a.md', fixtureA);
		const b = parseUpdateModule('/_content/updates/2026-04-01-b.md', fixtureB);
		const sorted = sortByDateDesc([b, a]);
		expect(sorted[0]?.slug).toBe('a');
		expect(sorted[1]?.slug).toBe('b');
	});

	it('mutiert Input-Array nicht', () => {
		const a = parseUpdateModule('/_content/updates/2026-05-15-a.md', fixtureA);
		const b = parseUpdateModule('/_content/updates/2026-04-01-b.md', fixtureB);
		const input: UpdateEntry[] = [b, a];
		sortByDateDesc(input);
		expect(input[0]?.slug).toBe('b');
		expect(input[1]?.slug).toBe('a');
	});
});

describe('loadUpdatesFromModules', () => {
	it('überspringt Files ohne YYYY-MM-DD-Prefix (README, .gitkeep)', () => {
		const modules = {
			'/_content/updates/README.md': '# Readme\n\nNotes.',
			'/_content/updates/2026-05-15-a.md': fixtureA
		};
		const entries = loadUpdatesFromModules(modules);
		expect(entries).toHaveLength(1);
		expect(entries[0]?.slug).toBe('a');
	});
});

describe('latestUpdates', () => {
	it('liefert Top-N neueste', () => {
		const a = parseUpdateModule('/_content/updates/2026-05-15-a.md', fixtureA);
		const b = parseUpdateModule('/_content/updates/2026-04-01-b.md', fixtureB);
		const top1 = latestUpdates([b, a], 1);
		expect(top1).toHaveLength(1);
		expect(top1[0]?.slug).toBe('a');
	});

	it('liefert alle bei n > length', () => {
		const a = parseUpdateModule('/_content/updates/2026-05-15-a.md', fixtureA);
		expect(latestUpdates([a], 5)).toHaveLength(1);
	});
});
