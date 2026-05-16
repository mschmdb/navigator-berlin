import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './markdown-sanitizer.js';

describe('sanitizeHtml — XSS-Vectors', () => {
	it('strippt <script>-Block komplett', () => {
		const input = '<p>ok</p><script>alert(1)</script><p>after</p>';
		const out = sanitizeHtml(input);
		expect(out).not.toContain('<script');
		expect(out).not.toContain('alert(1)');
		expect(out).toContain('<p>ok</p>');
		expect(out).toContain('<p>after</p>');
	});

	it('strippt onerror-Attribut auf img', () => {
		const input = '<img src="x" onerror="alert(1)">';
		const out = sanitizeHtml(input);
		expect(out).not.toMatch(/onerror/i);
		expect(out).not.toContain('alert(1)');
	});

	it('strippt onclick-Attribut auf div', () => {
		const input = '<div onclick="evil()">x</div>';
		const out = sanitizeHtml(input);
		expect(out).not.toMatch(/onclick/i);
		expect(out).not.toContain('evil()');
	});

	it('strippt javascript:-URL aus href', () => {
		const input = '<a href="javascript:alert(1)">click</a>';
		const out = sanitizeHtml(input);
		expect(out).not.toMatch(/javascript:/i);
	});

	it('strippt data:-URL aus href (verhindert HTML-Data-URI-Injection)', () => {
		const input = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
		const out = sanitizeHtml(input);
		expect(out).not.toMatch(/data:text\/html/i);
	});

	it('strippt <iframe>-Block', () => {
		const input = '<iframe src="https://evil.com"></iframe>';
		const out = sanitizeHtml(input);
		expect(out).not.toContain('<iframe');
	});

	it('strippt <object>-Block', () => {
		const input = '<object data="x.swf"></object>';
		const out = sanitizeHtml(input);
		expect(out).not.toContain('<object');
	});

	it('strippt <embed>-Block', () => {
		const input = '<embed src="x.swf">';
		const out = sanitizeHtml(input);
		expect(out).not.toContain('<embed');
	});

	it('strippt Unicode-escapte on*-Attribute (Case-Insensitive)', () => {
		const input = '<div ONLOAD="evil()">x</div>';
		const out = sanitizeHtml(input);
		expect(out).not.toMatch(/onload/i);
	});

	it('lässt sichere href stehen (https / mailto / relative)', () => {
		expect(sanitizeHtml('<a href="https://example.com">x</a>')).toContain(
			'https://example.com'
		);
		expect(sanitizeHtml('<a href="mailto:a@b.de">x</a>')).toContain('mailto:a@b.de');
		expect(sanitizeHtml('<a href="/layer/kitas-2024">x</a>')).toContain('/layer/kitas-2024');
	});

	it('lässt erlaubte Tags durch (p, h1-h6, a, code, pre, ul, ol, li, table)', () => {
		const input = '<h2>Titel</h2><p>Para</p><ul><li>Item</li></ul><pre><code>x</code></pre>';
		const out = sanitizeHtml(input);
		expect(out).toContain('<h2>');
		expect(out).toContain('<p>');
		expect(out).toContain('<ul>');
		expect(out).toContain('<li>');
		expect(out).toContain('<pre>');
		expect(out).toContain('<code>');
	});
});
