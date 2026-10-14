import { describe, expect, it, vi } from 'vitest';
import { SevenZipMissingError, extractFrom7z } from './seven-zip.js';

describe('extractFrom7z', () => {
	it('ruft 7zz mit e -so und Dateimuster auf und liefert stdout', async () => {
		const run = vi.fn().mockResolvedValue(Buffer.from('abc'));
		const out = await extractFrom7z('/tmp/a.7z', '*.csv', run);
		expect(out.toString()).toBe('abc');
		expect(run).toHaveBeenCalledWith('7zz', ['e', '-so', '/tmp/a.7z', '*.csv']);
	});

	it('meldet fehlendes 7zz mit Installationshinweis', async () => {
		const run = vi.fn().mockRejectedValue(Object.assign(new Error('spawn'), { code: 'ENOENT' }));
		const err = await extractFrom7z('/tmp/a.7z', '*.csv', run).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(SevenZipMissingError);
		expect((err as Error).message).toMatch(/brew install sevenzip/);
	});

	it('lehnt leere Ausgabe ab und nennt das Dateimuster', async () => {
		const run = vi.fn().mockResolvedValue(Buffer.alloc(0));
		await expect(extractFrom7z('/tmp/a.7z', '*.csv', run)).rejects.toThrow(/\*\.csv/);
	});

	it('reicht andere Fehler unveraendert weiter', async () => {
		const run = vi.fn().mockRejectedValue(new Error('kaputtes Archiv'));
		await expect(extractFrom7z('/tmp/a.7z', '*.csv', run)).rejects.toThrow(/kaputtes Archiv/);
	});
});
