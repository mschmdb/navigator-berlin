import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('impressum · Rechtsgrundlage', () => {
	it('nennt § 5 DDG statt § 5 TMG', () => {
		render(Page);
		const text = document.body.textContent ?? '';
		expect(text).toContain('Angaben gemäß § 5 DDG');
		expect(text).not.toContain('TMG');
	});
});
