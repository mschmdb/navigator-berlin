import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Regler from './regler.svelte';

describe('regler.svelte auf dem Server', () => {
	it('rendert ohne requestAnimationFrame, etwa beim SSR der Demo', () => {
		const { body } = render(Regler, {
			props: { label: 'Schwelle', min: 0, max: 10, value: 5, format: (v: number) => `${v} %` }
		});
		expect(body).toContain('type="range"');
	});
});
