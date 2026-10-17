import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { m } from '$lib/paraglide/messages.js';
import { buildPageTitle } from '$lib/seo/page-title.js';
import Page from './+page.svelte';
import { internalHrefs } from '../methodik/methodik-test-utils.js';
import { UEBER_LINKS } from './ueber-links.js';

const article = (): Element => document.querySelector('[data-testid="ueber-page"]')!;
/** Sichtbarer Fließtext ohne die sr-only-Tab-Hinweise. */
const bodyText = (): string => {
	const clone = article().cloneNode(true) as Element;
	clone.querySelectorAll('.sr-only').forEach((el) => el.remove());
	return clone.textContent ?? '';
};
const headings = (el: Element, selector: string): string[] =>
	[...el.querySelectorAll(selector)].map((h) => (h.textContent ?? '').trim());
/** Linktext ohne den sr-only-Hinweis: nur direkte Textknoten. */
const labelOf = (a: Element): string =>
	[...a.childNodes]
		.filter((n) => n.nodeType === Node.TEXT_NODE)
		.map((n) => n.textContent ?? '')
		.join('')
		.trim();
const hrefOf = (el: Element, label: string): string | null =>
	[...el.querySelectorAll('a')].find((a) => labelOf(a) === label)?.getAttribute('href') ?? null;

/** Erwartete Menge aller Link-Ziele aus `UEBER_LINKS`; interne Pfade tragen in EN das Präfix. */
const expectedHrefs = (prefix: string): string[] =>
	Object.values(UEBER_LINKS)
		.map((link) => (link.kind === 'internal' ? `${prefix}${link.path}` : link.url))
		.sort();
const actualHrefs = (el: Element): string[] =>
	[...el.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? '').sort();

const metaDescription = (): string =>
	document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';

afterEach(() => overwriteGetLocale(() => 'de'));

