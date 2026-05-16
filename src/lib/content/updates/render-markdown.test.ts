import { describe, expect, it } from 'vitest';
import { renderMarkdownBody } from './render-markdown.js';

describe('renderMarkdownBody', () => {
	it('rendert Heading + Para', () => {
		const out = renderMarkdownBody('# Titel\n\nAbsatz.');
		expect(out).toContain('<h1');
		expect(out).toMatch(/Titel/);
		expect(out).toContain('<p>');
		expect(out).toMatch(/Absatz/);
	});

	it('rendert Link mit https', () => {
		const out = renderMarkdownBody('[Link](https://example.com)');
		expect(out).toContain('href="https://example.com"');
	});

	it('strippt javascript:-URL in Link (Sanitizer-Integration)', () => {
		const out = renderMarkdownBody('[Klick](javascript:alert(1))');
		expect(out).not.toMatch(/javascript:/i);
	});

	it('strippt <script>-Block (Sanitizer-Integration)', () => {
		const out = renderMarkdownBody('Text\n\n<script>alert(1)</script>\n\nMehr');
		expect(out).not.toContain('<script');
		expect(out).not.toContain('alert(1)');
	});

	it('strippt <img onerror>-Vector', () => {
		const out = renderMarkdownBody('<img src=x onerror="alert(1)">');
		expect(out).not.toMatch(/onerror/i);
	});

	it('rendert Liste', () => {
		const out = renderMarkdownBody('- A\n- B\n- C');
		expect(out).toContain('<ul');
		expect(out).toMatch(/<li[^>]*>A<\/li>/);
	});

	it('rendert Code-Block', () => {
		const out = renderMarkdownBody('```\nconst x = 1;\n```');
		expect(out).toContain('<pre>');
		expect(out).toMatch(/const x = 1/);
	});
});
