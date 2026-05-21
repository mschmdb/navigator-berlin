import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import InspectorCardProbe from './inspector-card-probe.svelte';

describe('InspectorCard', () => {
	it('rendert Titel + Summary, collapsed kein Detail im DOM', async () => {
		render(InspectorCardProbe, { defaultExpanded: false });
		await expect.element(page.getByTestId('card-title')).toBeInTheDocument();
		await expect.element(page.getByTestId('probe-summary')).toBeInTheDocument();
		await expect.element(page.getByTestId('probe-detail')).not.toBeInTheDocument();
	});

	it('aria-expanded false collapsed', async () => {
		render(InspectorCardProbe, { defaultExpanded: false });
		const btn = (await page.getByTestId('card-toggle').element()) as HTMLElement;
		expect(btn.getAttribute('aria-expanded')).toBe('false');
	});

	it('Klick expandiert: Detail im DOM, aria-expanded true', async () => {
		render(InspectorCardProbe, { defaultExpanded: false });
		await page.getByTestId('card-toggle').click();
		await expect.element(page.getByTestId('probe-detail')).toBeInTheDocument();
		const btn = (await page.getByTestId('card-toggle').element()) as HTMLElement;
		expect(btn.getAttribute('aria-expanded')).toBe('true');
	});

	it('defaultExpanded=true rendert Detail sofort', async () => {
		render(InspectorCardProbe, { defaultExpanded: true });
		await expect.element(page.getByTestId('probe-detail')).toBeInTheDocument();
	});

	it('aria-controls referenziert die Detail-Region', async () => {
		render(InspectorCardProbe, { defaultExpanded: true });
		const btn = (await page.getByTestId('card-toggle').element()) as HTMLElement;
		const controls = btn.getAttribute('aria-controls');
		expect(controls).toBeTruthy();
		const region = document.getElementById(controls as string);
		expect(region).not.toBeNull();
	});
});
