import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { isMainEntry } from './is-main-entry.js';

const dir = mkdtempSync(join(tmpdir(), 'is-main-entry-'));
const script = join(dir, 'script.ts');
writeFileSync(script, '');
const link = join(dir, 'link.ts');
symlinkSync(script, link);
const scriptUrl = pathToFileURL(script).href;

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('isMainEntry', () => {
	it('true bei direktem Aufruf', () => {
		expect(isMainEntry(scriptUrl, script)).toBe(true);
	});

	it('true, wenn argv1 ein Symlink auf das Skript ist', () => {
		expect(isMainEntry(scriptUrl, link)).toBe(true);
	});

	it('true, wenn argv1 ohne Endung übergeben wird', () => {
		expect(isMainEntry(scriptUrl, join(dir, 'script'))).toBe(true);
	});

	it('false beim Import (argv1 ist ein anderes Skript)', () => {
		expect(isMainEntry(scriptUrl, join(dir, 'other.ts'))).toBe(false);
	});

	it('false ohne argv1', () => {
		expect(isMainEntry(scriptUrl, undefined)).toBe(false);
		expect(isMainEntry(scriptUrl, '')).toBe(false);
	});
});
