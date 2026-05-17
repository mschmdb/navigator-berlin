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
			tags: ['BigTag'],
			body: 'Z'
		});
		expect(r.ok).toBe(false);
	});
});
