import { test, expect, type Page } from '@playwright/test';

// i18n Block A (spec-i18n-a-infra-routing.md): deckt die I/O-Matrix per E2E
// gegen den echten Build ab -- Redirect-Hooks in der realen hooks.server.ts-
// Sequenz (nicht nur isolierte Resolver-Unit-Tests) + gerenderte Locale-Meta
// (lang, robots, hreflang, Disclaimer, Switcher).
//
// Reale Slugs (existieren im Prerender-Output): Kiez `alexanderplatz`, Bezirk
// `charlottenburg-wilmersdorf`, Layer `bezirke`, Wahl-Detail `2023-bvv`,
// Update `hosting-und-cookieless-analytics`.

/** JSON-LD `<script type="application/ld+json">` mit gegebenem `@type` parsen. */
async function jsonLdByType(page: Page, type: string): Promise<Record<string, unknown> | null> {
	const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
	for (const raw of scripts) {
		try {
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			if (parsed['@type'] === type) return parsed;
		} catch {
			// ignore malformed/foreign script blocks
		}
	}
	return null;
}

test.describe('i18n Block A: DE unverändert / EN-Route', () => {
	test('GET /berlin-wahlen: 200, lang=de, kein noindex, kein hreflang=en (nicht übersetzt)', async ({
		page
	}) => {
		const response = await page.goto('/berlin-wahlen');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
	});

	test('GET /en/berlin-wahlen: 200, lang=en, noindex, Disclaimer, Switcher auf DE', async ({
		page
	}) => {
		const response = await page.goto('/en/berlin-wahlen');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			'content',
			'noindex,nofollow'
		);
		await expect(page.getByTestId('translation-disclaimer').first()).toBeVisible();
		await expect(page.getByTestId('translation-disclaimer').first()).toHaveAttribute(
			'data-variant',
			'fallback-to-base'
		);

		const deLink = page.getByTestId('lang-switcher-link').first();
		await expect(deLink).toHaveText('Deutsch');
		await deLink.click();
		await expect(page).toHaveURL(/\/berlin-wahlen$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	});

	test('GET /en/kiez/alexanderplatz (AC-2): 200, lang=en, Switcher+Disclaimer; /kiez/alexanderplatz bleibt lang=de', async ({
		page
	}) => {
		const enResponse = await page.goto('/en/kiez/alexanderplatz');
		expect(enResponse?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			'content',
			'noindex,nofollow'
		);
		await expect(page.getByTestId('translation-disclaimer').first()).toBeVisible();

		const deResponse = await page.goto('/kiez/alexanderplatz');
		expect(deResponse?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	});

	test('x-default auf der DE-Seite zeigt auf die DE-Canonical', async ({ page }) => {
		await page.goto('/kiez/alexanderplatz');
		const xDefault = page.locator('link[rel="alternate"][hreflang="x-default"]');
		await expect(xDefault).toHaveAttribute('href', 'https://navigator.berlin/kiez/alexanderplatz');
	});

	// Switcher-Richtung DE→EN: Klick auf "English" auf einer DE-Seite landet
	// auf der /en-URL derselben Seite (Gegenrichtung zum bereits getesteten
	// EN→DE-Klick oben).
	test('Switcher DE→EN: Klick auf "English" auf /kiez/alexanderplatz landet auf /en/kiez/alexanderplatz', async ({
		page
	}) => {
		await page.goto('/kiez/alexanderplatz');
		const enLink = page.getByTestId('lang-switcher-link').first();
		await expect(enLink).toHaveText('English');
		await enLink.click();
		await expect(page).toHaveURL(/\/en\/kiez\/alexanderplatz$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	// JSON-LD inLanguage muss der EFFEKTIVEN Content-Locale folgen (DE, da
	// nicht übersetzt), nicht der URL-Locale -- auf WebSite-JSON-LD (Root-
	// Layout) und dem Wahl-Detail-Dataset (Page-Level JSON-LD).
	test('JSON-LD inLanguage auf /en/berlin-wahlen bleibt de-DE (WebSite-JSON-LD)', async ({
		page
	}) => {
		await page.goto('/en/berlin-wahlen');
		const websiteJsonLd = await page.locator('script[data-testid="website-jsonld"]').textContent();
		expect(websiteJsonLd).not.toBeNull();
		const parsed = JSON.parse(websiteJsonLd ?? '{}') as { inLanguage?: string };
		expect(parsed.inLanguage).toBe('de-DE');
	});

	test('JSON-LD inLanguage auf /en/berlin-wahlen/2023-bvv bleibt de-DE (Dataset-JSON-LD)', async ({
		page
	}) => {
		await page.goto('/en/berlin-wahlen/2023-bvv');
		const dataset = await jsonLdByType(page, 'Dataset');
		expect(dataset).not.toBeNull();
		expect(dataset?.inLanguage).toBe('de-DE');
	});
});

test.describe('i18n Block A: /en/... pro Route-Familie (200 + lang=en)', () => {
	const cases: readonly { name: string; path: string }[] = [
		{ name: 'Startseite', path: '/en' },
		{ name: 'bezirk/[slug]', path: '/en/bezirk/charlottenburg-wilmersdorf' },
		{ name: 'kiez/[slug]', path: '/en/kiez/alexanderplatz' },
		{ name: 'layer/[slug]', path: '/en/layer/bezirke' },
		{ name: 'berlin-wahlen/[slug]', path: '/en/berlin-wahlen/2023-bvv' },
		{ name: 'updates/[slug]', path: '/en/updates/hosting-und-cookieless-analytics' },
		{ name: 'methodik', path: '/en/methodik' },
		{ name: 'hitze', path: '/en/hitze' },
		{ name: 'explore', path: '/en/explore' }
	];

	for (const { name, path } of cases) {
		test(`${name}: GET ${path} → 200, lang=en`, async ({ page }) => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
			await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		});
	}

	// Layout-Zweig-Coverage: /explore zeigt IMMER die Atlas-Ansicht (kein
	// Atlas-CTA, kompakter Footer statt vollem Footer) -- muss auf /en/explore
	// genauso greifen wie auf /explore (Code-review-Fund: `basePathname()`
	// statt nacktem `pathname.startsWith`).
	test('/en/explore: Atlas-Layout-Zweig (kein Atlas-CTA-Button, kompakter Footer)', async ({
		page
	}) => {
		await page.goto('/en/explore');
		await expect(page.getByTestId('header-atlas-cta')).toHaveCount(0);
		const footer = page.getByTestId('meta-footer');
		await expect(footer.first()).toBeVisible();
	});

	test('/en/kiez/alexanderplatz (Nicht-Atlas-Route): zeigt den Atlas-CTA-Button', async ({
		page
	}) => {
		await page.goto('/en/kiez/alexanderplatz');
		await expect(page.getByTestId('header-atlas-cta')).toBeVisible();
	});
});

test.describe('i18n Block A: Redirects (echte hooks.server.ts-Sequenz)', () => {
	test('GET /es/kiez/alexanderplatz: 301 auf /kiez/alexanderplatz (inaktive Alt-Locale)', async ({
		request
	}) => {
		const response = await request.get('/es/kiez/alexanderplatz', { maxRedirects: 0 });
		expect(response.status()).toBe(301);
		expect(response.headers()['location']).toBe('/kiez/alexanderplatz');
	});

	// `de` ist die Basis-Locale und trägt nie einen URL-Präfix. `staleLocaleRedirectTarget`
	// (Unit-Test in `stale-locale-redirect.test.ts`) UND `handleStaleLocaleRedirect`
	// (Fake-Event-Test in `hooks.server.test.ts`) liefern für `/de/...` korrekt ein
	// 301-Ziel -- gegen einen NICHT-prerenderten Pfad (`/api/...`) greift das auch
	// live, wie unten getestet.
	//
	// Für PREREDNERTE Routen wie `/kiez/[slug]` bleibt es bei echtem `pnpm build`/
	// `pnpm preview` bei 200: Paraglides eigenes `deLocalizeUrl` (genutzt in
	// `src/hooks.ts`s `reroute`, unverändert von Block A) delokalisiert JEDEN
	// führenden Pfad-Segment das ein konfiguriertes Locale ist -- auch `de` selbst,
	// obwohl `de` gar kein echtes URL-Präfix-Pattern hat. `/de/kiez/x` reroutet damit
	// intern auf dieselbe Route wie `/kiez/x`; SvelteKits Prerender-Shortcut liefert
	// dafür die bereits gerenderte, korrekte DE-Datei aus, BEVOR `handle()` (und
	// damit `handleStaleLocaleRedirect`) überhaupt läuft. Kein SEO-Schaden (das
	// ausgelieferte HTML hat weiterhin `<link rel="canonical" href=".../kiez/x">` +
	// `lang="de"`), aber eben kein 301. Vorbestehendes Verhalten von `src/hooks.ts`
	// (nicht Teil dieser Spec, hier nur dokumentiert -- code review 2026-09-26).
	test('GET /de/kiez/alexanderplatz (prerenderte Route): 200 mit korrektem lang=de + Canonical (kein 301, siehe Kommentar)', async ({
		page
	}) => {
		const response = await page.goto('/de/kiez/alexanderplatz');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		const canonical = page.locator('link[rel="canonical"]');
		await expect(canonical).toHaveAttribute(
			'href',
			'https://navigator.berlin/kiez/alexanderplatz'
		);
	});

	// Für eine NICHT-prerenderte Route (kein Prerender-Shortcut möglich) greift
	// `handleStaleLocaleRedirect` live wie erwartet.
	test('GET /de/api/geocode (nicht prerendert): 301 auf /api/geocode', async ({ request }) => {
		const response = await request.get('/de/api/geocode?q=test', { maxRedirects: 0 });
		expect(response.status()).toBe(301);
		expect(response.headers()['location']).toBe('/api/geocode?q=test');
	});

	test('GET /es//evil.example: kein Redirect auf fremden Host (Open-Redirect-Guard)', async ({
		request
	}) => {
		const response = await request.get('/es//evil.example', { maxRedirects: 0 });
		expect(response.status()).toBe(301);
		const location = response.headers()['location'];
		expect(location).toBe('/evil.example');
		expect(location?.startsWith('//')).toBe(false);
	});

	test('GET /en/wo-lebt-es-sich-gut: 301 auf /en/umwelt-infrastruktur-score (Umbenannte Route bleibt in Locale)', async ({
		request
	}) => {
		const response = await request.get('/en/wo-lebt-es-sich-gut', { maxRedirects: 0 });
		expect(response.status()).toBe(301);
		expect(response.headers()['location']).toBe('/en/umwelt-infrastruktur-score');
	});

	test('GET /en/kiez/alexanderplatz bleibt live (kein Redirect, en ist aktive Locale)', async ({
		request
	}) => {
		const response = await request.get('/en/kiez/alexanderplatz', { maxRedirects: 0 });
		expect(response.status()).toBe(200);
	});
});
