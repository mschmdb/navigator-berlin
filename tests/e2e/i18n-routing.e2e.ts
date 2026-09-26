import { test, expect, type Page } from '@playwright/test';
import {
	ELECTIONS,
	WINNERS_WECHSEL_KAPITEL,
	ANALYTIK_AGH_KIEZ
} from './fixtures/berlin-wahlen-fixtures.js';

/** `WINNERS_WECHSEL_KAPITEL` (mv-nord: 2016 SPD -> 2021 GRÜNE -> 2023(W)
 * GRÜNE) plus eine zusaetzliche "Sonstige"-Zeile auf einem zweiten echten
 * Kiez-Slug (marienfelde-nord), damit die Kapitel-Tests unten eine ECHTE
 * "Sonstige"-Partei zu uebersetzen haben (Matrix-Zeile "Glossar"/"Sonstige"). */
const WINNERS_EN_CHAPTERS = {
	...WINNERS_WECHSEL_KAPITEL,
	winners: [
		...WINNERS_WECHSEL_KAPITEL.winners,
		{
			jahr: 2023,
			gebiet_slug: 'marienfelde-nord',
			partei: 'Sonstige',
			farbe_hex: '#999999',
			anteil: 0.3,
			is_repeat_election: false,
			parent_slug: null
		}
	]
};

/** Minimalfixture, um `/en/berlin-wahlen` ohne echte DB deterministisch mit
 * genau einer sichtbaren Partei (GRÜNE) zu laden (Matrix-Zeile
 * "Datenschlüssel", `spec-i18n-b-wahlportal.md`). */
