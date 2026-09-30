import { describe, expect, it } from 'vitest';
import { localizeUpdateEntry } from './localize-update-entry.js';
import type { UpdateEntry } from './types.js';

const full: UpdateEntry = {
	slug: 'a',
	filePath: '/_content/updates/2026-05-15-a.md',
	frontmatter: {
		title_de: 'Titel',
		title_en: 'Title',
		summary_de: 'Zusammenfassung.',
		summary_en: 'Summary.',
		date: '2026-05-15',
		category: 'feature',
		lang: 'de'
	},
	body: 'Deutscher Body.',
	bodyEn: 'English body.'
};

const deOnly: UpdateEntry = {
	...full,
	frontmatter: {
		title_de: 'Titel',
		summary_de: 'Zusammenfassung.',
		date: '2026-05-15',
		category: 'feature',
		lang: 'de'
	},
	bodyEn: undefined
};

describe('localizeUpdateEntry', () => {
	it('DE liefert die DE-Fassung ohne Fallback-Markierung', () => {
		expect(localizeUpdateEntry(full, 'de')).toEqual({
			title: 'Titel',
			summary: 'Zusammenfassung.',
			body: 'Deutscher Body.',
			titleIsDeFallback: false,
			summaryIsDeFallback: false,
			bodyIsDeFallback: false
		});
	});

	it('EN liefert die EN-Fassung ohne Fallback-Markierung', () => {
		expect(localizeUpdateEntry(full, 'en')).toEqual({
			title: 'Title',
			summary: 'Summary.',
			body: 'English body.',
			titleIsDeFallback: false,
			summaryIsDeFallback: false,
			bodyIsDeFallback: false
		});
	});

	it('EN ohne EN-Felder fällt je Feld auf DE zurück und markiert es', () => {
		expect(localizeUpdateEntry(deOnly, 'en')).toEqual({
			title: 'Titel',
			summary: 'Zusammenfassung.',
			body: 'Deutscher Body.',
			titleIsDeFallback: true,
			summaryIsDeFallback: true,
			bodyIsDeFallback: true
		});
	});

	it('Felder fallen unabhängig voneinander zurück', () => {
		const partial: UpdateEntry = {
			...full,
			frontmatter: { ...full.frontmatter, summary_en: undefined }
		};
		const r = localizeUpdateEntry(partial, 'en');
		expect(r.title).toBe('Title');
		expect(r.titleIsDeFallback).toBe(false);
		expect(r.summary).toBe('Zusammenfassung.');
		expect(r.summaryIsDeFallback).toBe(true);
		expect(r.bodyIsDeFallback).toBe(false);
	});

	it('leeres oder whitespace-only title_en zählt als fehlend', () => {
		const blank: UpdateEntry = {
			...full,
			frontmatter: { ...full.frontmatter, title_en: '   ' }
		};
		const r = localizeUpdateEntry(blank, 'en');
		expect(r.title).toBe('Titel');
		expect(r.titleIsDeFallback).toBe(true);
	});
});