describe('/ueber · DE', () => {
	it('hat genau eine H1 und sieben H2 in fester Reihenfolge', () => {
		render(Page);
		expect(headings(article(), 'h1')).toEqual(['Über navigator.berlin']);
		expect(headings(article(), 'h2')).toEqual([
			'Kurz erklärt',
			'Das Projekt',
			'Wer dahinter steht',
			'Wie es gebaut wird',
			'Haltung und Grenzen',
			'Daten und Code',
			'Kontakt'
		]);
	});

	it('nennt Arbeitgeber-Abgrenzung und Finanzierung', () => {
		render(Page);
		const text = bodyText();
		expect(text).toContain('Das Projekt ist privat, mtc.berlin ist mein Arbeitgeber.');
		expect(text).toContain('Das Projekt ist privat finanziert');
		expect(text).not.toContain('Ich betreibe das Projekt privat.');
		expect(text).toContain('ohne Werbung');
		expect(text).toContain('Solutions Architect');
	});

	it('verlinkt Methodik, Daten, Code, Talk und Profile mit sprechendem Text', () => {
		render(Page);
		const el = article();
		expect(hrefOf(el, 'Methodik')).toBe('/methodik');
		expect(hrefOf(el, 'Architektur')).toBe('/architektur');
		expect(hrefOf(el, 'Lizenzen-Seite')).toBe('/lizenzen');
		expect(hrefOf(el, 'Daten-Seite')).toBe('/daten');
		expect(hrefOf(el, 'Impressum')).toBe('/impressum');
		expect(hrefOf(el, 'Datenschutz-Seite')).toBe('/datenschutz');
		expect(hrefOf(el, 'GitHub')).toBe('https://github.com/mschmdb/navigator-berlin');
		expect(hrefOf(el, 'mtc.berlin')).toBe('https://mtc.berlin');
		expect(hrefOf(el, 'schmidbauer.dev')).toBe('https://schmidbauer.dev');
		expect(hrefOf(el, 'navigator.berlin: specced, not coded')).toBe(
			'https://svelte-meetup.schmidbauer.dev'
		);
		expect(hrefOf(el, 'hey@navigator.berlin')).toBe('mailto:hey@navigator.berlin');
		expect(internalHrefs(el).filter((h) => h.startsWith('/en'))).toEqual([]);
	});

	it('der Artikel enthält genau die Links aus UEBER_LINKS', () => {
		render(Page);
		expect(actualHrefs(article())).toEqual(expectedHrefs(''));
	});

	it('externe Links tragen rel noopener und einen Tab-Hinweis; lang nur am englischen Talk-Titel', () => {
		render(Page);
		const external = [...article().querySelectorAll('a[target="_blank"]')];
		expect(external.length).toBeGreaterThan(0);
		for (const a of external) {
			expect(a.getAttribute('rel')).toContain('noopener');
			expect(a.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
			expect(a.querySelector('.sr-only')?.textContent).toContain('öffnet neuen Tab');
		}
		const talk = external.find((a) => labelOf(a).includes('specced'))!;
		expect(talk.getAttribute('lang')).toBe('en');
		expect(talk.getAttribute('hreflang')).toBe('en');
		const taz = external.find((a) => labelOf(a) === 'taz')!;
		expect(taz.hasAttribute('lang')).toBe(false);
		expect(taz.getAttribute('hreflang')).toBe('de');
		expect(external.filter((a) => a.hasAttribute('lang'))).toEqual([talk]);
	});

	it('setzt Titel (höchstens 60 Zeichen) und Beschreibung (70 bis 160 Zeichen)', () => {
		render(Page);
		expect(document.title).toBe(buildPageTitle(m.ueber_meta_title()));
		expect(document.title.length).toBeLessThanOrEqual(60);
		expect(metaDescription().length).toBeGreaterThanOrEqual(70);
		expect(metaDescription().length).toBeLessThanOrEqual(160);
	});

	it('enthält keinen Gedankenstrich (U+2014) und keine offenen Platzhalter', () => {
		render(Page);
		const text = article().textContent ?? '';
		expect(text).not.toContain('—');
		expect(text).not.toMatch(/[{}]|_start|_end||/);
	});
});

describe('/ueber · EN', () => {
	it('hat englische H1 und H2', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		expect(headings(article(), 'h1')).toEqual(['About navigator.berlin']);
		expect(headings(article(), 'h2')).toEqual([
			'In short',
			'The project',
			'Who is behind it',
			'How it is built',
			'Stance and limits',
			'Data and code',
			'Contact'
		]);
	});

	it('lokalisiert interne Links und lässt externe unverändert', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const el = article();
		expect(hrefOf(el, 'methodology')).toBe('/en/methodik');
		expect(hrefOf(el, 'Licences page')).toBe('/en/lizenzen');
		expect(hrefOf(el, 'GitHub')).toBe('https://github.com/mschmdb/navigator-berlin');
		expect(hrefOf(el, 'Heat Navigator')).toBe('/en/hitze');
		expect(hrefOf(el, 'Cold Navigator')).toBe('/en/kaelte');
	});

	it('der Artikel enthält genau die Links aus UEBER_LINKS, intern mit /en', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		expect(actualHrefs(article())).toEqual(expectedHrefs('/en'));
	});

	it('setzt englischen Titel (höchstens 60 Zeichen) und Beschreibung (70 bis 160 Zeichen)', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		expect(document.title).toBe(buildPageTitle(m.ueber_meta_title()));
		expect(document.title).toContain('About the project');
		expect(document.title.length).toBeLessThanOrEqual(60);
		expect(metaDescription().length).toBeGreaterThanOrEqual(70);
		expect(metaDescription().length).toBeLessThanOrEqual(160);
	});

	it('Tab-Hinweis ist englisch', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		expect(article().querySelector('a[target="_blank"] .sr-only')?.textContent).toContain(
			'opens in new tab'
		);
	});

	it('nennt Arbeitgeber-Abgrenzung und Finanzierung auf Englisch', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const text = bodyText();
		expect(text).toContain('mtc.berlin is my employer.');
		expect(text).toContain('The project is privately funded');
		expect(text).not.toContain('I run the project privately.');
		expect(text).not.toContain('—');
	});

	it('enthält keinen deutschen Resttext', () => {
		overwriteGetLocale(() => 'en');
		render(Page);
		const text = article().textContent ?? '';
		for (const word of [
			'Kurz erklärt',
			'Haltung',
			'Arbeitgeber',
			'privat finanziert',
			'Kontakt',
			'Eine Adresse genügt'
		]) {
			expect(text).not.toContain(word);
		}
	});
});