const WINNERS_EN_MATRIX_PROBE = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'kiez',
	winners: [
		{
			jahr: 2023,
			gebiet_slug: 'mv-nord',
			partei: 'GRÜNE',
			farbe_hex: '#0F6E2C',
			anteil: 0.4,
			is_repeat_election: false,
			parent_slug: null
		}
	],
	license: 'dl-de/by-2.0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

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
	// i18n Block B: /berlin-wahlen ist jetzt im Übersetzungs-Register
	// (`translation-register.ts`) eingetragen -- die Block-A-Erwartung "kein
	// hreflang=en, weil nicht übersetzt" gilt für diese Route nicht mehr.
	test('GET /berlin-wahlen: 200, lang=de, kein noindex, hreflang=en vorhanden (Block B: übersetzt)', async ({
		page
	}) => {
		const response = await page.goto('/berlin-wahlen');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			'https://navigator.berlin/en/berlin-wahlen'
		);
	});

	// i18n Block B: /berlin-wahlen hat jetzt echten EN-Content (kein DE-
	// Fallback mehr) -- indexierbar, kein Disclaimer, Switcher zeigt weiterhin
	// nach DE.
	test('GET /en/berlin-wahlen: 200, lang=en, indexierbar (kein noindex), kein Fallback-Disclaimer, Switcher auf DE', async ({
		page
	}) => {
		const response = await page.goto('/en/berlin-wahlen');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		// Entscheidung Matze 26.09. 21:06 (i18n Block B): eine echt übersetzte
		// Seite zeigt gar KEINEN Übersetzungs-Hinweis mehr (die vormalige
		// "translated"-Variante entfiel ersatzlos, siehe ADR-005).
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		// Der Wahlportal-eigene redaktionelle Disclaimer (Stimmenanteile-
		// Footnote) bleibt unabhängig davon sichtbar, wie auf der DE-Seite.
		await expect(page.getByTestId('editorial-disclaimer').first()).toBeVisible();

		const deLink = page.getByTestId('lang-switcher-link').first();
		await expect(deLink).toHaveText('Deutsch');
		await deLink.click();
		await expect(page).toHaveURL(/\/berlin-wahlen$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	});

	test('GET /en/berlin-wahlen: zeigt englischen Text, keine deutschen UI-Woerter ausserhalb des Glossars', async ({
		page
	}) => {
		await page.goto('/en/berlin-wahlen');
		const h1 = page.getByRole('heading', { level: 1 });
		await expect(h1).toBeVisible();
		const h1Text = (await h1.textContent())?.trim() ?? '';
		expect(h1Text.length).toBeGreaterThan(0);
		const bodyText = await page.locator('body').innerText();
		// Stichprobe verbotener DE-Wörter, die vor Block B ueberall standen.
		expect(bodyText).not.toMatch(/\bWahlergebnisse\b/);
		expect(bodyText).not.toMatch(/\bÜbersicht\b/);
		expect(bodyText).not.toMatch(/\bnoch nicht übersetzt\b/i);
		expect(bodyText).not.toMatch(/\bAbgeordnetenhauswahl\b/);
		expect(bodyText).not.toMatch(/\bBundestagswahl\b/);
		expect(bodyText).not.toMatch(/Datenstand:/);
		expect(bodyText).not.toMatch(/Quelle:/);
		expect(bodyText).not.toMatch(/konnte nicht geladen werden/);
		expect(bodyText).not.toMatch(/Endgültiges Ergebnis/);
		expect(bodyText).not.toMatch(/Wiederholungswahl/);
		// Glossar-Ausnahmen bleiben deutsch und duerfen vorkommen.
		expect(bodyText).toMatch(/\bKiez\b/);
	});

	// AC: "e2e-Stichprobe je Kapitel" -- Nav-Klick durch jedes Portal-Kapitel,
	// jeweils Stichprobe auf verbotene DE-Woerter statt nur den Seitenkopf.
	test('GET /en/berlin-wahlen: jedes Kapitel (Nav-Klick) zeigt englischen Text', async ({
		page
	}) => {
		await page.goto('/en/berlin-wahlen');
		const nav = page.getByTestId('kapitel-nav');
		const links = nav.locator('a');
		const count = await links.count();
		expect(count).toBeGreaterThan(0);
		for (let i = 0; i < count; i++) {
			await links.nth(i).click();
			// kurze Wartezeit fuer Scroll/Lazy-Mount (Extreme-Kapitel).
			await page.waitForTimeout(50);
		}
		const bodyText = await page.locator('body').innerText();
		expect(bodyText).not.toMatch(/\bLädt\b/);
		expect(bodyText).not.toMatch(/\bKeine Daten\b/);
		expect(bodyText).not.toMatch(/\bVeränderung\b/);
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
	// nicht übersetzt), nicht der URL-Locale -- auf WebSite-JSON-LD
	// (Root-Layout). `/en/kiez/...` ist (anders als `/en/berlin-wahlen` seit
	// Block B) weiterhin unübersetzt und bleibt deshalb das Beispiel für
	// dieses Prinzip.
	test('JSON-LD inLanguage auf /en/kiez/alexanderplatz bleibt de-DE (nicht übersetzt, WebSite-JSON-LD)', async ({
		page
	}) => {
		await page.goto('/en/kiez/alexanderplatz');
		const websiteJsonLd = await page.locator('script[data-testid="website-jsonld"]').textContent();
		expect(websiteJsonLd).not.toBeNull();
		const parsed = JSON.parse(websiteJsonLd ?? '{}') as { inLanguage?: string };
		expect(parsed.inLanguage).toBe('de-DE');
	});

	// i18n Block B: /en/berlin-wahlen und /en/berlin-wahlen/<slug> sind jetzt
	// im Übersetzungs-Register -- die effektive Locale ist `en`, JSON-LD
	// `inLanguage` muss deshalb `en-US` sein, nicht mehr `de-DE`.
	test('JSON-LD inLanguage auf /en/berlin-wahlen ist en-US (Block B: übersetzt, WebSite-JSON-LD)', async ({
		page
	}) => {
		await page.goto('/en/berlin-wahlen');
		const websiteJsonLd = await page.locator('script[data-testid="website-jsonld"]').textContent();
		expect(websiteJsonLd).not.toBeNull();
		const parsed = JSON.parse(websiteJsonLd ?? '{}') as { inLanguage?: string };
		expect(parsed.inLanguage).toBe('en-US');
	});

	test('JSON-LD inLanguage auf /en/berlin-wahlen/2023-bvv ist en-US (Block B: übersetzt, Dataset-JSON-LD)', async ({
		page
	}) => {
		await page.goto('/en/berlin-wahlen/2023-bvv');
		const dataset = await jsonLdByType(page, 'Dataset');
		expect(dataset).not.toBeNull();
		expect(dataset?.inLanguage).toBe('en-US');
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
		await expect(canonical).toHaveAttribute('href', 'https://navigator.berlin/kiez/alexanderplatz');
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

// i18n Block B (spec-i18n-b-wahlportal.md): Wahl-Detailseite + Sitemap.
test.describe('i18n Block B: Wahl-Detailseite /en/berlin-wahlen/<slug>', () => {
	test('GET /en/berlin-wahlen/2023-bvv: 200, lang=en, indexierbar, hreflang=en/de/x-default, englischer Titel', async ({
		page
	}) => {
		const response = await page.goto('/en/berlin-wahlen/2023-bvv');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
			'href',
			'https://navigator.berlin/berlin-wahlen/2023-bvv'
		);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			'https://navigator.berlin/en/berlin-wahlen/2023-bvv'
		);
		await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
			'href',
			'https://navigator.berlin/berlin-wahlen/2023-bvv'
		);
		const h1 = page.getByTestId('wahl-detail-title');
		await expect(h1).toBeVisible();
		// Kein hartes lang="de" mehr über dem jetzt englischen Titel (WCAG 3.1.2).
		await expect(h1).not.toHaveAttribute('lang', 'de');
		const bodyText = await page.locator('body').innerText();
		expect(bodyText).not.toMatch(/\bWiederholungswahl\b/);
		expect(bodyText).not.toMatch(/Quelle:/);
		expect(bodyText).not.toMatch(/Lizenz\s/);
	});

	test('/en/berlin-wahlen/2023-bvv: interne Links bleiben unter /en (Portal-Link, Bezirk-Link, Methodik-Link, Breadcrumb)', async ({
		page
	}) => {
		await page.goto('/en/berlin-wahlen/2023-bvv');
		await expect(page.getByTestId('wahl-detail-portal-link')).toHaveAttribute(
			'href',
			/^\/en\/berlin-wahlen/
		);
		await expect(page.getByTestId('wahl-detail-bezirk-mitte').locator('a')).toHaveAttribute(
			'href',
			'/en/bezirk/mitte'
		);
		await expect(page.getByTestId('wahl-detail-methodik-link')).toHaveAttribute(
			'href',
			'/en/methodik/wahldaten'
		);
		// Breadcrumb "Wahlen" (2. Link im artikeleigenen Header, kein eigenes
		// data-testid -- scope auf die Detailseite, sonst matcht auch der
		// globale Site-Header/Atlas-CTA) führt zurück auf das EN-Portal, nicht
		// auf die DE-URL.
		const breadcrumbWahlen = page.getByTestId('wahl-detail-page').locator('header a').nth(1);
		await expect(breadcrumbWahlen).toHaveAttribute('href', '/en/berlin-wahlen');
	});
});

test.describe('i18n Block B: sitemap-en.xml enthaelt die Wahlportal-URLs', () => {
	test('sitemap-en.xml enthaelt /en/berlin-wahlen und mindestens eine Detailseite mit xhtml:link-Alternates', async ({
		request
	}) => {
		const response = await request.get('/sitemap-en.xml');
		expect(response.status()).toBe(200);
		const body = await response.text();
		expect(body).toContain('https://navigator.berlin/en/berlin-wahlen</loc>');
		expect(body).toContain('/en/berlin-wahlen/2023-bvv</loc>');
		expect(body).toContain('xhtml:link rel="alternate" hreflang="de"');
		expect(body).toContain('xhtml:link rel="alternate" hreflang="en"');
		expect(body).toContain('xhtml:link rel="alternate" hreflang="x-default"');
	});
});

// Matrix-Zeile "Glossar" (spec-i18n-b-wahlportal.md): "Kiez"/"Bezirk" bleiben
// im EN-Text unübersetzt (Matze-Entscheidung), im Unterschied zu "Stimmbezirk"
// (-> "Polling district", siehe wahl-labels.ts).
test.describe('i18n Block B: Glossar-Zeile (Kiez/Bezirk bleiben deutsch)', () => {
	test('/en/berlin-wahlen: Ebene-Toggle zeigt "Kiez"/"Bezirk" woertlich, nicht "neighbourhood"/"district"', async ({
		page
	}) => {
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) =>
			route.fulfill({ json: WINNERS_EN_MATRIX_PROBE })
		);
		await page.goto('/en/berlin-wahlen');
		await expect(page.getByTestId('steuerleiste-ebene-kiez')).toHaveText('Kiez');
		await expect(page.getByTestId('steuerleiste-ebene-bezirk')).toHaveText('Bezirk');
		// Stimmbezirk (dritte Ebene) uebersetzt dagegen, Glossar-Ausnahme gilt
		// nicht dafuer.
		await expect(page.getByTestId('steuerleiste-ebene-stimmbezirk')).toHaveText(
			'Polling district'
		);
		const bodyText = await page.locator('body').innerText();
		expect(bodyText).not.toMatch(/\bneighbourhood\b/i);
	});
});

