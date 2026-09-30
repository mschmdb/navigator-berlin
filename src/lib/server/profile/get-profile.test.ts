import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashProfileParagraphs } from './source-text-hash.js';
import { getLocalizedProfile, getProfileParagraphs } from './get-profile.js';

let root: string;

function de(hash = 'abc'): string {
	return `---\nslug: x\ninputHash: ${hash}\n---\n\nDeutsch eins.\n\nDeutsch zwei.\n`;
}
const DE_TEXT_HASH = hashProfileParagraphs(['Deutsch eins.', 'Deutsch zwei.']);
function en(hash = 'abc', textHash = DE_TEXT_HASH): string {
	return `---\nslug: x\nlocale: en\nsourceInputHash: '${hash}'\nsourceTextHash: '${textHash}'\n---\n\nEnglish one.\n\nEnglish two.\n`;
}

beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'profile-'));
	await mkdir(join(root, 'kiez-profile'), { recursive: true });
});
afterEach(async () => {
	await rm(root, { recursive: true, force: true });
});

describe('getLocalizedProfile', () => {
	it('liefert die EN-Fassung, wenn sourceInputHash zum DE-inputHash passt', async () => {
		await writeFile(join(root, 'kiez-profile/x.md'), de());
		await writeFile(join(root, 'kiez-profile/x.en.md'), en());
		expect(await getLocalizedProfile('kiez', 'x', 'en', root)).toEqual({
			paragraphs: ['English one.', 'English two.'],
			locale: 'en'
		});
	});

	it('fällt auf DE zurück, wenn die .en.md fehlt', async () => {
		await writeFile(join(root, 'kiez-profile/x.md'), de());
		expect(await getLocalizedProfile('kiez', 'x', 'en', root)).toEqual({
			paragraphs: ['Deutsch eins.', 'Deutsch zwei.'],
			locale: 'de'
		});
	});

	it('fällt auf DE zurück, wenn die EN-Fassung veraltet ist (STALE)', async () => {
		await writeFile(join(root, 'kiez-profile/x.md'), de('neu'));
		await writeFile(join(root, 'kiez-profile/x.en.md'), en('alt'));
		const res = await getLocalizedProfile('kiez', 'x', 'en', root);
		expect(res.locale).toBe('de');
		expect(res.paragraphs[0]).toBe('Deutsch eins.');
	});

	it('fällt auf DE zurück, wenn der DE-Text von Hand geändert wurde (sourceTextHash)', async () => {
		await writeFile(join(root, 'kiez-profile/x.md'), de());
		await writeFile(join(root, 'kiez-profile/x.en.md'), en('abc', 'deadbeefdeadbeef'));
		expect((await getLocalizedProfile('kiez', 'x', 'en', root)).locale).toBe('de');
	});

	it('fällt auf DE zurück ohne sourceTextHash', async () => {
		await writeFile(join(root, 'kiez-profile/x.md'), de());
		await writeFile(
			join(root, 'kiez-profile/x.en.md'),
			`---\nslug: x\nsourceInputHash: 'abc'\n---\n\nEnglish one.\n`
		);
		expect((await getLocalizedProfile('kiez', 'x', 'en', root)).locale).toBe('de');
	});

	it('liefert DE für locale de, auch wenn EN existiert', async () => {
		await writeFile(join(root, 'kiez-profile/x.md'), de());
		await writeFile(join(root, 'kiez-profile/x.en.md'), en());
		expect((await getLocalizedProfile('kiez', 'x', 'de', root)).locale).toBe('de');
	});

	it('liefert leeres Ergebnis ohne DE-Datei (EN allein zählt nicht)', async () => {
		await writeFile(join(root, 'kiez-profile/x.en.md'), en());
		expect(await getLocalizedProfile('kiez', 'x', 'en', root)).toEqual({
			paragraphs: [],
			locale: 'de'
		});
	});
});

describe('getProfileParagraphs', () => {
	it('bleibt DE (llms-Export)', async () => {
		await writeFile(join(root, 'kiez-profile/x.md'), de());
		await writeFile(join(root, 'kiez-profile/x.en.md'), en());
		expect(await getProfileParagraphs('kiez', 'x', root)).toEqual([
			'Deutsch eins.',
			'Deutsch zwei.'
		]);
	});
});
