import { describe, expect, it } from 'vitest';
import { escapeXml } from './escape-xml.js';

describe('escapeXml', () => {
	it('escapt Ampersand', () => {
		expect(escapeXml('A & B')).toBe('A &amp; B');
	});

	it('escapt LT und GT', () => {
		expect(escapeXml('a<b>c')).toBe('a&lt;b&gt;c');
	});

	it('escapt doppelte Quotes', () => {
		expect(escapeXml('say "hi"')).toBe('say &quot;hi&quot;');
	});

	it('escapt einfache Quotes', () => {
		expect(escapeXml("it's")).toBe('it&apos;s');
	});

	it('alle 5 Entities zusammen', () => {
		expect(escapeXml(`<a href="x">A & B's</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;A &amp; B&apos;s&lt;/a&gt;'
		);
	});

	it('Ampersand muss zuerst escapt werden (kein Doppel-Escape)', () => {
		const out = escapeXml('A & <b>');
		expect(out).toBe('A &amp; &lt;b&gt;');
		// kein "&amp;amp;"
		expect(out).not.toMatch(/&amp;amp;/);
	});

	it('leerer String', () => {
		expect(escapeXml('')).toBe('');
	});
});
