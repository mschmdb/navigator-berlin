import { expect, test } from '@playwright/test';

const FIXTURE = {
	suggestions: [
		{
			id: 'way-100001',
			displayName: 'Brandenburger Tor, Mitte, Berlin',
			lat: 52.5163,
			lng: 13.3777,
			type: 'attraction',
			addresstype: 'tourism',
			bezirk: 'Mitte',
			postcode: '10117'
		},
		{
			id: 'way-200002',
			displayName: 'Pariser Platz, Mitte, Berlin',
			lat: 52.5163,
			lng: 13.3779,
			type: 'primary',
			addresstype: 'road',
			bezirk: 'Mitte',
			postcode: '10117'
		}
	]
};

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: FIXTURE }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: FIXTURE.suggestions } })
	);
});

test('SiteHeader rendert auf with-header-Route', async ({ page }) => {
	await page.goto('/_dev/wortmarke');
	await expect(page.getByRole('banner')).toBeVisible();
	await expect(page.getByRole('link', { name: 'navigator.berlin Startseite' })).toBeVisible();
});

test('Wortmarke-Showcase rendert 6 Kandidaten', async ({ page }) => {
	await page.goto('/_dev/wortmarke');
	await expect(page.getByRole('heading', { level: 1, name: /6 Plex-Kandidaten/ })).toBeVisible();
	for (const id of ['A', 'B', 'C', 'D', 'E', 'F']) {
		await expect(page.getByText(new RegExp(`Kandidat ${id}:`))).toBeVisible();
	}
});

test('Root zeigt Header (Karte ist Hauptelement seit 2026-05-11)', async ({ page }) => {
	await page.goto('/explore');
	await expect(page.getByRole('banner')).toBeVisible();
});
