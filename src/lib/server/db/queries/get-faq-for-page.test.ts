import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFaqForPage, type FaqEntry, type GetFaqQnaInput } from './get-faq-qna.js';

function row(locale: 'de' | 'en', question: string): FaqEntry {
	return {
		pageType: 'kiez',
		slug: 'x',
		cluster: 'laerm',
		locale,
		templateId: 't',
		question,
		answer: `${question} Antwort`
	} as unknown as FaqEntry;
}

const input: GetFaqQnaInput = { pageType: 'kiez', slug: 'x', locale: 'en' };

describe('getFaqForPage', () => {
	beforeEach(() => {
		vi.stubEnv('DATABASE_URL', 'postgres://test');
	});
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('liefert EN-Zeilen ohne Fallback', async () => {
		const fetchRows = vi.fn(async (i: GetFaqQnaInput) => [row(i.locale, 'How loud?')]);
		const result = await getFaqForPage(input, fetchRows);
		expect(result.locale).toBe('en');
		expect(result.items).toEqual([{ question: 'How loud?', answer: 'How loud? Antwort' }]);
		expect(fetchRows).toHaveBeenCalledTimes(1);
	});

	it('fällt auf DE zurück, wenn EN-Zeilen fehlen', async () => {
		const fetchRows = vi.fn(async (i: GetFaqQnaInput) =>
			i.locale === 'de' ? [row('de', 'Wie laut?')] : []
		);
		const result = await getFaqForPage(input, fetchRows);
		expect(result.locale).toBe('de');
		expect(result.items[0]?.question).toBe('Wie laut?');
		expect(fetchRows).toHaveBeenCalledTimes(2);
	});

	it('fragt für DE nur einmal ab und meldet leer als leer', async () => {
		const fetchRows = vi.fn(async () => []);
		const result = await getFaqForPage({ ...input, locale: 'de' }, fetchRows);
		expect(result).toEqual({ items: [], locale: 'de' });
		expect(fetchRows).toHaveBeenCalledTimes(1);
	});

	it('liefert leer ohne DATABASE_URL, ohne DB-Zugriff', async () => {
		vi.stubEnv('DATABASE_URL', '');
		const fetchRows = vi.fn(async () => [row('en', 'q')]);
		const result = await getFaqForPage(input, fetchRows);
		expect(result.items).toEqual([]);
		expect(fetchRows).not.toHaveBeenCalled();
	});

	it('liefert leer und warnt bei DB-Fehler', async () => {
		const write = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
		const fetchRows = vi.fn(async () => {
			throw new Error('boom');
		});
		const result = await getFaqForPage(input, fetchRows);
		expect(result.items).toEqual([]);
		expect(write).toHaveBeenCalledWith(expect.stringContaining('faq_qna unavailable (boom)'));
		write.mockRestore();
	});
});
