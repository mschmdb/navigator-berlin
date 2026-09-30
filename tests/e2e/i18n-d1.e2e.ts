import { expect, test } from '@playwright/test';

// i18n Block D1 (spec-i18n-d1-register-sitemap.md): `sitemap-en.xml` listet alle
// registrierten, indexierbaren EN-Seiten. Nicht registrierte und `noindex`-Seiten
// fehlen. Die Steckbrief-Verteilung zeigt Kategorien in der Seiten-Locale.

test.describe('i18n Block D1: sitemap-en.xml', () => {
	test('enthält Kiez, Bezirk, Layer, Explore und Updates, nicht /en/impressum', async ({
		request
	}) => {
		const response = await request.get('/sitemap-en.xml');
		expect(response.status()).toBe(200);
		const body = await response.text();
		for (const pattern of [
			/<loc>[^<]*\/en\/kiez\/[a-z0-9-]+<\/loc>/,
			/<loc>[^<]*\/en\/bezirk\/[a-z-]+<\/loc>/,
			/<loc>[^<]*\/en\/layer\/[a-z0-9-]+<\/loc>/,
			/<loc>[^<]*\/en\/explore<\/loc>/,
			/<loc>[^<]*\/en\/updates<\/loc>/,
			/<loc>[^<]*\/en\/updates\/[a-z0-9-]+<\/loc>/,
			/<loc>[^<]*\/en\/architektur<\/loc>/,
			/<loc>[^<]*\/en\/methodik\/kiez-score<\/loc>/
		]) {
			expect(body).toMatch(pattern);
		}
		for (const path of ['/en/impressum', '/en/datenschutz', '/en/methodik/cross-layer-templates']) {
			expect(body).not.toContain(`${path}</loc>`);
		}
		expect(body).not.toMatch(/<loc>(?![^<]*\/en(\/|<))[^<]*<\/loc>/);
	});

	test('sitemap-de.xml bleibt DE mit EN-Alternates für registrierte Seiten', async ({
		request
	}) => {
		const body = await (await request.get('/sitemap-de.xml')).text();
		expect(body).not.toMatch(/<loc>[^<]*\/en\//);
		expect(body).toMatch(/hreflang="en" href="[^"]*\/en\/kiez\/[a-z0-9-]+"/);
	});
});

test.describe('i18n Block D1: Steckbrief-Verteilung in der Seiten-Locale', () => {
	test('/en/kiez/alexanderplatz zeigt englische Kategorien mit Prozent, keine deutschen Rohwörter', async ({
		page
	}) => {
		await page.goto('/en/kiez/alexanderplatz');
		const steckbrief = page.getByTestId('kiez-steckbrief');
		await steckbrief
			.locator('summary')
			.evaluateAll((els) => els.forEach((el) => el.parentElement?.setAttribute('open', '')));
		const text = (await steckbrief.innerText()).replace(/\s+/g, ' ');
		expect(text).toMatch(/(Low|Medium|High|Simple|Good) [^%]*\d+%/);
		expect(text).not.toMatch(/\b(Mittel|Niedrig|Hoch|Gut|Schlecht|Einfach)\b \d+%/);
	});
});
