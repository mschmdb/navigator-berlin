import { expect, test } from '@playwright/test';

/**
 * E2E-Smoke für WebMCP-Integration (Story 2.7).
 *
 * Headless-testbar:
 * - Manifest-Endpoint liefert JSON mit 5 Tools, 3 Prompts, ≥2 Resources.
 * - Adapter mountet client-side ohne Console-Error (Polyfill-Load oder native).
 *
 * NICHT headless-testbar (manueller Runbook docs/runbooks/webmcp-verify.md):
 * - Echter LLM-Agent-Call gegen die Tool-Surface.
 */

test('webmcp-manifest.json liefert validen Manifest-Body', async ({ request }) => {
	const response = await request.get('/webmcp-manifest.json');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('application/json');
	const body = await response.json();

	expect(body.spec_version).toMatch(/^\d+\.\d+\.\d+$/);
	expect(body.name).toBe('navigator.berlin');
	expect(Array.isArray(body.tools)).toBe(true);
	expect(body.tools).toHaveLength(5);
	expect(body.prompts).toHaveLength(3);
	expect(body.resources.length).toBeGreaterThanOrEqual(2);

	const toolNames = (body.tools as Array<{ name: string }>).map((t) => t.name).sort();
	expect(toolNames).toEqual(
		[
			'address_lookup',
			'cross_layer_query',
			'get_kiez_profile',
			'get_layer_metadata',
			'list_layers_at_point'
		].sort()
	);
});

test('Adapter mountet ohne Fatal-Error in Console (Polyfill oder native)', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push(msg.text());
	});
	await page.goto('/');
	await page.locator('[data-testid="map-skeleton"]').waitFor({
		state: 'detached',
		timeout: 15000
	});
	// Verify navigator.modelContext exists (entweder native oder Polyfill).
	const hasContext = await page.evaluate(() => {
		return typeof (navigator as { modelContext?: unknown }).modelContext !== 'undefined';
	});
	expect(hasContext).toBe(true);
	// Console-Errors aus dem Mount-Pfad sind ein Fail (Warnings sind OK).
	const fatal = errors.filter((e) => e.includes('[webmcp]') && !e.includes('warn'));
	expect(fatal).toEqual([]);
});
