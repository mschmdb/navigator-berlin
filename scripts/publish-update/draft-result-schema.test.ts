import { describe, expect, it } from 'vitest';
import { parseDraftResult } from './draft-result-schema.js';

describe('parseDraftResult', () => {
	it('akzeptiert gültigen skip', () => {
		const r = parseDraftResult({ kind: 'skip', reason: 'kein public-relevanter Inhalt' });
		expect(r.ok).toBe(true);
	});

	it('akzeptiert gültigen draft', () => {
		const r = parseDraftResult({
			kind: 'draft',
			category: 'feature',
			title_de: 'Neuer Karten-Modus',
			summary_de: 'Compare-View jetzt für 2 Adressen verfügbar.',
			title_en: 'New map mode',
			summary_en: 'Compare view now available for 2 addresses.',
			body_en: 'Body text.',
			tags: ['feature', 'compare'],
			body: 'Body-Text.'
		});
		expect(r.ok).toBe(true);
	});

	it('lehnt unbekanntes kind ab', () => {
		const r = parseDraftResult({ kind: 'maybe', reason: 'unsicher' });
		expect(r.ok).toBe(false);
	});

	it('lehnt invalide category ab', () => {
		const r = parseDraftResult({
			kind: 'draft',
			category: 'random',
			title_de: 'X',
			summary_de: 'Y',
			title_en: 'X',
			summary_en: 'Y',
			body_en: 'Z',
			tags: [],
			body: 'Z'
		});
		expect(r.ok).toBe(false);
	});

	it('lehnt title_de > 80 Z ab', () => {
		const r = parseDraftResult({
			kind: 'draft',
			category: 'feature',
			title_de: 'a'.repeat(81),
			summary_de: 'Y',
			title_en: 'X',
			summary_en: 'Y',
			body_en: 'Z',
			tags: [],
			body: 'Z'
		});
		expect(r.ok).toBe(false);
	});

	it('lehnt summary_de > 160 Z ab', () => {
		const r = parseDraftResult({
			kind: 'draft',
			category: 'feature',
			title_de: 'X',
			summary_de: 'a'.repeat(161),
			title_en: 'X',
			summary_en: 'Y',
			body_en: 'Z',
			tags: [],
			body: 'Z'
		});
		expect(r.ok).toBe(false);
	});

	it('lehnt mehr als 8 tags ab', () => {
		const r = parseDraftResult({
			kind: 'draft',
			category: 'feature',
			title_de: 'X',
			summary_de: 'Y',
			title_en: 'X',
			summary_en: 'Y',
			body_en: 'Z',
			tags: Array.from({ length: 9 }, (_, i) => `tag${i}`),
			body: 'Z'
		});
		expect(r.ok).toBe(false);
	});

	it('lehnt Uppercase-Tag ab (nur lowercase-kebab erlaubt)', () => {
		const r = parseDraftResult({
			kind: 'draft',
			category: 'feature',
			title_de: 'X',
			summary_de: 'Y',
			title_en: 'X',
			summary_en: 'Y',
			body_en: 'Z',
			tags: ['BigTag'],
			body: 'Z'
		});
		expect(r.ok).toBe(false);
	});

	describe('EN-Fassung (i18n C4d)', () => {
		const valid = {
			kind: 'draft',
			category: 'feature',
			title_de: 'Neuer Karten-Modus',
			summary_de: 'Compare-View jetzt für 2 Adressen verfügbar.',
			title_en: 'New map mode',
			summary_en: 'Compare view now available for 2 addresses.',
			tags: ['feature'],
			body: 'Body-Text.',
			body_en: 'Body text.'
		};

		it('übernimmt title_en, summary_en und body_en', () => {
			const r = parseDraftResult(valid);
			expect(r.ok).toBe(true);
			if (!r.ok || r.value.kind !== 'draft') throw new Error('unreachable');
			expect(r.value.title_en).toBe('New map mode');
			expect(r.value.summary_en).toBe('Compare view now available for 2 addresses.');
			expect(r.value.body_en).toBe('Body text.');
		});

		it.each(['title_en', 'summary_en', 'body_en'])('lehnt draft ohne %s ab', (field) => {
			const { [field]: _omit, ...rest } = valid as Record<string, unknown>;
			void _omit;
			expect(parseDraftResult(rest).ok).toBe(false);
		});

		it('lehnt leeren body_en ab', () => {
			expect(parseDraftResult({ ...valid, body_en: '' }).ok).toBe(false);
		});

		it('lehnt title_en > 80 Z ab', () => {
			expect(parseDraftResult({ ...valid, title_en: 'a'.repeat(81) }).ok).toBe(false);
		});

		it('lehnt summary_en > 160 Z ab', () => {
			expect(parseDraftResult({ ...valid, summary_en: 'a'.repeat(161) }).ok).toBe(false);
		});
	});
});
