import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import MapAttribution from './map-attribution.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

// Review-Fund: map-attribution.svelte war nicht lokalisiert
// ("OpenStreetMap-Contributors" stand fest im Markup).
describe('map-attribution.svelte', () => {
	it('zeigt DE-Text ohne Locale-Angabe', async () => {
		render(MapAttribution, {});
		await expect
			.element(page.getByRole('link', { name: 'OpenStreetMap-Contributors' }))
			.toBeInTheDocument();
	});

	it('zeigt EN-Text wenn Locale "en" ist', async () => {
		overwriteGetLocale(() => 'en');
		render(MapAttribution, {});
		await expect
			.element(page.getByRole('link', { name: 'OpenStreetMap contributors' }))
			.toBeInTheDocument();
	});
});
