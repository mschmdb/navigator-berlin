import { describe, expect, it } from 'vitest';
import { loadStoriesFromModules } from './load-stories.js';
import { localizeStory } from './localize-story.js';

const de = (date: string, extra = '') =>
	`---\ntitle: Titel\nsummary: Kurztext.\ndate: ${date}\n${extra}---\n\nText.\n`;

describe('loadStoriesFromModules', () => {
	it('sortiert neueste zuerst und leitet den Slug aus dem Dateinamen ab', () => {
		const entries = loadStoriesFromModules({
			'/_content/stories/2026-10-01-alt.md': de('2026-10-01'),
			'/_content/stories/2026-10-31-neu.md': de('2026-10-31')
		});
		expect(entries.map((e) => e.slug)).toEqual(['neu', 'alt']);
		expect(entries[0]?.body).toBe('Text.');
		expect(entries[0]?.frontmatter.date).toBe('2026-10-31');
	});

	it('paart die EN-Schwester', () => {
		const [entry] = loadStoriesFromModules({
			'/_content/stories/2026-10-31-x.md': de(
				'2026-10-31',
				'title_en: Title\nsummary_en: Short.\n'
			),
			'/_content/stories/2026-10-31-x.en.md': 'English text.\n'
		});
		expect(entry?.bodyEn).toBe('English text.');
	});

	it('lässt Dateien ohne Datumspräfix aus', () => {
		expect(loadStoriesFromModules({ '/_content/stories/README.md': '# Hi' })).toEqual([]);
	});

	it('wirft bei Schema-Verstoß mit Pfad', () => {
		expect(() =>
			loadStoriesFromModules({ '/_content/stories/2026-10-31-x.md': '---\ntitle: A\n---\nx' })
		).toThrow(/2026-10-31-x\.md.*summary/s);
	});

	it('wirft bei ungültigem Datum', () => {
		expect(() =>
			loadStoriesFromModules({ '/_content/stories/2026-10-31-x.md': de('31.10.2026') })
		).toThrow(/date/);
	});

	it('wirft bei EN-Schwester ohne DE-Datei', () => {
		expect(() =>
			loadStoriesFromModules({ '/_content/stories/2026-10-31-x.en.md': 'English' })
		).toThrow(/ohne DE-Datei/);
	});

	it('wirft bei EN-Schwester ohne title_en/summary_en', () => {
		expect(() =>
			loadStoriesFromModules({
				'/_content/stories/2026-10-31-x.md': de('2026-10-31'),
				'/_content/stories/2026-10-31-x.en.md': 'English'
			})
		).toThrow(/title_en, summary_en/);
	});

	it('wirft bei Frontmatter in der EN-Schwester und bei fremdem Locale-Suffix', () => {
		expect(() =>
			loadStoriesFromModules({
				'/_content/stories/2026-10-31-x.md': de('2026-10-31', 'title_en: T\nsummary_en: S\n'),
				'/_content/stories/2026-10-31-x.en.md': '---\ntitle: T\n---\nx'
			})
		).toThrow(/kein Frontmatter/);
		expect(() => loadStoriesFromModules({ '/_content/stories/2026-10-31-x.fr.md': 'x' })).toThrow(
			/Locale-Suffix/
		);
	});

	it('wirft bei Nicht-String-Modulen', () => {
		expect(() => loadStoriesFromModules({ '/_content/stories/2026-10-31-x.md': {} })).toThrow(
			/Raw-String/
		);
	});
});

describe('localizeStory', () => {
	const [full] = loadStoriesFromModules({
		'/_content/stories/2026-10-31-x.md': de('2026-10-31', 'title_en: Title\nsummary_en: Short.\n'),
		'/_content/stories/2026-10-31-x.en.md': 'English text.'
	});
	const [deOnly] = loadStoriesFromModules({
		'/_content/stories/2026-10-31-y.md': de('2026-10-31')
	});

	it('DE liefert deutsche Felder ohne Fallback', () => {
		expect(localizeStory(full!, 'de')).toMatchObject({ title: 'Titel', bodyIsDeFallback: false });
	});

	it('EN liefert englische Felder', () => {
		expect(localizeStory(full!, 'en')).toMatchObject({
			title: 'Title',
			summary: 'Short.',
			body: 'English text.',
			titleIsDeFallback: false
		});
	});

	it('EN ohne Übersetzung fällt je Feld auf DE zurück', () => {
		expect(localizeStory(deOnly!, 'en')).toMatchObject({
			title: 'Titel',
			body: 'Text.',
			titleIsDeFallback: true,
			summaryIsDeFallback: true,
			bodyIsDeFallback: true
		});
	});
});
