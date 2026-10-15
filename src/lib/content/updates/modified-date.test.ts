import { describe, expect, it } from 'vitest';
import { entryModifiedDate } from './modified-date.js';
import type { UpdateEntry } from './types.js';

const entry = (updated?: string): UpdateEntry => ({
	slug: 'a',
	filePath: '/_content/updates/2026-05-15-a.md',
	frontmatter: {
		title_de: 'A',
		summary_de: 'S',
		date: '2026-05-15',
		category: 'feature',
		lang: 'de',
		...(updated ? { updated } : {})
	},
	body: ''
});

describe('entryModifiedDate', () => {
	it('nutzt updated, wenn gesetzt', () => {
		expect(entryModifiedDate(entry('2026-06-01'))).toBe('2026-06-01');
	});
	it('fällt auf date zurück', () => {
		expect(entryModifiedDate(entry())).toBe('2026-05-15');
	});
});
