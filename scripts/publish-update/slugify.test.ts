import { describe, expect, it } from 'vitest';
import { slugify } from './slugify.js';

describe('slugify', () => {
	it('transliteriert deutsche Umlaute (ä→ae, ö→oe, ü→ue, ß→ss)', () => {
		expect(slugify('Lärm in Kreuzberg')).toBe('laerm-in-kreuzberg');
		expect(slugify('Wo lebt es sich gut?')).toBe('wo-lebt-es-sich-gut');
		expect(slugify('Größe & Maß')).toBe('groesse-mass');
		expect(slugify('Ärgerlich, öde, übel')).toBe('aergerlich-oede-uebel');
	});

	it('lowercase + ASCII-only', () => {
		expect(slugify('TestTitle')).toBe('testtitle');
		expect(slugify('Mit Üml @ute!')).toBe('mit-ueml-ute');
	});

	it('whitespace + Sonderzeichen → einzelner Bindestrich', () => {
		expect(slugify('foo  bar   baz')).toBe('foo-bar-baz');
		expect(slugify('foo!bar?baz.qux')).toBe('foo-bar-baz-qux');
	});

	it('collapsed multiple dashes + getrimmt', () => {
		expect(slugify('---hello---world---')).toBe('hello-world');
		expect(slugify('  spaced  ')).toBe('spaced');
	});

	it('max 60 Zeichen', () => {
		const long = 'a'.repeat(120);
		expect(slugify(long).length).toBeLessThanOrEqual(60);
	});

	it('deterministisch (zweimal = gleich)', () => {
		expect(slugify('Beispiel-Titel mit Sonderzeichen!')).toBe(
			slugify('Beispiel-Titel mit Sonderzeichen!')
		);
	});

	it('leerer Input → leerer String', () => {
		expect(slugify('')).toBe('');
		expect(slugify('   ')).toBe('');
		expect(slugify('!!!')).toBe('');
	});

	it('Non-ASCII außer Umlaute werden gestripped', () => {
		expect(slugify('Émoji 🎉 test')).toBe('moji-test');
	});
});
