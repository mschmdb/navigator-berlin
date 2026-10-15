import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { readProfileDates, readScoresGeneratedAt } from './profile-dates.js';

let root: string;
let warn: MockInstance<typeof console.warn>;

beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 's5-profile-dates-'));
	await mkdir(join(root, 'kiez-profile'));
	warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
	vi.unstubAllEnvs();
	warn.mockRestore();
	await rm(root, { recursive: true, force: true });
});

describe('readProfileDates', () => {
	it('liest generatedAt (DE) und translatedAt (EN) je Slug', async () => {
		await writeFile(
			join(root, 'kiez-profile', 'adlershof.md'),
			"---\nslug: adlershof\ngeneratedAt: '2026-06-07T12:00:00.000Z'\n---\n\nText.\n"
		);
		await writeFile(
			join(root, 'kiez-profile', 'adlershof.en.md'),
			"---\nslug: adlershof\nlocale: en\ntranslatedAt: '2026-09-30T12:00:00.000Z'\n---\n\nText.\n"
		);
		const dates = await readProfileDates('kiez', root);
		expect(dates).toEqual({
			adlershof: {
				generatedAt: '2026-06-07T12:00:00.000Z',
				translatedAt: '2026-09-30T12:00:00.000Z'
			}
		});
	});

	it('akzeptiert unquotierte YAML-Zeitstempel', async () => {
		await writeFile(
			join(root, 'kiez-profile', 'rixdorf.md'),
			'---\nslug: rixdorf\ngeneratedAt: 2026-06-07T12:00:00.000Z\n---\n\nText.\n'
		);
		const dates = await readProfileDates('kiez', root);
		expect(dates.rixdorf?.generatedAt).toBe('2026-06-07T12:00:00.000Z');
	});

	it('überspringt fehlende und ungültige Werte und warnt mit Dateiname', async () => {
		await writeFile(join(root, 'kiez-profile', 'ohne.md'), '---\nslug: ohne\n---\n\nText.\n');
		await writeFile(
			join(root, 'kiez-profile', 'kaputt.md'),
			"---\nslug: kaputt\ngeneratedAt: 'gestern'\n---\n\nText.\n"
		);
		const dates = await readProfileDates('kiez', root);
		expect(dates.ohne).toBeUndefined();
		expect(dates.kaputt).toBeUndefined();
		const messages = warn.mock.calls.map((c) => String(c[0]));
		expect(messages.some((m) => m.includes('ohne.md'))).toBe(true);
		expect(messages.some((m) => m.includes('kaputt.md'))).toBe(true);
	});

	it('überspringt Dateien mit kaputtem YAML, liest die übrigen weiter', async () => {
		await writeFile(
			join(root, 'kiez-profile', 'yaml-kaputt.md'),
			'---\nslug: [unclosed\n  : : :\n---\n\nText.\n'
		);
		await writeFile(
			join(root, 'kiez-profile', 'gut.md'),
			"---\nslug: gut\ngeneratedAt: '2026-06-07T12:00:00.000Z'\n---\n\nText.\n"
		);
		const dates = await readProfileDates('kiez', root);
		expect(dates['yaml-kaputt']).toBeUndefined();
		expect(dates.gut?.generatedAt).toBe('2026-06-07T12:00:00.000Z');
		expect(warn.mock.calls.some((c) => String(c[0]).includes('yaml-kaputt.md'))).toBe(true);
	});

	it('ignoriert Dateinamen, die nicht dem Slug-Muster entsprechen', async () => {
		const front = "---\ngeneratedAt: '2026-06-07T12:00:00.000Z'\n---\n\nText.\n";
		await writeFile(join(root, 'kiez-profile', 'README.md'), front);
		await writeFile(join(root, 'kiez-profile', 'a.de.md'), front);
		await writeFile(join(root, 'kiez-profile', 'ok.md'), front);
		expect(Object.keys(await readProfileDates('kiez', root))).toEqual(['ok']);
	});

	it('warnt bei fehlendem Verzeichnis und liefert {}', async () => {
		expect(await readProfileDates('bezirk', root)).toEqual({});
		expect(warn).toHaveBeenCalledTimes(1);
	});

	it('wirft bei fehlendem Verzeichnis im strikten Build', async () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
		await expect(readProfileDates('bezirk', root)).rejects.toThrow(/bezirk-profile/);
	});
});

describe('readScoresGeneratedAt', () => {
	it('liest generatedAt vom Anfang der Datei', async () => {
		const path = join(root, 'kiez-scores.json');
		await writeFile(
			path,
			JSON.stringify({ schemaVersion: 1, generatedAt: '2026-10-14T08:00:00.000Z', scores: {} })
		);
		expect(await readScoresGeneratedAt(path)).toBe('2026-10-14T08:00:00.000Z');
	});

	it('warnt und liefert undefined bei fehlender Datei, fehlendem oder ungültigem Datum', async () => {
		expect(await readScoresGeneratedAt(join(root, 'fehlt.json'))).toBeUndefined();
		const noDate = join(root, 'a.json');
		await writeFile(noDate, JSON.stringify({ scores: {} }));
		expect(await readScoresGeneratedAt(noDate)).toBeUndefined();
		const badDate = join(root, 'b.json');
		await writeFile(badDate, JSON.stringify({ generatedAt: 'kaputt', scores: {} }));
		expect(await readScoresGeneratedAt(badDate)).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(3);
	});

	it('wirft im strikten Build bei fehlender Datei oder fehlendem Datum', async () => {
		vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
		await expect(readScoresGeneratedAt(join(root, 'fehlt.json'))).rejects.toThrow(/kiez-scores/);
		const noDate = join(root, 'a.json');
		await writeFile(noDate, JSON.stringify({ scores: {} }));
		await expect(readScoresGeneratedAt(noDate)).rejects.toThrow(/generatedAt/);
	});
});
