import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Skeleton from './skeleton.svelte';

describe('skeleton.svelte', () => {
	it('rendert div mit bg-rule + motion-safe:animate-pulse + aria-hidden', async () => {
		render(Skeleton, {});
		const el = (await page.getByTestId('skeleton').element()) as HTMLDivElement;
		expect(el.tagName).toBe('DIV');
		expect(el.className).toMatch(/bg-rule/);
		expect(el.className).toMatch(/motion-safe:animate-pulse/);
		expect(el.getAttribute('aria-hidden')).toBe('true');
	});

	it('mergt class-Prop', async () => {
		render(Skeleton, { class: 'h-20 w-full' });
		const el = (await page.getByTestId('skeleton').element()) as HTMLDivElement;
		expect(el.className).toMatch(/h-20/);
		expect(el.className).toMatch(/w-full/);
		expect(el.className).toMatch(/bg-rule/);
	});
});
