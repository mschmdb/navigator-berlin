import { describe, expect, it } from 'vitest';
import { loadStoriesWahl, parseStoriesWahl } from './wahl-daten';

describe('loadStoriesWahl', () => {
	it('lädt 12 Bezirke und alle Wahlen', () => {
		const d = loadStoriesWahl();
		expect(d.bezirke).toHaveLength(12);
		expect(d.wahlen).toHaveLength(9);
		expect(Object.keys(d.berlin)).toHaveLength(9);
	});

	it('lehnt eine fremde Schema-Version ab', () => {
		expect(() => parseStoriesWahl({ ...loadStoriesWahl(), schemaVersion: 2 })).toThrow();
	});

	it('lehnt einen Bezirk ohne Wahl ab', () => {
		const d = structuredClone(loadStoriesWahl()) as unknown as {
			bezirke: { wahlen: Record<string, unknown> }[];
		};
		delete d.bezirke[3].wahlen.agh21;
		expect(() => parseStoriesWahl(d)).toThrow(/agh21/);
	});
});
