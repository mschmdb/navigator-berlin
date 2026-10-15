import { describe, expect, it } from 'vitest';
import { classifyUpdateFilename, filenameOf } from './update-filename.js';

describe('classifyUpdateFilename', () => {
	it('erkennt DE-Eintrag', () => {
		expect(classifyUpdateFilename('2026-05-16-launch.md')).toEqual({
			kind: 'de',
			key: '2026-05-16-launch',
			date: '2026-05-16',
			slug: 'launch'
		});
	});

	it('Slug mit Punkt (v1.2) bleibt ganz', () => {
		expect(classifyUpdateFilename('2026-05-16-v1.2.md')).toMatchObject({
			kind: 'de',
			slug: 'v1.2'
		});
	});

	it('Slug auf -en oder -open ist kein EN-Suffix', () => {
		expect(classifyUpdateFilename('2026-05-16-foo-en.md')).toMatchObject({ slug: 'foo-en' });
		expect(classifyUpdateFilename('2026-05-16-open.md')).toMatchObject({ slug: 'open' });
	});

	it('erkennt EN-Schwester mit gleichem key', () => {
		expect(classifyUpdateFilename('2026-05-16-launch.en.md')).toEqual({
			kind: 'en',
			key: '2026-05-16-launch'
		});
	});

	it('.fr.md ist anderer Locale, kein Slug "launch.fr"', () => {
		expect(classifyUpdateFilename('2026-05-16-launch.fr.md')).toEqual({ kind: 'other-locale' });
	});

	it('ignoriert Dateien ohne Datumspräfix', () => {
		expect(classifyUpdateFilename('README.md')).toEqual({ kind: 'ignored' });
	});
});

describe('filenameOf', () => {
	it('liefert das letzte Segment', () => {
		expect(filenameOf('/_content/updates/x.md')).toBe('x.md');
		expect(filenameOf('x.md')).toBe('x.md');
	});
});
