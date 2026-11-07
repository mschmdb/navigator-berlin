import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

/*
 * Prüft das Plausible-Inline-Script aus src/app.html direkt. Kein Nachbau der
 * Guard-Logik: der Test führt genau den Code aus, den der Browser bekommt.
 */
const appHtml = readFileSync(new URL('../src/app.html', import.meta.url), 'utf8');
const inlineScript = [...appHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)]
	.map((match) => match[1])
	.find((code) => code.includes('p.fliege.dev'));

interface Visit {
	userAgent: string;
	webdriver?: boolean;
	embedded?: boolean;
}

function loadsTracker({ userAgent, webdriver = false, embedded = false }: Visit): boolean {
	if (!inlineScript) throw new Error('Plausible-Inline-Script in app.html nicht gefunden');
	const appended: unknown[] = [];
	const navigator = { userAgent, webdriver };
	const window: Record<string, unknown> = { navigator };
	window.self = window;
	window.top = embedded ? {} : window;
	const document = {
		createElement: () => ({ dataset: {} }),
		head: { appendChild: (node: unknown) => appended.push(node) }
	};
	runInNewContext(inlineScript, { window, navigator, document });
	return appended.length > 0;
}

const UA = {
	reflectionbot:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Reflectionbot/1.0 Chrome/151.0.0.0 Safari/537.36',
	googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
	googlebotSmartphone:
		'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
	bingbot:
		'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
	bytespider: 'Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)',
	headlessChrome:
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36',
	genericCrawler: 'SomeCrawler/1.0 (+https://example.org/crawler)',
	chromeDesktop:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
	firefoxDesktop:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
	safariMac:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15',
	safariIphone:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1',
	samsungInternet:
		'Mozilla/5.0 (Linux; Android 15; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
	cubotSpace:
		'Mozilla/5.0 (Linux; Android 11; CUBOT X50) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
	cubotUnderscore:
		'Mozilla/5.0 (Linux; Android 9; CUBOT_X19 Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
	cubotKingkong:
		'Mozilla/5.0 (Linux; Android 12; KINGKONG 7 Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 CUBOT'
};

describe('app.html Plausible-Bot-Guard (#184)', () => {
	it.each([
		['Reflectionbot', UA.reflectionbot],
		['Googlebot', UA.googlebot],
		['Googlebot Smartphone', UA.googlebotSmartphone],
		['bingbot', UA.bingbot],
		['Bytespider', UA.bytespider],
		['HeadlessChrome', UA.headlessChrome],
		['generischer Crawler', UA.genericCrawler]
	])('lädt den Tracker nicht für %s', (_name, userAgent) => {
		expect(loadsTracker({ userAgent })).toBe(false);
	});

	it.each([
		['Chrome Desktop', UA.chromeDesktop],
		['Firefox Desktop', UA.firefoxDesktop],
		['Safari macOS', UA.safariMac],
		['Safari iPhone', UA.safariIphone],
		['Samsung Internet', UA.samsungInternet],
		['Cubot-Handy (Leerzeichen)', UA.cubotSpace],
		['Cubot-Handy (Unterstrich)', UA.cubotUnderscore],
		['Cubot-Handy (Suffix)', UA.cubotKingkong]
	])('lädt den Tracker für %s', (_name, userAgent) => {
		expect(loadsTracker({ userAgent })).toBe(true);
	});

	it('lädt den Tracker nicht, wenn navigator.webdriver true ist', () => {
		expect(loadsTracker({ userAgent: UA.chromeDesktop, webdriver: true })).toBe(false);
	});

	it('lädt den Tracker, wenn navigator.webdriver false ist', () => {
		expect(loadsTracker({ userAgent: UA.chromeDesktop, webdriver: false })).toBe(true);
	});

	it('behält den Embed-Guard: im iframe kein Tracker', () => {
		expect(loadsTracker({ userAgent: UA.chromeDesktop, embedded: true })).toBe(false);
	});
});
