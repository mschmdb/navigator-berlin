import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WebmcpDiagnose from './webmcp-diagnose.svelte';

describe('webmcp-diagnose', () => {
	it('zeigt nach dem Mount Surface und Tool-Liste', async () => {
		render(WebmcpDiagnose);
		await expect.element(page.getByTestId('webmcp-diagnose')).toBeInTheDocument();
		// Im Test-Browser fehlt die native API: der Polyfill springt ein.
		await expect
			.element(page.getByTestId('webmcp-diagnose-surface'), { timeout: 15000 })
			.toBeInTheDocument();
		const surface = (await page.getByTestId('webmcp-diagnose-surface').element()).textContent;
		expect(surface).toMatch(/modelContext/);
		const tools = (await page.getByTestId('webmcp-diagnose-tools').element()).textContent ?? '';
		expect(tools).toContain('set_finder_weights');
		expect(tools).toContain('get_finder_state');
		expect(tools).toContain('address_lookup');
	});
});
