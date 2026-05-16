import { describe, it, expect } from 'vitest';
import { renderSiteIntroMarkdown } from './site-intro-renderer.js';

describe('renderSiteIntroMarkdown', () => {
	it('starts with the H1 site name "navigator.berlin" per llmstxt.org spec', () => {
		const md = renderSiteIntroMarkdown({ origin: 'https://navigator.berlin' });
		expect(md.split('\n')[0]).toBe('# navigator.berlin');
	});

	it('contains a blockquote summary right after the H1', () => {
		const md = renderSiteIntroMarkdown({ origin: 'https://navigator.berlin' });
		// llmstxt.org-Spec: blockquote follows H1
		expect(md).toMatch(/\n>\s+.+/);
	});

	it('mentions the cookieless EU-FOSS-stack and ~39 layers', () => {
		const md = renderSiteIntroMarkdown({ origin: 'https://navigator.berlin' });
		expect(md.toLowerCase()).toContain('cookieless');
		expect(md.toLowerCase()).toContain('layer');
	});

	it('never contains banned word "lebenswert"', () => {
		const md = renderSiteIntroMarkdown({ origin: 'https://navigator.berlin' });
		expect(md.toLowerCase()).not.toContain('lebenswert');
	});

	it('never contains em-dashes (U+2014)', () => {
		const md = renderSiteIntroMarkdown({ origin: 'https://navigator.berlin' });
		expect(md).not.toContain('—');
	});

	it('is deterministic for the same input', () => {
		const a = renderSiteIntroMarkdown({ origin: 'https://navigator.berlin' });
		const b = renderSiteIntroMarkdown({ origin: 'https://navigator.berlin' });
		expect(a).toBe(b);
	});
});
