import { describe, expect, it } from 'vitest';
import {
	hashProfileParagraphs,
	splitParagraphs
} from '../../../src/lib/server/profile/source-text-hash.js';
import { lintProfileDir, type BuiltRef, type ProfileFile } from './lint-dir.js';
import type { ProfileInput } from './input.js';

const INPUT: ProfileInput = {
	pageType: 'kiez',
	slug: 'x',
	name: 'X',
	bezirk: 'Mitte',
	einwohner: null,
	flaecheHa: null,
	composite: { score: 51.1, rang: 19, total: 143 },
	dims: [],
	facts: {}
};
const BUILT: BuiltRef = { inputHash: 'h1', input: INPUT };
const byKey = new Map([['kiez/x', BUILT]]);
const DE_BODY = 'Rang 19 von 143.\n\nZweiter Absatz.\n';
const DE_TEXT_HASH = hashProfileParagraphs(splitParagraphs(DE_BODY));

function deFile(over: { slug?: string; hash?: string; body?: string } = {}): ProfileFile {
	return {
		name: 'x.md',
		raw: `---\nslug: ${over.slug ?? 'x'}\ninputHash: ${over.hash ?? 'h1'}\n---\n\n${over.body ?? DE_BODY}`
	};
}
function enFile(
	over: { slug?: string; hash?: string; textHash?: string; body?: string; name?: string } = {}
): ProfileFile {
	return {
		name: over.name ?? 'x.en.md',
		raw: `---\nslug: ${over.slug ?? 'x'}\nsourceInputHash: '${over.hash ?? 'h1'}'\nsourceTextHash: '${over.textHash ?? DE_TEXT_HASH}'\n---\n\n${over.body ?? 'Rank 19 of 143.\n\nSecond paragraph.\n'}`
	};
}
const run = (files: ProfileFile[]) => lintProfileDir({ pageType: 'kiez', files, byKey });

describe('lintProfileDir', () => {
	it('bestanden: DE und EN ohne Fehler, getrennt gezählt', () => {
		const r = run([deFile(), enFile()]);
		expect(r.de).toEqual({ checked: 1, failed: 0, stale: 0 });
		expect(r.en).toEqual({ checked: 1, failed: 0, stale: 0 });
		expect(r.messages).toEqual([]);
	});

	it('stale EN (sourceInputHash)', () => {
		const r = run([deFile(), enFile({ hash: 'alt' })]);
		expect(r.en.stale).toBe(1);
		expect(r.de.stale).toBe(0);
		expect(r.messages.join('\n')).toContain('STALE EN kiez/x');
	});

	it('stale EN (sourceTextHash, DE-Text von Hand geändert)', () => {
		const r = run([deFile(), enFile({ textHash: 'deadbeefdeadbeef' })]);
		expect(r.en.stale).toBe(1);
	});

	it('orphan EN ohne DE-Datei', () => {
		const r = run([enFile()]);
		expect(r.en.failed).toBe(1);
		expect(r.messages.join('\n')).toContain('verwaist');
	});

	it('EN mit crime scheitert, DE-Zähler bleibt sauber', () => {
		const r = run([deFile(), enFile({ body: 'Crime is high, rank 19.\n\nSecond.\n' })]);
		expect(r.en.failed).toBe(1);
		expect(r.de.failed).toBe(0);
		expect(r.messages.join('\n')).toContain('FAIL EN kiez/x');
	});

	it('ungedeckte Zahl in EN scheitert', () => {
		const r = run([deFile(), enFile({ body: 'Rank 19, 9999 people.\n\nSecond.\n' })]);
		expect(r.en.failed).toBe(1);
	});

	it('fehlende .en.md scheitert als EN-FAIL', () => {
		const r = run([deFile()]);
		expect(r.en).toEqual({ checked: 1, failed: 1, stale: 0 });
	});

	it('leerer EN-Body scheitert', () => {
		expect(run([deFile(), enFile({ body: '\n' })]).en.failed).toBe(1);
	});

	it('EN-slug weicht vom Dateinamen ab', () => {
		expect(run([deFile(), enFile({ slug: 'y' })]).en.failed).toBe(1);
	});

	it('DE-slug weicht vom Dateinamen ab', () => {
		const r = run([deFile({ slug: 'y' }), enFile()]);
		expect(r.de.failed).toBe(1);
	});

	it('abweichende Absatzzahl DE/EN scheitert', () => {
		const r = run([deFile(), enFile({ body: 'Rank 19 of 143.\n' })]);
		expect(r.en.failed).toBe(1);
		expect(r.messages.join('\n')).toContain('Absätze');
	});

	it('stale DE (inputHash) zählt nur DE', () => {
		const r = run([deFile({ hash: 'neu' }), enFile()]);
		expect(r.de.stale).toBe(1);
		expect(r.en.stale).toBe(1);
	});
});