// Matrix-Zeile "Datenschlüssel" (spec-i18n-b-wahlportal.md): `?reihe=`-Werte,
// `data-testid`-Attribute und Partei-Kurznamen bleiben in beiden Sprachen
// unveraendert (kein Uebersetzen/Umbenennen von Datenschluesseln).
test.describe('i18n Block B: Datenschluessel bleiben auf /en/berlin-wahlen unveraendert', () => {
	test('?reihe=btw (Query-Wert) und data-testid bleiben unlokalisiert', async ({ page }) => {
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: { winners: [] } }));
		await page.goto('/en/berlin-wahlen?reihe=btw');
		// Query-Wert "btw" bleibt woertlich in der URL, wird nicht uebersetzt.
		await expect(page).toHaveURL(/reihe=btw/);
		// data-testid-Attribute sind Datenschluessel, bleiben deutsch-benannt.
		await expect(page.getByTestId('steuerleiste-reihe-btw')).toHaveAttribute(
			'aria-checked',
			'true'
		);
	});

	test('Partei-Kurzname GRÜNE bleibt unlokalisiert (sichtbarer Text + data-testid)', async ({
		page
	}) => {
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) =>
			route.fulfill({ json: WINNERS_EN_MATRIX_PROBE })
		);
		// Default-Reihe (agh) passt zu Jahr 2023 in der Fixture.
		await page.goto('/en/berlin-wahlen?ebene=kiez');
		await expect(page.getByTestId('winner-map-takeaway')).toContainText('GRÜNE');
		await expect(page.getByTestId('winner-map-swatch-GRÜNE')).toBeVisible();
	});
});

