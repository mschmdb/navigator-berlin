import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import PixelLogo from './pixel-logo.svelte';

describe('pixel-logo SSR', () => {
	it('liefert das Header-Logo in höchstens 14 KB aus', () => {
		const { body } = render(PixelLogo, { props: { size: 64, title: 'navigator.berlin' } });
		expect(new TextEncoder().encode(body).length).toBeLessThanOrEqual(14 * 1024);
	});

	it('rendert 296 use-Zellen und verzichtet im one-shot auf Verzögerungs-Styles', () => {
		const { body } = render(PixelLogo, { props: { size: 64 } });
		expect(body.match(/<use /g)).toHaveLength(296);
		expect(body).not.toContain('--d');
	});
	it('vergibt keine nackte ID wie „s1“, die Seitenanker überdeckt (#190)', () => {
		const { body } = render(PixelLogo, { props: { size: 64 } });
		const ids = [...body.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
		expect(ids.length).toBeGreaterThan(0);
		for (const id of ids) expect(id).not.toMatch(/^[a-z]\d+$/);
	});
});
