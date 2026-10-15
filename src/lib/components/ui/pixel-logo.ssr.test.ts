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
});