// Matrix-Zeile "EN-Detail: Links bleiben unter /en" (Portal-Seite statt
// Detailseite): die Methodik-Kapitel-Links (aus dem echten, prerenderten
// `data.alleWahlen`) bleiben unter /en, keine Route zeigt aus Versehen auf DE.
test.describe('i18n Block B: /en/berlin-wahlen Methodik-Kapitel-Links bleiben unter /en', () => {
	test('alle-wahlen-link-2023-bvv fuehrt auf /en/berlin-wahlen/2023-bvv', async ({ page }) => {
		await page.goto('/en/berlin-wahlen');
		await expect(page.getByTestId('alle-wahlen-link-2023-bvv')).toHaveAttribute(
			'href',
			'/en/berlin-wahlen/2023-bvv'
		);
	});

	test('Methodik-Link (Quellen-Accordion) fuehrt auf /en/methodik/wahldaten', async ({ page }) => {
		await page.goto('/en/berlin-wahlen');
		await page.getByTestId('portal-quellen-trigger').click();
		await expect(page.getByTestId('portal-quellen-methodik-link')).toHaveAttribute(
			'href',
			'/en/methodik/wahldaten'
		);
	});
});

// Matrix-Zeile "EN-Portal": "der sichtbare Text keine deutschen UI-Wörter
// außer Glossar-Ausnahmen ... (e2e-Stichprobe je Kapitel)". Ein Kapitel nach
// dem anderen: laden abwarten, dann EIN positiver EN-Text plus die 3
// namentlich genannten Verbotswoerter als Negativ-Regex.
test.describe('i18n Block B: /en/berlin-wahlen -- je Kapitel EN-Positivtext + Negativ-Regex', () => {
	test('Karte-Kapitel: "Leading party" statt "Stärkste Kraft", "Other" statt "Sonstige"', async ({
		page
	}) => {
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) =>
			route.fulfill({ json: WINNERS_EN_CHAPTERS })
		);
		await page.goto('/en/berlin-wahlen?ebene=kiez');
		const karteChapter = page.getByTestId('wahl-portal-chapter-karte');
		await expect(karteChapter.getByTestId('winner-map-canvas')).toBeVisible();
		await expect(karteChapter.getByTestId('winner-map-takeaway')).toContainText('Leading party');
		await expect(karteChapter.getByTestId('winner-map-legende')).toContainText('Other');
		const chapterText = await karteChapter.innerText();
		expect(chapterText).not.toMatch(/Stärkste Kraft/);
		expect(chapterText).not.toMatch(/\bSonstige\b/);
	});

	test('Wechsel-Kapitel: geladener Zustand zeigt EN-Text, keine der 3 Verbotswoerter', async ({
		page
	}) => {
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) =>
			route.fulfill({ json: WINNERS_EN_CHAPTERS })
		);
		await page.goto('/en/berlin-wahlen');
		const wechselChapter = page.getByTestId('wahl-portal-chapter-wechsel');
		await expect(wechselChapter.getByTestId('wechsel-kapitel-eintrag')).toBeVisible();
		await expect(wechselChapter.getByTestId('wechsel-kapitel-takeaway')).toContainText(
			'changed leading party'
		);
		const chapterText = await wechselChapter.innerText();
		expect(chapterText).not.toMatch(/Stärkste Kraft/);
		expect(chapterText).not.toMatch(/\bSonstige\b/);
		expect(chapterText).not.toMatch(/Netto-Verschiebung/);
	});

	test('Trends-Kapitel (Volatilitaets-Modus): "net shift" statt "Netto-Verschiebung"', async ({
		page
	}) => {
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) =>
			route.fulfill({ json: WINNERS_EN_CHAPTERS })
		);
		await page.route('**/api/wahl/analytik**', (route) =>
			route.fulfill({ json: ANALYTIK_AGH_KIEZ })
		);
		await page.goto('/en/berlin-wahlen');
		const trendsChapter = page.getByTestId('wahl-portal-chapter-trends');
		await expect(trendsChapter.getByTestId('trends-kapitel-canvas')).toBeVisible();
		await trendsChapter.getByTestId('trends-kapitel-toggle-volatilitaet').click();
		await expect(
			trendsChapter.getByTestId('trends-kapitel-toggle-volatilitaet')
		).toHaveAttribute('aria-checked', 'true');
		const chapterText = await trendsChapter.innerText();
		expect(chapterText).toMatch(/net shift/);
		expect(chapterText).not.toMatch(/Netto-Verschiebung/);
		expect(chapterText).not.toMatch(/Stärkste Kraft/);
		expect(chapterText).not.toMatch(/\bSonstige\b/);
	});

	test('Übergänge-Kapitel (Sankey): geladener Zustand zeigt EN-Erklaerungssatz, keine der 3 Verbotswoerter', async ({
		page
	}) => {
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) =>
			route.fulfill({ json: WINNERS_EN_CHAPTERS })
		);
		await page.route('**/api/wahl/analytik**', (route) =>
			route.fulfill({ json: ANALYTIK_AGH_KIEZ })
		);
		await page.goto('/en/berlin-wahlen');
		await page.getByTestId('kapitel-nav-link-uebergaenge').click();
		const uebergaengeChapter = page.getByTestId('wahl-portal-chapter-uebergaenge');
		await expect(uebergaengeChapter.getByTestId('sankey-wahljahre-svg')).toBeVisible();
		await expect(uebergaengeChapter.getByTestId('sankey-wahljahre-erklaerung')).toContainText(
			'leading party'
		);
		const chapterText = await uebergaengeChapter.innerText();
		expect(chapterText).not.toMatch(/Stärkste Kraft/);
		expect(chapterText).not.toMatch(/\bSonstige\b/);
		expect(chapterText).not.toMatch(/Netto-Verschiebung/);
	});
});
